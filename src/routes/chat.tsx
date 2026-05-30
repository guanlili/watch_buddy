import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { useAppStore } from "@/lib/mock/store";
import { getRecommendedMatches } from "@/lib/mock/recommended-matches";
import type { RecommendedMatch, Tournament } from "@/lib/mock/types";
import { chatCompletion, type ChatMessage } from "@/lib/api/chat.functions";
import { buildBuddySystemPrompt } from "@/lib/prompts/buddy";
import { MicButton } from "@/components/MicButton";
import { Input } from "@/components/Input";
import { Send, Play, Clock, Swords, ArrowLeft, Keyboard, Mic } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 聊天" }] }),
  component: Chat,
});

interface ChatMsg {
  id: string;
  role: "user" | "agent";
  text: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function Chat() {
  const nav = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 根据用户档案获取推荐赛事
  const recommendedMatches = profile ? getRecommendedMatches(profile) : [];

  // 初始化欢迎消息
  useEffect(() => {
    if (!profile) {
      nav({ to: "/onboarding" });
      return;
    }

    // 添加欢迎消息
    const welcomeMsg: ChatMsg = {
      id: uid(),
      role: "agent",
      text: "上线啦。今天盯哪场？底下给你推荐了几个可戳！或者直接告诉我也行。",
    };
    setMsgs([welcomeMsg]);
  }, [profile, nav]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMsg = { id: uid(), role: "user", text };
    const nextMsgs = [...msgs, userMsg];
    setMsgs(nextMsgs);
    setInput("");
    setLoading(true);

    try {
      const history: ChatMessage[] = [
        { role: "system", content: buildBuddySystemPrompt(profile) },
        ...nextMsgs.map<ChatMessage>((m) => ({
          role: m.role === "agent" ? "assistant" : "user",
          content: m.text,
        })),
      ];
      const { reply } = await chatCompletion({ data: { messages: history } });
      const agentMsg: ChatMsg = {
        id: uid(),
        role: "agent",
        text: reply || "（搭子卡壳了，再说一遍？）",
      };
      setMsgs((cur) => [...cur, agentMsg]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setMsgs((cur) => [...cur, { id: uid(), role: "agent", text: `搭子掉线了：${detail}` }]);
    } finally {
      setLoading(false);
    }
  }

  // 点击推荐赛事
  function handleMatchClick(match: RecommendedMatch) {
    const text = `我想看${match.tournamentName}的${match.team1} vs ${match.team2}`;
    send(text);
  }

  return (
    <main className="relative min-h-screen px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/welcome-card"
            className="flex items-center gap-1 text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回
          </Link>
          <div className="font-display text-xs uppercase tracking-[0.3em] text-accent">
            E SPORTS · AI · BUDDY
          </div>
          <Link
            to="/pre-match"
            className="flex items-center gap-1 text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-accent"
          >
            赛前阵地
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>

        {/* Chat */}
        <div
          ref={scrollRef}
          className="scrollbar-thin glass h-[60vh] overflow-y-auto rounded-2xl p-4"
        >
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {msgs.map((m) => (
                <Bubble key={m.id} msg={m} />
              ))}
              {loading && <TypingBubble key="__typing" />}
            </AnimatePresence>
          </div>
        </div>

        {/* 推荐赛事 */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-muted-foreground">
              <Play className="h-3.5 w-3.5 text-accent" />
              推荐赛事
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {recommendedMatches.map((match) => (
              <motion.button
                key={match.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMatchClick(match)}
                className="flex shrink-0 flex-col gap-2 rounded-2xl border border-border bg-white/5 p-3 text-left transition hover:border-accent/70 hover:bg-accent/10"
                style={{ minWidth: "220px" }}
              >
                <div className="flex items-center gap-2">
                  {match.isLive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/30 px-2 py-0.5 text-[10px] font-display uppercase tracking-wider text-destructive">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive"></span>
                      直播中
                    </span>
                  )}
                  {!match.isLive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {getMatchTimeText(match.startTime)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{match.tournamentName}</div>
                <div className="font-display text-sm">
                  {match.team1}
                  <span className="mx-1 text-muted-foreground">vs</span>
                  {match.team2}
                </div>
              </motion.button>
            ))}
          </div>

          {/* 直接进赛场按钮 */}
          <div className="mt-4">
            <NeonButton variant="ember" size="lg" onClick={() => nav({ to: "/pre-match" })}>
              <Swords className="mr-2 inline h-4 w-4" />
              直接进赛前阵地
            </NeonButton>
          </div>
        </div>

        {/* Input */}
        <div className="mt-4 rounded-2xl border border-border/60 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode((m) => (m === "text" ? "voice" : "text"))}
              disabled={loading}
              title={inputMode === "text" ? "切换到语音输入" : "切换到键盘输入"}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-white/5 transition hover:border-accent/70 hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inputMode === "text" ? (
                <Mic className="h-5 w-5" />
              ) : (
                <Keyboard className="h-5 w-5" />
              )}
            </button>
            {inputMode === "text" ? (
              <>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={loading ? "搭子正在码字…" : "和搭子聊点啥…"}
                  disabled={loading}
                  className="flex-1 rounded-xl px-4 py-3 text-base"
                />
                <NeonButton
                  variant="accent"
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                >
                  <Send className="h-4 w-4" />
                </NeonButton>
              </>
            ) : (
              <MicButton variant="bar" onTranscribe={(text) => send(text)} disabled={loading} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-2"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/40">🐶</div>
      <div className="glass neon-border-primary rounded-2xl px-4 py-2.5">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]"></span>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]"></span>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"></span>
        </div>
      </div>
    </motion.div>
  );
}

function Bubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isUser ? "bg-accent/40" : "bg-primary/40"}`}
      >
        {isUser ? "🧑‍💻" : "🐶"}
      </div>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${isUser ? "bg-accent/20 neon-border-accent" : "glass neon-border-primary"}`}
      >
        <div className="text-sm leading-relaxed">{msg.text}</div>
      </div>
    </motion.div>
  );
}

function getMatchTimeText(startTime: number): string {
  const now = Date.now();
  const diff = startTime - now;

  if (diff < 0) {
    const minutesAgo = Math.floor(-diff / (60 * 1000));
    if (minutesAgo < 60) {
      return `${minutesAgo}分钟前开始`;
    } else {
      const hoursAgo = Math.floor(minutesAgo / 60);
      return `${hoursAgo}小时前开始`;
    }
  } else {
    const minutesLeft = Math.floor(diff / (60 * 1000));
    if (minutesLeft < 60) {
      return `${minutesLeft}分钟后开始`;
    } else {
      const hoursLeft = Math.floor(minutesLeft / 60);
      const remainingMinutes = minutesLeft % 60;
      if (remainingMinutes === 0) {
        return `${hoursLeft}小时后开始`;
      }
      return `${hoursLeft}小时${remainingMinutes}分钟后开始`;
    }
  }
}
