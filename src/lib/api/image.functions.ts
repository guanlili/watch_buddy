import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import { join, normalize, relative } from "node:path";
import { cwd } from "node:process";
import { z } from "zod";

import { getServerConfig } from "../config.server";

// Seedream / Ark 要求像素总数 ≥ 3,686,400（1920²），所以默认走 4:5 的 1728x2160。
const SizeSchema = z
  .string()
  .regex(/^\d+x\d+$/, "size 必须形如 1024x1024")
  .default("1728x2160");

const GeneratePosterInputSchema = z.object({
  prompt: z.string().min(1).max(2000),
  size: SizeSchema,
  // 兼容旧调用：单张参考图 URL。
  referenceImageUrl: z.string().url().optional(),
  // 多张参考图。前端素材库传 /assets/poster-library/...，服务端转 base64 后发给生图端。
  referenceImageUrls: z.array(z.string().min(1)).max(14).optional(),
  // 复现/对比用的随机种子。
  seed: z.number().int().optional(),
  model: z.string().default("seedream-5.0-lite"),
});

const POSTER_LIBRARY_PREFIX = "/assets/poster-library/";

function mimeByPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function normalizeReferenceImage(input: string): Promise<string> {
  if (/^https?:\/\//i.test(input) || /^data:image\//i.test(input)) return input;
  if (!input.startsWith(POSTER_LIBRARY_PREFIX)) {
    throw new Error("参考图必须来自内置海报素材库");
  }

  const relativePath = input.replace(/^\//, "");
  const roots = [join(cwd(), "public"), join(cwd(), "dist/client")];
  let bytes: Buffer | null = null;
  for (const root of roots) {
    const fullPath = normalize(join(root, relativePath));
    const allowedRoot = normalize(join(root, POSTER_LIBRARY_PREFIX));
    const pathFromAllowedRoot = relative(allowedRoot, fullPath);
    if (pathFromAllowedRoot.startsWith("..") || pathFromAllowedRoot === "") {
      throw new Error("参考图路径非法");
    }
    try {
      bytes = await readFile(fullPath);
      break;
    } catch (e) {
      const code = e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : "";
      if (code !== "ENOENT") throw e;
    }
  }
  if (!bytes) throw new Error("参考图素材不存在");
  return `data:${mimeByPath(input)};base64,${bytes.toString("base64")}`;
}

export const generatePoster = createServerFn({ method: "POST" })
  .inputValidator(GeneratePosterInputSchema)
  .handler(async ({ data }) => {
    const config = getServerConfig();
    if (!config.tokendanceApiKey) {
      throw new Error("缺少 TOKENDANCE_API_KEY 环境变量");
    }

    const body: Record<string, unknown> = {
      model: data.model,
      prompt: data.prompt,
      n: 1,
      size: data.size,
    };
    const referenceImageUrls = [
      ...(data.referenceImageUrl ? [data.referenceImageUrl] : []),
      ...(data.referenceImageUrls ?? []),
    ];
    if (referenceImageUrls.length > 0) {
      // Seedream/Ark 字段：支持 URL / base64 数组形式的多张参考图。
      body.image = await Promise.all(referenceImageUrls.map(normalizeReferenceImage));
    }
    if (data.seed !== undefined) body.seed = data.seed;

    const res = await fetch(`${config.tokendanceBaseUrl}/v1/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.tokendanceApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Seedream ${res.status}: ${detail.slice(0, 300) || res.statusText}`);
    }

    const json = (await res.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const url = json.data?.[0]?.url;
    if (!url) throw new Error("Seedream 返回为空");
    return { url };
  });
