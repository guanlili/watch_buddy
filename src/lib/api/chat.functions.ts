import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const ChatInputSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export type ChatMessage = z.infer<typeof MessageSchema>;

export const chatCompletion = createServerFn({ method: "POST" })
  .inputValidator(ChatInputSchema)
  .handler(async ({ data }) => {
    const config = getServerConfig();
    if (!config.tokendanceApiKey) {
      throw new Error("缺少 TOKENDANCE_API_KEY 环境变量，请在 .env 中配置 TokenDance 的 API Key");
    }

    const res = await fetch(`${config.tokendanceBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.tokendanceApiKey}`,
      },
      body: JSON.stringify({
        model: data.model ?? config.tokendanceModel,
        messages: data.messages,
        temperature: data.temperature ?? 0.8,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`TokenDance ${res.status}: ${detail.slice(0, 300) || res.statusText}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { reply };
  });
