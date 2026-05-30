import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/mock/store";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { EMOTION_MAP } from "@/lib/mock/emotion-map";
import { Copy, Share2, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/post-match")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 赛后图文" }] }),
  component: PostMatch,
});

function PostMatch() {
  const profile = useAppStore((s) => s.profile);
  const logs = useAppStore((s) => s.logs);
  const score = useAppStore((s) => s.score);
  const flags = useAppStore((s) => s.flags);
  const finalResult = useAppStore((s) => s.finalResult);
  const nav = useNavigate();
  const team = profile?.favoriteTeams[0] ?? "TES";

  const [selectedPoster, setSelectedPoster] = useState<0 | 1 | 2>(0);
  const [tier, setTier] = useState<"light" | "deep">("light");

  const goldenQuotes = useMemo(
    () => logs.filter((l) => l.isGoldenQuote && l.agentResponse).slice(0, 5),
    [logs],
  );
  const userQuotes = useMemo(
    () => logs.filter((l) => l.userInput).map((l) => l.userInput!).filter((q, i, arr) => arr.indexOf(q) === i),
    [logs],
  );
  const peaks = logs.filter((l) => l.isPeak);

  if (logs.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <GlassCard glow="primary" className="max-w-md text-center">
          <p>还没有赛中数据，先看一场比赛吧。</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/match"><NeonButton variant="accent">去看比赛</NeonButton></Link>
            <Link to="/"><NeonButton variant="ghost">回大厅</NeonButton></Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  const lightCopy = goldenQuotes[0]?.agentResponse ?? `${team} 这把不容易，反正我吐槽完了。`;
  const deepCopy = `【${team} ${finalResult === "win" ? "胜" : finalResult === "loss" ? "负" : "平"} JDG · ${score.ours}-${score.theirs}】

赛前我赌 ${team} 拿一血塔，${flags.find((f) => f.content.includes("一血塔"))?.status === "hit" ? "押中了" : "翻车了"}。
中期那波 0换4 直接给我看破防，AD 站位站到对面脸上去了。
但是 ${finalResult === "win" ? "那波偷家真的封神，电竞没有早知道，只有真情实感。" : "结局是结局，我的态度不变。"}

最帅的瞬间：${peaks[0]?.eventDescription ?? "全程都帅"}
最破防瞬间：${peaks.find((p) => p.emotion === "devastated")?.eventDescription ?? "无"}

#${team} #毒奶观察室 #英雄联盟`;

  const copyText = tier === "light" ? lightCopy : deepCopy;

  function doCopy() {
    navigator.clipboard.writeText(copyText).then(() => toast.success("文案已复制，去贴朋友圈！"));
  }

  return (
    <main className="relative min-h-screen px-4 py-10">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-4xl">
        <Link to="/match" className="font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-accent">
          ← 返回赛场
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <div className="font-display text-xs uppercase tracking-[0.3em] text-accent">赛后剧场 · POST-MATCH STUDIO</div>
          <h1 className="title-stroke mt-2 text-4xl sm:text-5xl">
            {finalResult === "win" ? "🏆 这场，归你" : finalResult === "loss" ? "💔 这场，破防" : "🤝 这场，平局"}
          </h1>
        </motion.div>

        {/* Emotion curve */}
        <GlassCard glow="primary" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-sm uppercase tracking-wider">情绪曲线</div>
            <div className="flex gap-2 text-[10px]">
              {(["ecstasy", "anger", "devastated", "tension", "calm"] as const).map((k) => (
                <div key={k} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: EMOTION_MAP[k].color }} />
                  <span className="text-muted-foreground">{EMOTION_MAP[k].label}</span>
                </div>
              ))}
            </div>
          </div>
          <EmotionCurve />
        </GlassCard>

        {/* Posters */}
        <div className="mt-6">
          <div className="mb-3 font-display text-sm uppercase tracking-wider">个性化海报（三选一）</div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => setSelectedPoster(i as 0 | 1 | 2)}
                className={`overflow-hidden rounded-2xl transition ${selectedPoster === i ? "ring-2 ring-accent neon-border-accent" : "ring-1 ring-border"}`}
              >
                <Poster variant={i as 0 | 1 | 2} team={team} score={score} finalResult={finalResult} goldenQuote={goldenQuotes[i % Math.max(1, goldenQuotes.length)]?.agentResponse ?? userQuotes[0] ?? "电竞真好"} userQuote={userQuotes[i % Math.max(1, userQuotes.length)] ?? "稳了"} />
              </button>
            ))}
          </div>
        </div>

        {/* Copy tier */}
        <GlassCard glow="accent" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-sm uppercase tracking-wider">配套文案</div>
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {(["light", "deep"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`rounded px-3 py-1 text-xs font-display uppercase tracking-wider transition ${tier === t ? "bg-accent/40 text-accent" : "text-muted-foreground"}`}
                >
                  {t === "light" ? "轻量·一句话" : "深度·叙事"}
                </button>
              ))}
            </div>
          </div>
          <pre className="whitespace-pre-wrap rounded-xl bg-black/30 p-4 font-sans text-sm leading-relaxed">{copyText}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <NeonButton variant="accent" onClick={doCopy}><Copy className="mr-1 inline h-4 w-4" />复制文案</NeonButton>
            <NeonButton variant="primary"><Share2 className="mr-1 inline h-4 w-4" />一键分享</NeonButton>
            <NeonButton variant="ghost" onClick={() => nav({ to: "/" })}>回大厅</NeonButton>
          </div>
        </GlassCard>

        {/* Highlights & flags */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <GlassCard>
            <div className="mb-2 flex items-center gap-2 font-display text-sm uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-accent" /> 高光金句
            </div>
            <ul className="space-y-2 text-sm">
              {goldenQuotes.map((q) => (
                <li key={q.id} className="rounded-lg bg-white/5 p-2">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">{q.matchMinute}' · {EMOTION_MAP[q.emotion].label}</div>
                  <div>"{q.agentResponse}"</div>
                </li>
              ))}
              {goldenQuotes.length === 0 && <li className="text-muted-foreground">这场没攒下金句</li>}
            </ul>
          </GlassCard>
          <GlassCard>
            <div className="mb-2 flex items-center gap-2 font-display text-sm uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-accent" /> Flag 战绩
            </div>
            <ul className="space-y-2 text-sm">
              {flags.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-lg bg-white/5 p-2">
                  <span>🚩 {f.content}</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-display uppercase ${f.status === "hit" ? "bg-accent/30 text-accent" : f.status === "miss" ? "bg-destructive/30 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {f.status === "hit" ? "✅ 命中" : f.status === "miss" ? "❌ 翻车" : "⏳ 未结"}
                  </span>
                </li>
              ))}
              {flags.length === 0 && <li className="text-muted-foreground">这场没立 Flag</li>}
            </ul>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}

