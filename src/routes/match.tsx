import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/lib/mock/store";
import {
  TIMELINE,
  USER_RESPONSE_PACKS,
  FALLBACK_REPLIES,
  IDLE_OPENERS,
  SPEED_OPTIONS,
  DEFAULT_SPEED,
  MATCH_DURATION_SECONDS,
  MATCH_SECONDS_PER_REAL_SECOND_1X,
  MATCH_HOME_TEAM,
  MATCH_AWAY_TEAM,
  type SpeedOption,
} from "@/lib/mock/timeline";
import { EMOTION_MAP, playBeep, speakTTS, unlockAudio } from "@/lib/mock/emotion-map";
import type { EmotionLabel, EmotionLogEntry } from "@/lib/mock/types";
import { chatCompletion, type ChatMessage } from "@/lib/api/chat.functions";
import { buildLiveMatchSystemPrompt } from "@/lib/prompts/buddy";
import { withTimeout } from "@/lib/net";
import { getDemoMode } from "@/lib/ops-config";
import { MicButton } from "@/components/MicButton";
import { Input } from "@/components/Input";
import { Chip } from "@/components/Chip";
import { EffectOverlay } from "@/components/EffectOverlay";
import { GlassCard } from "@/components/GlassCard";
import { MatchStageRail } from "@/components/MatchStageRail";
import { NeonButton } from "@/components/NeonButton";
import { ErrorState } from "@/components/StatusOverlay";
import {
  Activity,
  Gauge,
  Flame,
  Keyboard,
  Lightbulb,
  MessageCircle,
  Mic,
  Radio,
  Send,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";

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
  seconds: number; // 比赛已进行时间（秒）
  golden?: boolean;
  flagAction?: "create" | "resolve";
  flagHit?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function formatMatchTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type AgentReply = {
  text: string;
  emotion: EmotionLabel;
  intensity: 1 | 2 | 3 | 4 | 5;
  isGoldenQuote?: boolean;
};

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getInitialReplaySpeed(): SpeedOption {
  if (typeof window === "undefined") return DEFAULT_SPEED;
  const raw = Number(new URLSearchParams(window.location.search).get("speed"));
  const match = SPEED_OPTIONS.find((option) => option === raw);
  return match ?? DEFAULT_SPEED;
}

function updateReplaySpeedSearch(speed: SpeedOption) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (speed === DEFAULT_SPEED) {
    url.searchParams.delete("speed");
  } else {
    url.searchParams.set("speed", String(speed));
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function buildPromptChoices(
  input: string,
  seconds: number,
  score: { ours: number; theirs: number },
  lastEvent: string | null,
  matchEnded: boolean,
) {
  if (matchEnded) {
    if (score.ours > score.theirs) {
      return ["赢了以后先夸谁？", "这局 MVP 给谁？", "陪我复盘最后一波"];
    }
    if (score.ours < score.theirs) {
      return ["输了谁最该背锅？", "怎么安慰一下我？", "下一局还有机会吗？"];
    }
    return ["这局平得离谱", "陪我复盘一下", "下一局怎么调整？"];
  }

  const trimmed = input.trim();
  if (
    trimmed.includes("?") ||
    trimmed.includes("？") ||
    trimmed.includes("为什么") ||
    trimmed.includes("怎么")
  ) {
    return ["这波为什么能打？", "现在应该接团吗？", "谁要背锅？"];
  }
  if (trimmed.includes("赌") || trimmed.includes("预测") || trimmed.includes("flag")) {
    return ["我赌下一波小龙团能赢", "立个 Flag：这把能翻", "预测一下 MVP"];
  }
  if (trimmed.includes("崩") || trimmed.includes("输") || trimmed.includes("破防")) {
    return ["稳住，还有机会吗？", "这局还能怎么翻？", "给我一点安慰"];
  }
  if (trimmed.includes("稳") || trimmed.includes("牛") || trimmed.includes("666")) {
    return ["这波是不是起飞了？", "现在能开香槟吗？", "夸一下刚才那波"];
  }
  if (lastEvent?.includes("大龙") || lastEvent?.includes("小龙")) {
    return ["这条资源赚吗？", "下一波该怎么打？", "要不要继续逼团？"];
  }
  if (score.ours < score.theirs) {
    return ["现在落后多少？", "这局还有翻盘点吗？", "该保谁发育？"];
  }
  if (score.ours > score.theirs) {
    return ["优势怎么扩大？", "这把是不是稳了？", "下一波看谁发挥？"];
  }
  if (seconds >= 17 * 60) {
    return ["最后一波怎么打？", "谁能终结比赛？", "现在最怕什么？"];
  }
  return ["这波怎么看？", "给我预测下一波", "我有点紧张"];
}

// 仅用作 LLM 调用失败时的兜底文案。
function buildUserFeedbackFallback(
  text: string,
  seconds: number,
  score: { ours: number; theirs: number },
  lastEvent: string | null,
): AgentReply {
  const lower = text.toLowerCase();
  const nextMinuteHint = Math.max(1, Math.round(seconds / 60) + 2);
  if (["赌", "预测", "flag"].some((k) => lower.includes(k))) {
    return {
      text:
        score.ours >= score.theirs
          ? `你这个 Flag 我接了：${nextMinuteHint} 分钟前后看一波资源团，${MATCH_HOME_TEAM} 只要先手开到核心就能滚起来。`
          : `敢赌就有节目效果。现在落后也不是死局，我押 ${MATCH_HOME_TEAM} 靠边线牵扯偷一波节奏回来。`,
      emotion: "tension",
      intensity: 4,
      isGoldenQuote: true,
    };
  }

  const matchedPack = USER_RESPONSE_PACKS.find((pack) =>
    pack.keywords.some((k) => text.includes(k)),
  );
  const base = matchedPack ? pickOne(matchedPack.replies) : pickOne(FALLBACK_REPLIES);
  const scoreContext =
    score.ours === score.theirs
      ? "比分还咬着"
      : score.ours > score.theirs
        ? "我们现在有优势"
        : "我们现在落后";
  const eventContext = lastEvent ? `刚才「${lastEvent}」之后，` : "";
  const minuteContext =
    seconds >= 17 * 60
      ? "已经到后期，每一句毒奶都可能改命。"
      : seconds >= 10 * 60
        ? "中盘节奏最容易突然变天。"
        : "前期别急着下结论。";

  return {
    ...base,
    text: `${eventContext}${scoreContext}，你说得有点道理。${base.text} ${minuteContext}`,
  };
}

// 宽口径情绪词表：USER_RESPONSE_PACKS 是用来生成兜底回复的小词表，捕捉范围太窄
// （比如 "我生气了" 就漏了），所以单独维护一个更全的「检测词表」。
// 顺序敏感：先短词包后长词包会被误命中，所以高强度长词优先匹配。
const USER_EMOTION_KEYWORDS: Array<{
  emotion: EmotionLabel;
  intensity: 3 | 4 | 5;
  keywords: string[];
}> = [
  // —— anger（用户在骂 / 上火）——
  {
    emotion: "anger",
    intensity: 5,
    keywords: ["气死", "气炸", "怒了", "火大", "上头了", "破防骂人"],
  },
  {
    emotion: "anger",
    intensity: 4,
    keywords: [
      "生气",
      "我气",
      "烦躁",
      "卧槽",
      "我操",
      "我草",
      "草尼玛",
      "tm",
      "TM",
      "tmd",
      "服了",
      "什么玩意",
      "啥玩意",
      "辣鸡",
      "拉跨",
      "送的",
      "送了",
      "无语",
      "傻逼",
      "煞笔",
      "我吐了",
    ],
  },
  { emotion: "anger", intensity: 3, keywords: ["怒", "烦", "气", "燥"] },
  // —— ecstasy（上头 / 狂喜）——
  {
    emotion: "ecstasy",
    intensity: 5,
    keywords: ["yyds", "YYDS", "封神", "起飞了", "tql", "TQL"],
  },
  {
    emotion: "ecstasy",
    intensity: 4,
    keywords: ["太爽", "爽了", "嗨爆", "牛批", "牛逼", "nb", "NB", "卧槽稳", "好家伙", "舒服了"],
  },
  // —— devastated（破防 / 蓝瘦）——
  {
    emotion: "devastated",
    intensity: 4,
    keywords: ["难受", "心态炸", "心态崩了", "蓝瘦", "寄了", "完蛋", "翻车", "崩盘", "我裂开"],
  },
  { emotion: "devastated", intensity: 3, keywords: ["唉", "哭", "心态"] },
  // —— tension（紧张）——
  { emotion: "tension", intensity: 4, keywords: ["紧张", "屏息", "怕输", "心跳"] },
  { emotion: "tension", intensity: 3, keywords: ["怕", "慌", "急"] },
];

// 关键字嗅探出情绪与强度——给视觉特效/情绪日志用，文本由 LLM 出。
function inferUserReplyAffect(
  text: string,
  score: { ours: number; theirs: number },
): { emotion: EmotionLabel; intensity: 1 | 2 | 3 | 4 | 5; isGoldenQuote: boolean } {
  const lower = text.toLowerCase();
  if (["赌", "预测", "flag"].some((k) => lower.includes(k))) {
    return { emotion: "tension", intensity: 4, isGoldenQuote: true };
  }
  // 先走宽词表，命中即返回（按强度从高到低排，确保更具体的长词优先）。
  for (const pack of USER_EMOTION_KEYWORDS) {
    if (pack.keywords.some((k) => text.includes(k))) {
      return { emotion: pack.emotion, intensity: pack.intensity, isGoldenQuote: false };
    }
  }
  // 再走 USER_RESPONSE_PACKS（与兜底回复共享词表），保留旧行为。
  const matchedPack = USER_RESPONSE_PACKS.find((pack) =>
    pack.keywords.some((k) => text.includes(k)),
  );
  if (matchedPack) {
    const sample = pickOne(matchedPack.replies);
    return {
      emotion: sample.emotion,
      intensity: sample.intensity,
      isGoldenQuote: !!sample.isGoldenQuote,
    };
  }
  const diff = score.ours - score.theirs;
  if (diff <= -2) return { emotion: "devastated", intensity: 3, isGoldenQuote: false };
  if (diff >= 2) return { emotion: "ecstasy", intensity: 3, isGoldenQuote: false };
  return { emotion: "calm", intensity: 2, isGoldenQuote: false };
}

function Match() {
  const nav = useNavigate();
  const profile = useAppStore((s) => s.profile);

  // 这场是真实赛事录像：AG（我方） vs 微博，硬编码对阵以保证文本/事件一致。
  const team = MATCH_HOME_TEAM;
  const opponent = MATCH_AWAY_TEAM;
  const {
    addLog,
    addFlag,
    resolveFlag,
    setScore,
    setMatchSeconds,
    endMatch,
    resetMatch,
    score,
    matchSeconds,
    flags,
  } = useAppStore();
  const matchEnded = useAppStore((s) => s.matchEnded);
  const finalResult = useAppStore((s) => s.finalResult);

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [effect, setEffect] = useState<{ id: number; emotion: EmotionLabel } | null>(null);
  const [running, setRunning] = useState(true);
  const [eventIdx, setEventIdx] = useState(0);
  const [replying, setReplying] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [replaySpeed, setReplaySpeed] = useState(getInitialReplaySpeed);
  const [agentNotice, setAgentNotice] = useState<string | null>(null);
  // 音效 / 解说：iOS 必须先点一下解锁，之后才能自动播放。soundOn 控制开关，用 ref 给定时器读最新值。
  const [audioReady, setAudioReady] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const soundOnRef = useRef(soundOn);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastInputTime = useRef(Date.now());
  const effectIdRef = useRef(0);
  const lastEventText = useMemo(
    () => [...msgs].reverse().find((m) => m.role === "system")?.text ?? null,
    [msgs],
  );
  const promptChoices = useMemo(
    () => buildPromptChoices(input, matchSeconds, score, lastEventText, matchEnded),
    [input, matchSeconds, score, lastEventText, matchEnded],
  );

  // Reset on mount
  useEffect(() => {
    resetMatch(); /* eslint-disable-next-line */
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // Match clock — 每秒 tick 推进 (replaySpeed × 1x基准秒数) 的比赛秒。
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const advance = replaySpeed * MATCH_SECONDS_PER_REAL_SECOND_1X;
      setMatchSeconds(Math.min(MATCH_DURATION_SECONDS, matchSeconds + advance));
    }, 1000);
    return () => clearInterval(t);
  }, [running, matchSeconds, replaySpeed, setMatchSeconds]);

  // Trigger timeline events — 一个 tick 内若跨过多个事件，全部按顺序触发。
  // 读 store 的当前秒数（而不是闭包值），避免上一场残留 state 导致挂载时一口气把所有事件刷出来。
  useEffect(() => {
    const sec = useAppStore.getState().matchSeconds;
    if (eventIdx >= TIMELINE.length) {
      if (!useAppStore.getState().matchEnded) {
        const ours = useAppStore.getState().score.ours;
        const theirs = useAppStore.getState().score.theirs;
        endMatch(ours > theirs ? "win" : ours < theirs ? "loss" : "draw");
      }
      return;
    }
    let idx = eventIdx;
    while (idx < TIMELINE.length && sec >= TIMELINE[idx].seconds) {
      triggerEvent(idx);
      idx++;
    }
    if (idx !== eventIdx) setEventIdx(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchSeconds, eventIdx]);

  // Idle opener —— 赛中对话节奏：用户停说话后至少等 2~3 分钟，再主动起一句，
  // 避免连续刷屏的压迫感（每轮随机 120~180s 抖动一下，自然些）。
  const idleThresholdRef = useRef(120 + Math.random() * 60);
  useEffect(() => {
    const t = setInterval(() => {
      if (!running || useAppStore.getState().matchEnded) return;
      const idle = (Date.now() - lastInputTime.current) / 1000;
      if (idle > idleThresholdRef.current) {
        const opener = IDLE_OPENERS[Math.floor(Math.random() * IDLE_OPENERS.length)];
        pushAgent(opener.text, opener.emotion, opener.intensity, false, null);
        lastInputTime.current = Date.now();
        idleThresholdRef.current = 120 + Math.random() * 60;
      }
    }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function fireEffect(emotion: EmotionLabel) {
    effectIdRef.current += 1;
    setEffect({ id: effectIdRef.current, emotion });
    const meta = EMOTION_MAP[emotion];
    if (soundOnRef.current && meta.beepFreq) playBeep(meta.beepFreq, 0.3);
    // body shake for anger
    if (emotion === "anger") {
      document.body.classList.add("animate-shake");
      setTimeout(() => document.body.classList.remove("animate-shake"), 500);
    }
    setTimeout(() => setEffect(null), 2000);
  }

  function pushAgent(
    text: string,
    emotion: EmotionLabel,
    intensity: 1 | 2 | 3 | 4 | 5,
    golden = false,
    eventDesc: string | null,
    flagAction?: "create" | "resolve",
    flagContent?: string,
    flagHit?: boolean,
    userInput: string | null = null,
    skipEffect = false,
  ) {
    const m: ChatMsg = {
      id: uid(),
      role: "agent",
      text,
      emotion,
      intensity,
      seconds: useAppStore.getState().matchSeconds,
      golden,
      flagAction,
      flagHit,
    };
    setMsgs((cur) => [...cur, m]);

    // Determine peak
    const isPeak = intensity >= 4;
    const entry: EmotionLogEntry = {
      id: m.id,
      matchSeconds: m.seconds,
      realTime: Date.now(),
      userInput,
      agentResponse: text,
      emotion,
      intensity,
      isGoldenQuote: golden,
      eventDescription: eventDesc,
      isPeak,
    };
    addLog(entry);

    if (flagAction === "create" && flagContent) {
      addFlag({
        id: uid(),
        creator: "agent",
        content: flagContent,
        createdMinute: Math.round(m.seconds / 60),
        status: "open",
      });
    }
    if (flagAction === "resolve" && flagContent) {
      const f = useAppStore
        .getState()
        .flags.find((x) => x.content === flagContent && x.status === "open");
      if (f) resolveFlag(f.id, !!flagHit, m.seconds);
    }

    // Trigger effects + TTS in sequence (effect first, TTS slight delay)
    if (intensity >= 4 && !skipEffect) fireEffect(emotion);
    if (soundOnRef.current) setTimeout(() => speakTTS(text, { emotion, intensity }), 250);
  }

  function triggerEvent(idx: number) {
    const ev = TIMELINE[idx];
    // system bubble
    setMsgs((cur) => [...cur, { id: uid(), role: "system", text: ev.text, seconds: ev.seconds }]);
    if (ev.scoreDelta) {
      const prev = useAppStore.getState().score;
      setScore({
        ours: prev.ours + ev.scoreDelta.ours,
        theirs: prev.theirs + ev.scoreDelta.theirs,
      });
    }
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

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || replying) return;
    lastInputTime.current = Date.now();
    const seconds = useAppStore.getState().matchSeconds;
    const curScore = useAppStore.getState().score;
    // 先识别用户这条消息的情绪 / 强度，把它当作 user 气泡自带的情绪 metadata。
    const affect = inferUserReplyAffect(text, curScore);
    const nextMsgs: ChatMsg[] = [
      ...msgs,
      {
        id: uid(),
        role: "user",
        text,
        seconds,
        emotion: affect.emotion,
        intensity: affect.intensity,
      },
    ];
    setMsgs(nextMsgs);
    setInput("");
    setReplying(true);
    // 用户主动发送时立刻触发特效（>=3 让大多数有情绪的发言都能看见反馈，
    // 不只在峰值才亮）。后面 agent 回复就不再重复同一发特效，避免 1 秒内两次闪屏。
    const userTriggeredEffect = affect.intensity >= 3;
    if (userTriggeredEffect) fireEffect(affect.emotion);

    const demo = getDemoMode();

    try {
      // 演示模式开启「强制本地兜底」时，直接走预制文案，跳过云端调用，保证零延迟零失败。
      if (demo.forceLocalFallback) throw new Error("demo:forced-local");
      // 只把最近 8 条搭子/用户对话喂给 LLM；系统事件由 system prompt 概括。
      const history: ChatMessage[] = nextMsgs
        .filter((m) => m.role !== "system")
        .slice(-8)
        .map<ChatMessage>((m) => ({
          role: m.role === "agent" ? "assistant" : "user",
          content: m.text,
        }));

      const systemContent = buildLiveMatchSystemPrompt(profile, {
        ourTeam: team,
        opponent,
        minute: Math.floor(seconds / 60),
        score: curScore,
        lastEventText,
        userMood: { emotion: affect.emotion, intensity: affect.intensity },
      });

      const { reply } = await withTimeout(
        chatCompletion({
          data: { messages: [{ role: "system", content: systemContent }, ...history] },
        }),
        demo.requestTimeoutMs,
      );

      const finalText = reply || "（搭子卡壳了，再喊一句？）";
      setAgentNotice(null);
      pushAgent(
        finalText,
        affect.emotion,
        affect.intensity,
        affect.isGoldenQuote,
        lastEventText,
        undefined,
        undefined,
        undefined,
        text,
        userTriggeredEffect,
      );
    } catch {
      // API 挂了（或超时 / 演示强制兜底）就用本地文案，至少别让赛中体验断掉。
      const fallback = buildUserFeedbackFallback(text, seconds, curScore, lastEventText);
      if (!demo.forceLocalFallback) setAgentNotice("AI 连接不稳，已切换成本地兜底陪聊。");
      pushAgent(
        fallback.text,
        fallback.emotion,
        fallback.intensity,
        !!fallback.isGoldenQuote,
        lastEventText,
        undefined,
        undefined,
        undefined,
        text,
        userTriggeredEffect,
      );
    } finally {
      setReplying(false);
    }
  }

  const goldenCount = msgs.filter((m) => m.golden).length;

  function changeReplaySpeed(speed: SpeedOption) {
    setReplaySpeed(speed);
    updateReplaySpeedSearch(speed);
  }

  function handleAudioToggle() {
    if (!audioReady) {
      // iOS 需要在用户手势里解锁音频 / 语音合成，之后事件音效才会自动响。
      unlockAudio();
      setAudioReady(true);
      setSoundOn(true);
    } else {
      setSoundOn((v) => !v);
    }
  }

  return (
    <main className="relative min-h-screen px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-6">
      <EffectOverlay trigger={effect} />

      <div className="mx-auto max-w-3xl">
        <Link
          to="/pre-match"
          className="inline-block font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
        >
          ← 暂离
        </Link>

        <div className="mt-2 block">
          <MatchStageRail current="live" />
        </div>

        <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-4">
            <div className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.3em] text-accent">
              <Radio className="h-4 w-4 animate-pulse" />
              Live Booth
            </div>
            <div className="mt-3 text-2xl font-display">
              {matchEnded ? "终场哨响，情绪留档" : "直播间开麦，事件流实时滚动"}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              比分、关键团战、金句和 Flag 都会在这里同步，赛中页面要像坐在弹幕最前排。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LiveMetric
              icon={Activity}
              label="对局时间"
              value={matchEnded ? "FT" : formatMatchTime(matchSeconds)}
            />
            <LiveMetric icon={Zap} label="情绪峰值" value={`${goldenCount} 句`} />
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-accent/25 bg-accent/[0.06] p-3 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-display text-xs uppercase tracking-wider text-accent">
                <Radio className="h-4 w-4 animate-pulse" />
                Live Booth
              </div>
              <div className="mt-1 truncate text-sm text-muted-foreground">
                {matchEnded ? "终场哨响，情绪留档" : "事件流、金句和 Flag 实时滚动"}
              </div>
            </div>
            {!audioReady && (
              <button
                type="button"
                onClick={handleAudioToggle}
                className="shrink-0 rounded-lg border border-accent/50 bg-accent/15 px-3 py-2 font-display text-[11px] uppercase tracking-wider text-accent"
              >
                <Volume2 className="mr-1 inline h-3.5 w-3.5" />
                开启解说
              </button>
            )}
          </div>
        </div>

        {/* Scoreboard */}
        <GlassCard glow="primary" className="mt-0 !p-3 sm:mt-3 sm:!p-4">
          <div className="grid grid-cols-3 items-center gap-2">
            <div className="text-center">
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                {team}
              </div>
              <div className="font-mono text-3xl font-bold glow-text-accent sm:text-4xl">
                {score.ours}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-display uppercase tracking-widest text-accent">
                {matchEnded ? "比赛结束" : formatMatchTime(matchSeconds)}
              </div>
              <div className="font-display text-xl glow-text-primary sm:text-2xl">VS</div>
              <div className="mt-1 flex justify-center gap-1.5 text-[10px]">
                <span className="rounded bg-accent/20 px-1.5 py-0.5 font-mono text-accent">
                  🔥 {goldenCount} 金句
                </span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono">
                  🚩 {flags.length} Flag
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                {opponent}
              </div>
              <div className="font-mono text-3xl font-bold glow-text-ember sm:text-4xl">
                {score.theirs}
              </div>
            </div>
          </div>
          {/* progress */}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${(matchSeconds / MATCH_DURATION_SECONDS) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
            <div className="flex items-center gap-1.5 text-[10px] font-display uppercase tracking-wider text-muted-foreground">
              <Gauge className="h-3.5 w-3.5 text-accent" />
              倍速回放
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SPEED_OPTIONS.map((speed) => (
                <Chip
                  key={speed}
                  size="sm"
                  tone="muted"
                  selected={replaySpeed === speed}
                  onClick={() => changeReplaySpeed(speed)}
                >
                  {speed}x
                </Chip>
              ))}
            </div>
          </div>
        </GlassCard>

        {agentNotice && (
          <div className="mt-3">
            <ErrorState
              message={agentNotice}
              retryLabel="知道了"
              onRetry={() => setAgentNotice(null)}
            />
          </div>
        )}

        {/* Chat */}
        <div
          ref={scrollRef}
          className="scrollbar-thin glass mt-3 h-[48vh] overflow-y-auto rounded-2xl p-3 sm:mt-4 sm:h-[55vh] sm:p-4"
        >
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {msgs.map((m) => (
                <Bubble key={m.id} msg={m} />
              ))}
            </AnimatePresence>
            {replying && (
              <div className="flex items-end gap-2">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/40">
                  🐶
                </div>
                <div className="glass rounded-2xl px-4 py-2.5 text-sm text-muted-foreground">
                  <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
                  搭子正在组织语言…
                </div>
              </div>
            )}
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
        <div className="mt-3 rounded-2xl border border-border/60 bg-white/[0.03] p-2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-1 text-[11px] font-display uppercase tracking-wider text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 text-accent" />
              提示选择
            </div>
            {promptChoices.map((choice) => (
              <Chip
                key={choice}
                onClick={() => send(choice)}
                disabled={replying}
                className="max-w-full px-3 py-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{choice}</span>
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode((m) => (m === "text" ? "voice" : "text"))}
              disabled={replying}
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
                  placeholder={
                    replying
                      ? "搭子正在码字…"
                      : matchEnded
                        ? "比赛结束了，还能和搭子复盘、吐槽、庆祝…"
                        : "和搭子聊点啥… 试试 '稳' / '崩' / '菜'"
                  }
                  disabled={replying}
                  className="flex-1 rounded-xl px-4 py-3 text-base"
                />
                <NeonButton
                  variant="accent"
                  onClick={() => send()}
                  disabled={!input.trim() || replying}
                >
                  <Send className="h-4 w-4" />
                </NeonButton>
              </>
            ) : (
              <MicButton variant="bar" onTranscribe={(text) => send(text)} disabled={replying} />
            )}
          </div>
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
            <button
              onClick={handleAudioToggle}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs font-display uppercase tracking-wider hover:bg-white/10"
            >
              {!audioReady ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-accent" /> 开启解说
                </>
              ) : soundOn ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-accent" /> 音效开
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5" /> 音效关
                </>
              )}
            </button>
          </div>
          {matchEnded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <span className="font-display text-sm uppercase tracking-wider text-accent">
                <Trophy className="mr-1 inline h-4 w-4" />
                {finalResult === "win"
                  ? `${team} 获胜！`
                  : finalResult === "loss"
                    ? `${team} 落败`
                    : "平局"}
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

function LiveMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-accent/20 bg-white/[0.04] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-display uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-bold text-accent">{value}</div>
    </div>
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
        ⚡ {formatMatchTime(msg.seconds)} · {msg.text}
      </motion.div>
    );
  }
  const isUser = msg.role === "user";
  // 用户气泡：只在强度 >=3 时才挂情绪标签，平淡发言不打扰；搭子始终显示。
  const showMeta = msg.emotion && (!isUser || (msg.intensity ?? 0) >= 3);
  const meta = showMeta && msg.emotion ? EMOTION_MAP[msg.emotion] : null;
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
        {meta && (
          <div
            className={`mb-1 flex items-center gap-1.5 text-[10px] font-display uppercase tracking-wider ${
              isUser ? "justify-end" : ""
            }`}
            style={{ color: meta.color }}
          >
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
            <span className="opacity-60">强度 {msg.intensity}</span>
            {msg.golden && (
              <span className="rounded bg-accent/30 px-1.5 py-px text-accent">🔥 金句</span>
            )}
            {msg.flagAction === "create" && (
              <span className="rounded bg-primary/30 px-1.5 py-px">🚩 立 Flag</span>
            )}
            {msg.flagAction === "resolve" && (
              <span
                className={`rounded px-1.5 py-px ${msg.flagHit ? "bg-accent/30 text-accent" : "bg-destructive/30 text-destructive"}`}
              >
                {msg.flagHit ? "✅ Flag 命中" : "❌ Flag 翻车"}
              </span>
            )}
          </div>
        )}
        <div className="text-sm leading-relaxed">{msg.text}</div>
      </div>
    </motion.div>
  );
}
