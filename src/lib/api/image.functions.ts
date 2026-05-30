import { createServerFn } from "@tanstack/react-start";
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
  // 可选参考图 URL，透传给 Ark/Seedream（OpenAI 兼容端点也接受）。
  // 之后 UI 加上传入口时直接传 URL 进来即可。
  referenceImageUrl: z.string().url().optional(),
  // 复现/对比用的随机种子。
  seed: z.number().int().optional(),
  model: z.string().default("seedream-5.0-lite"),
});

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
    if (data.referenceImageUrl) {
      // Seedream/Ark 透传字段：支持 URL 数组形式的参考图。
      body.image = [data.referenceImageUrl];
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
