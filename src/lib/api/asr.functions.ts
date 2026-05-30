import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";

const TranscribeInputSchema = z.object({
  // 16-bit little-endian mono PCM, base64-encoded.
  pcmBase64: z.string().min(1),
  sampleRate: z.number().int().positive().default(16000),
  language: z.string().default("zh"),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator(TranscribeInputSchema)
  .handler(async ({ data }) => {
    const config = getServerConfig();
    if (!config.stepApiKey) {
      throw new Error("缺少 STEP_API_KEY 环境变量，请在 .env 中配置 StepFun 的 API Key");
    }

    const res = await fetch(`${config.stepBaseUrl}/v1/audio/asr/sse`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.stepApiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        audio: {
          data: data.pcmBase64,
          input: {
            transcription: {
              model: "stepaudio-2.5-asr",
              language: data.language,
              enable_itn: true,
            },
            format: {
              type: "pcm",
              codec: "pcm_s16le",
              rate: data.sampleRate,
              bits: 16,
              channel: 1,
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`StepFun ${res.status}: ${detail.slice(0, 300) || res.statusText}`);
    }

    // SSE 响应。短音频整段拉回再解析，省得在 server fn 里手搓流式。
    const body = await res.text();
    for (const block of body.split(/\n\n/)) {
      const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const raw = dataLine.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const payload = JSON.parse(raw) as { type?: string; text?: string };
        if (payload.type === "transcript.text.done") {
          return { text: (payload.text ?? "").trim() };
        }
      } catch {
        // 非 JSON 行（注释/心跳等），跳过。
      }
    }
    return { text: "" };
  });
