import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { MatchStageRail } from "@/components/MatchStageRail";
import { useAppStore } from "@/lib/mock/store";
import {
  MATCH_HOME_TEAM,
  MATCH_HOME_TEAM_FULL,
  MATCH_AWAY_TEAM,
  MATCH_AWAY_TEAM_FULL,
  MATCH_LINEUP,
} from "@/lib/mock/timeline";
import {
  Share2,
  Bell,
  EyeOff,
  TrendingUp,
  Swords,
  ClipboardList,
  Siren,
  Users,
  Crosshair,
} from "lucide-react";

export const Route = createFileRoute("/pre-match")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 赛前阵地" }] }),
  component: PreMatch,
});

const KICKOFF_SECONDS = 60 * 30; // visual countdown 30 min — but in demo we tick fast

function PreMatch() {
  const profile = useAppStore((s) => s.profile);
  const nav = useNavigate();

  // 真实赛事固定对阵：成都 AG 超玩会（我方） vs 微博 WB。
  const team = MATCH_HOME_TEAM;
  const teamFull = MATCH_HOME_TEAM_FULL;
  const opponent = MATCH_AWAY_TEAM;
  const opponentFull = MATCH_AWAY_TEAM_FULL;

  const [secondsLeft, setSecondsLeft] = useState(KICKOFF_SECONDS);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 60)), 1000); // 1s = 1 in-match minute countdown
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <main className="relative min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/welcome-card"
          className="font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
        >
          ← 返回
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <div className="font-display text-xs uppercase tracking-[0.3em] text-accent">
            赛前阵地 · PRE-MATCH ARENA
          </div>
          <h1 className="title-stroke mt-2 text-4xl sm:text-5xl">
            {teamFull} vs {opponentFull}
          </h1>
          <div className="mt-1 text-xs text-muted-foreground">
            KPL 常规赛 · BO5 第一局 · 王者峡谷
          </div>
        </motion.div>

        <MatchStageRail current="pre" className="mt-5" />

        {/* Countdown */}
        <GlassCard glow="ember" className="mt-6 text-center">
          <div className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
            距离开赛
          </div>
          <div className="mt-2 font-mono text-6xl font-bold glow-text-ember">
            {mm}
            <span className="opacity-50">:</span>
            {ss}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            王者荣耀 · KPL · {team} vs {opponent}
          </div>
        </GlassCard>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <PrepSignal
            icon={ClipboardList}
            title="情报装填"
            text="双方近况、首发状态和版本点位先摆上桌。"
          />
          <PrepSignal
            icon={Siren}
            title="开赛预警"
            text={`${profile?.pushTiming ?? 30} 分钟前喊你入场，不错过 BP 和第一波节奏。`}
          />
          <PrepSignal
            icon={Users}
            title="观赛搭子"
            text="先立 Flag，等比赛开了我负责接梗和复盘。"
          />
        </div>

        {/* BP / Lineup */}
        <GlassCard glow="primary" className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-xs">
            <Crosshair className="h-3.5 w-3.5 text-accent" />
            <span className="rounded-md bg-accent/30 px-2 py-0.5 font-display uppercase tracking-wider text-accent">
              BP 阵容
            </span>
            <span className="text-muted-foreground">本场首发与英雄选择</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <LineupColumn
              title={team}
              subtitle="我方 · HOME"
              picks={MATCH_LINEUP.home}
              tone="ours"
            />
            <LineupColumn
              title={opponent}
              subtitle="对面 · AWAY"
              picks={MATCH_LINEUP.away}
              tone="theirs"
            />
          </div>
        </GlassCard>

        {/* Team matchup */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <TeamCard name={team} side="ours" winRate={62} form={["W", "W", "L", "W", "W"]} />
          <TeamCard name={opponent} side="theirs" winRate={58} form={["L", "W", "W", "L", "W"]} />
        </div>

        {/* AI prediction */}
        <GlassCard glow="accent" className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="rounded-md bg-accent/30 px-2 py-0.5 font-display uppercase tracking-wider text-accent">
              AI 毒奶预测
            </span>
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-base leading-relaxed">
            🐶 这把 <span className="font-display text-accent">{team}</span>{" "}
            的大马超推进体系版本答案，赌赢。中期可能被 {opponent}{" "}
            子墨杨戬反打一波，但只要稳住经济，21 分钟前就能推上路高地。
            <span className="ml-1 italic text-muted-foreground">（毒奶生效，反向押注请慎重）</span>
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <Stat label="一血" value={`${team} 55%`} />
            <Stat label="先拿暴君" value={`${team} 60%`} />
            <Stat label="比赛时长" value="20-25min" />
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <NeonButton variant="ember" size="lg" onClick={() => nav({ to: "/match" })}>
            <Swords className="mr-2 inline h-4 w-4" />
            直接进直播间
          </NeonButton>
          <NeonButton variant="accent">
            <Share2 className="mr-2 inline h-4 w-4" /> 一键分享
          </NeonButton>
          <NeonButton variant="primary">
            <Bell className="mr-2 inline h-4 w-4" /> 提醒好友
          </NeonButton>
        </div>

        {/* Hidden opt-out */}
        <div className="mt-10 text-center">
          <button
            onClick={() => setMuted(true)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-destructive"
          >
            <EyeOff className="h-3 w-3" /> {muted ? "已取消这场提醒" : "我不想看这场比赛"}
          </button>
        </div>
      </div>
    </main>
  );
}

function PrepSignal({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ClipboardList;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/[0.06] p-3">
      <div className="flex items-center gap-2 font-display text-xs uppercase tracking-wider text-destructive">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function LineupColumn({
  title,
  subtitle,
  picks,
  tone,
}: {
  title: string;
  subtitle: string;
  picks: { player: string; hero: string }[];
  tone: "ours" | "theirs";
}) {
  const accent = tone === "ours" ? "text-accent" : "text-destructive";
  const ring = tone === "ours" ? "border-accent/40" : "border-destructive/40";
  return (
    <div className={`rounded-xl border ${ring} bg-white/[0.03] p-3`}>
      <div className="flex items-baseline justify-between">
        <div className={`font-display text-base ${accent}`}>{title}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </div>
      </div>
      <ul className="mt-2 space-y-1.5">
        {picks.map((p) => (
          <li key={p.player} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{p.player}</span>
            <span className="font-mono">{p.hero}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamCard({
  name,
  side,
  winRate,
  form,
}: {
  name: string;
  side: "ours" | "theirs";
  winRate: number;
  form: string[];
}) {
  return (
    <GlassCard glow={side === "ours" ? "primary" : "none"}>
      <div className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
        {side === "ours" ? "我方" : "对面"}
      </div>
      <div className="mt-1 font-display text-2xl">{name}</div>
      <div className="mt-3 flex items-end gap-2">
        <div className="font-mono text-3xl font-bold text-accent">{winRate}%</div>
        <div className="pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          近期胜率
        </div>
      </div>
      <div className="mt-3 flex gap-1">
        {form.map((r, i) => (
          <span
            key={i}
            className={`grid h-6 w-6 place-items-center rounded-md font-mono text-[10px] font-bold ${
              r === "W" ? "bg-accent/30 text-accent" : "bg-destructive/30 text-destructive"
            }`}
          >
            {r}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
      <div className="text-[9px] font-display uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
