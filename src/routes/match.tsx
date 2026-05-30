import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/mock/store";
import { TIMELINE, USER_RESPONSE_PACKS, FALLBACK_REPLIES, IDLE_OPENERS, SECONDS_PER_REAL_SECOND, MATCH_DURATION_MINUTES } from "@/lib/mock/timeline";
import { EMOTION_MAP, playBeep, speakTTS } from "@/lib/mock/emotion-map";
import type { EmotionLabel, EmotionLogEntry } from "@/lib/mock/types";
import { EffectOverlay } from "@/components/EffectOverlay";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Send, Trophy, Flame } from "lucide-react";

export const Route = createFileRoute("/match")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 赛中" }] }),
  component: Match,
});

interface ChatMsg {
  id: string;
  role: "system" | "user" | "agent";
  text: string;
  emotion?: EmotionLabel;
  intensity?: 1 | 2 | 3 | 4 | 5;
  minute: number;
  golden?: boolean;
  flagAction?: "create" | "resolve";
  flagHit?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function Match() {
  const nav = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const team = profile?.favoriteTeams[0] ?? "TES";
  const { addLog, addFlag, resolveFlag, setScore, setMatchMinute, endMatch, resetMatch, score, matchMinute, flags } = useAppStore();

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [effect, setEffect] = useState<{ id: number; emotion: EmotionLabel } | null>(null);
  const [running, setRunning] = useState(true);
  const [eventIdx, setEventIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastInputTime = useRef(Date.now());
  const effectIdRef = useRef(0);

  // Reset on mount
  useEffect(() => { resetMatch(); /* eslint-disable-next-line */ }, []);

  // Auto-scroll
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  // Match clock
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setMatchMinute(Math.min(MATCH_DURATION_MINUTES, matchMinute + SECONDS_PER_REAL_SECOND));
    }, 1000);
    return () => clearInterval(t);
  }, [running, matchMinute, setMatchMinute]);

  // Trigger timeline events
  useEffect(() => {
    if (eventIdx >= TIMELINE.length) {
      if (!useAppStore.getState().matchEnded) {
        const ours = useAppStore.getState().score.ours;
        const theirs = useAppStore.getState().score.theirs;
        endMatch(ours > theirs ? "win" : ours < theirs ? "loss" : "draw");
      }
      return;
    }
    const next = TIMELINE[eventIdx];
    if (matchMinute >= next.minute) {
      triggerEvent(eventIdx);
      setEventIdx(eventIdx + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchMinute, eventIdx]);

  // Idle opener
  useEffect(() => {
    const t = setInterval(() => {
      if (!running || useAppStore.getState().matchEnded) return;
      const idle = (Date.now() - lastInputTime.current) / 1000;
      if (idle > 15) {
        const opener = IDLE_OPENERS[Math.floor(Math.random() * IDLE_OPENERS.length)];
        pushAgent(opener.text, opener.emotion, opener.intensity, false, null);
        lastInputTime.current = Date.now();
      }
    }, 5000);
    return () => clearInterval(t);
  }, [running]);

  function fireEffect(emotion: EmotionLabel) {
    effectIdRef.current += 1;
    setEffect({ id: effectIdRef.current, emotion });
    const meta = EMOTION_MAP[emotion];
    if (meta.beepFreq) playBeep(meta.beepFreq, 0.3);
    // body shake for anger
    if (emotion === "anger") {
      document.body.classList.add("animate-shake");
      setTimeout(() => document.body.classList.remove("animate-shake"), 500);
    }
    setTimeout(() => setEffect(null), 2000);
  }

  function pushAgent(text: string, emotion: EmotionLabel, intensity: 1 | 2 | 3 | 4 | 5, golden = false, eventDesc: string | null, flagAction?: "create" | "resolve", flagContent?: string, flagHit?: boolean) {
    const m: ChatMsg = { id: uid(), role: "agent", text, emotion, intensity, minute: useAppStore.getState().matchMinute, golden, flagAction, flagHit };
    setMsgs((cur) => [...cur, m]);

    // Determine peak
    const isPeak = intensity >= 4;
    const entry: EmotionLogEntry = {
      id: m.id, matchMinute: m.minute, realTime: Date.now(),
      userInput: null, agentResponse: text, emotion, intensity,
      isGoldenQuote: golden, eventDescription: eventDesc, isPeak,
    };
    addLog(entry);

    if (flagAction === "create" && flagContent) {
      addFlag({ id: uid(), creator: "agent", content: flagContent, createdMinute: m.minute, status: "open" });
    }
    if (flagAction === "resolve" && flagContent) {
      const f = useAppStore.getState().flags.find((x) => x.content === flagContent && x.status === "open");
      if (f) resolveFlag(f.id, !!flagHit, m.minute);
    }

    // Trigger effects + TTS in sequence (effect first, TTS slight delay)
    if (intensity >= 4) fireEffect(emotion);
    setTimeout(() => speakTTS(text), 250);
  }

  function triggerEvent(idx: number) {
    const ev = TIMELINE[idx];
    // system bubble
    setMsgs((cur) => [...cur, { id: uid(), role: "system", text: ev.text, minute: ev.minute }]);
    if (ev.scoreDelta) setScore(ev.scoreDelta);
    // agent reaction shortly after
    setTimeout(() => {
      pushAgent(
        ev.agentReaction.text,
        ev.agentReaction.emotion,
        ev.agentReaction.intensity,
        ev.agentReaction.isGoldenQuote,
        ev.text,
        ev.agentReaction.flag?.action,
        ev.agentReaction.flag?.content,
        ev.agentReaction.flag?.hit,
      );
    }, 500);
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    lastInputTime.current = Date.now();
    const minute = useAppStore.getState().matchMinute;
    setMsgs((cur) => [...cur, { id: uid(), role: "user", text, minute }]);
    setInput("");

    // Match user reply
    let reply = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)] as { text: string; emotion: EmotionLabel; intensity: 1 | 2 | 3 | 4 | 5; isGoldenQuote?: boolean };
    for (const pack of USER_RESPONSE_PACKS) {
      if (pack.keywords.some((k) => text.includes(k))) {
        reply = pack.replies[Math.floor(Math.random() * pack.replies.length)];
        break;
      }
    }

    // Log user msg
    addLog({
      id: uid(), matchMinute: minute, realTime: Date.now(),
      userInput: text, agentResponse: reply.text, emotion: reply.emotion, intensity: reply.intensity,
      isGoldenQuote: !!reply.isGoldenQuote, eventDescription: null, isPeak: reply.intensity >= 4,
    });

    setTimeout(() => {
      pushAgent(reply.text, reply.emotion, reply.intensity, !!reply.isGoldenQuote, null);
    }, 600);
  }

  const matchEnded = useAppStore((s) => s.matchEnded);
  const finalResult = useAppStore((s) => s.finalResult);
  const goldenCount = msgs.filter((m) => m.golden).length;

  return (
    <main className="relative min-h-screen px-4 py-6">
      <EffectOverlay trigger={effect} />

      <div className="mx-auto max-w-3xl">
        <Link to="/pre-match" className="font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-accent">
          ← 暂离
        </Link>

        {/* Scoreboard */}
        <GlassCard glow="primary" className="mt-3 !p-4">
          <div className="grid grid-cols-3 items-center gap-2">
            <div className="text-center">
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">{team}</div>
              <div className="font-mono text-4xl font-bold glow-text-accent">{score.ours}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-display uppercase tracking-widest text-accent">
                {matchEnded ? "比赛结束" : `第 ${matchMinute} 分钟`}
              </div>
              <div className="font-display text-2xl glow-text-primary">VS</div>
              <div className="mt-1 flex justify-center gap-1.5 text-[10px]">
                <span className="rounded bg-accent/20 px-1.5 py-0.5 font-mono text-accent">🔥 {goldenCount} 金句</span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono">🚩 {flags.length} Flag</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">JDG</div>
              <div className="font-mono text-4xl font-bold glow-text-ember">{score.theirs}</div>
            </div>
          </div>
          {/* progress */}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${(matchMinute / MATCH_DURATION_MINUTES) * 100}%` }} />
          </div>
        </GlassCard>

        {/* Chat */}
        <div ref={scrollRef} className="scrollbar-thin glass mt-4 h-[55vh] overflow-y-auto rounded-2xl p-4">
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {msgs.map((m) => <Bubble key={m.id} msg={m} />)}
            </AnimatePresence>
            {msgs.length === 0 && (
              <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                <div>
                  <div className="text-4xl">🐶⌨️</div>
                  <div className="mt-2">搭子已就位，比赛马上开始…</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={matchEnded ? "比赛结束，去看赛后图文吧" : "和搭子聊点啥… 试试 '稳' / '崩' / '菜'"}
            disabled={matchEnded}
            className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-border focus:ring-accent disabled:opacity-50"
          />
          <NeonButton variant="accent" onClick={send} disabled={matchEnded || !input.trim()}>
            <Send className="h-4 w-4" />
          </NeonButton>
        </div>

        {/* Control / endgame */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setRunning(!running)}
              className="rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs font-display uppercase tracking-wider hover:bg-white/10"
            >
              {running ? "⏸ 暂停" : "▶ 继续"}
            </button>
          </div>
          {matchEnded && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
              <span className="font-display text-sm uppercase tracking-wider text-accent">
                <Trophy className="mr-1 inline h-4 w-4" />
                {finalResult === "win" ? `${team} 获胜！` : finalResult === "loss" ? `${team} 落败` : "平局"}
              </span>
              <NeonButton variant="ember" onClick={() => nav({ to: "/post-match" })}>
                <Flame className="mr-1 inline h-4 w-4" /> 生成赛后图文
              </NeonButton>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}

function Bubble({ msg }: { msg: ChatMsg }) {
  if (msg.role === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-md rounded-full border border-border/60 bg-white/5 px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
      >
        ⚡ {msg.minute}' · {msg.text}
      </motion.div>
    );
  }
  const isUser = msg.role === "user";
  const meta = msg.emotion ? EMOTION_MAP[msg.emotion] : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isUser ? "bg-accent/40" : "bg-primary/40"}`}>
        {isUser ? "🧑‍💻" : "🐶"}
      </div>
      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${isUser ? "bg-accent/20 neon-border-accent" : "glass neon-border-primary"}`}>
        {meta && !isUser && (
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-display uppercase tracking-wider" style={{ color: meta.color }}>
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
            <span className="opacity-60">强度 {msg.intensity}</span>
            {msg.golden && <span className="rounded bg-accent/30 px-1.5 py-px text-accent">🔥 金句</span>}
            {msg.flagAction === "create" && <span className="rounded bg-primary/30 px-1.5 py-px">🚩 立 Flag</span>}
            {msg.flagAction === "resolve" && <span className={`rounded px-1.5 py-px ${msg.flagHit ? "bg-accent/30 text-accent" : "bg-destructive/30 text-destructive"}`}>{msg.flagHit ? "✅ Flag 命中" : "❌ Flag 翻车"}</span>}
          </div>
        )}
        <div className="text-sm leading-relaxed">{msg.text}</div>
      </div>
    </motion.div>
  );
}