function EmotionCurve() {
  const logs = useAppStore((s) => s.logs);
  const w = 720, h = 180, pad = 30;
  if (logs.length === 0) return <div className="text-muted-foreground">无数据</div>;
  const maxMin = Math.max(...logs.map((l) => l.matchMinute), 45);
  const pts = logs.map((l) => ({
    x: pad + (l.matchMinute / maxMin) * (w - pad * 2),
    y: h - pad - ((l.intensity - 1) / 4) * (h - pad * 2),
    log: l,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[600px]">
        {/* grid */}
        {[1, 2, 3, 4, 5].map((lvl) => {
          const y = h - pad - ((lvl - 1) / 4) * (h - pad * 2);
          return (
            <g key={lvl}>
              <line x1={pad} x2={w - pad} y1={y} y2={y} stroke="oklch(1 0 0 / 0.06)" strokeDasharray="2 4" />
              <text x={4} y={y + 3} fill="oklch(0.7 0.04 280)" fontSize="9" fontFamily="JetBrains Mono">{lvl}</text>
            </g>
          );
        })}
        {/* line */}
        <path d={path} fill="none" stroke="url(#grad)" strokeWidth="2.5" />
        <defs>
          <linearGradient id="grad" x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.55 0.24 295)" />
            <stop offset="1" stopColor="oklch(0.78 0.18 195)" />
          </linearGradient>
        </defs>
        {/* peak dots */}
        {pts.map((p) => p.log.isPeak && (
          <g key={p.log.id}>
            <circle cx={p.x} cy={p.y} r={5} fill={EMOTION_MAP[p.log.emotion].color as string} stroke="white" strokeWidth="1" />
          </g>
        ))}
        {/* x labels */}
        <text x={pad} y={h - 8} fill="oklch(0.7 0.04 280)" fontSize="9" fontFamily="JetBrains Mono">0'</text>
        <text x={w - pad - 10} y={h - 8} fill="oklch(0.7 0.04 280)" fontSize="9" fontFamily="JetBrains Mono">{maxMin}'</text>
      </svg>
    </div>
  );
}

function Poster({ variant, team, score, finalResult, goldenQuote, userQuote }: { variant: 0 | 1 | 2; team: string; score: { ours: number; theirs: number }; finalResult: string | null; goldenQuote: string; userQuote: string }) {
  const styles = [
    { name: "荣耀叙事", bg: "linear-gradient(135deg, oklch(0.3 0.15 295), oklch(0.15 0.08 230))", accent: "var(--ecstasy)" },
    { name: "吐槽梗图", bg: "linear-gradient(135deg, oklch(0.25 0.18 30), oklch(0.15 0.05 285))", accent: "var(--anger)" },
    { name: "复盘理性", bg: "linear-gradient(135deg, oklch(0.18 0.05 200), oklch(0.1 0.03 270))", accent: "var(--accent)" },
  ];
  const s = styles[variant];
  return (
    <div className="relative aspect-[4/5] overflow-hidden p-4 text-left" style={{ background: s.bg }}>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full" style={{ background: s.accent, opacity: 0.25, filter: "blur(28px)" }} />
      <div className="relative flex h-full flex-col justify-between">
        <div>
          <div className="font-display text-[9px] uppercase tracking-widest opacity-70">{s.name}</div>
          <div className="mt-1 font-display text-2xl font-bold" style={{ color: s.accent }}>{team}</div>
          <div className="mt-1 font-mono text-3xl font-bold">{score.ours} : {score.theirs}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-70">vs JDG · {finalResult === "win" ? "WIN" : finalResult === "loss" ? "LOSS" : "DRAW"}</div>
        </div>
        <div>
          <div className="rounded-lg border-l-2 px-2 py-1 text-xs italic" style={{ borderColor: s.accent }}>
            "{(variant === 1 ? userQuote : goldenQuote).slice(0, 36)}"
          </div>
          <div className="mt-2 text-[9px] uppercase tracking-widest opacity-50">毒奶观察室 · 个人专属</div>
        </div>
      </div>
    </div>
  );
}
