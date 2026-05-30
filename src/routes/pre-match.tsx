import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { useAppStore } from "@/lib/mock/store";
import { TOURNAMENTS } from "@/lib/mock/types";
import { Share2, Bell, EyeOff, TrendingUp, Swords } from "lucide-react";

export const Route = createFileRoute("/pre-match")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 赛前阵地" }] }),
  component: PreMatch,
});

const KICKOFF_SECONDS = 60 * 30; // visual countdown 30 min — but in demo we tick fast

function PreMatch() {
  const profile = useAppStore((s) => s.profile);
  const nav = useNavigate();
  
  // 获取用户选择的主队名称
  function getTeamName(): string {
    if (!profile) return "TES";
    
    // 如果是自定义的队伍
    if (profile.team === "custom" && profile.customTeam) {
      return profile.customTeam;
    }
    
    // 从TOURNAMENTS中找到对应的队伍
    const tournament = TOURNAMENTS.find((t) => t.id === profile.tournament);
    if (tournament) {
      const team = tournament.teams.find((t) => t.id === profile.team);
      if (team) return team.name;
    }
    
    // 兜底
    return "TES";
  }
  
  const team = getTeamName();
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
        <Link to="/welcome-card" className="font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-accent">
          ← 返回
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <div className="font-display text-xs uppercase tracking-[0.3em] text-accent">赛前阵地 · PRE-MATCH ARENA</div>
          <h1 className="title-stroke mt-2 text-4xl sm:text-5xl">{team} vs JDG</h1>
        </motion.div>

        {/* Countdown */}
        <GlassCard glow="ember" className="mt-6 text-center">
          <div className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">距离开赛</div>
          <div className="mt-2 font-mono text-6xl font-bold glow-text-ember">
            {mm}<span className="opacity-50">:</span>{ss}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">BO5 第一局 · 召唤师峡谷</div>
        </GlassCard>

        {/* Team matchup */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <TeamCard name={team} side="ours" winRate={62} form={["W", "W", "L", "W", "W"]} />
          <TeamCard name="JDG" side="theirs" winRate={58} form={["L", "W", "W", "L", "W"]} />
        </div>

        {/* AI prediction */}
        <GlassCard glow="accent" className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="rounded-md bg-accent/30 px-2 py-0.5 font-display uppercase tracking-wider text-accent">AI 毒奶预测</span>
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-base leading-relaxed">
            🐶 这把 <span className="font-display text-accent">{team}</span> 我赌赢，但中期可能崩一波。如果对面拿大龙别急，咱信偷家剧本。
            <span className="ml-1 italic text-muted-foreground">（毒奶生效，反向押注请慎重）</span>
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <Stat label="一血" value={`${team} 55%`} />
            <Stat label="先拿龙" value={`${team} 60%`} />
            <Stat label="比赛时长" value="32-38min" />
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

function TeamCard({ name, side, winRate, form }: { name: string; side: "ours" | "theirs"; winRate: number; form: string[] }) {
  return (
    <GlassCard glow={side === "ours" ? "primary" : "none"}>
      <div className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
        {side === "ours" ? "我方" : "对面"}
      </div>
      <div className="mt-1 font-display text-2xl">{name}</div>
      <div className="mt-3 flex items-end gap-2">
        <div className="font-mono text-3xl font-bold text-accent">{winRate}%</div>
        <div className="pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">近期胜率</div>
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
      <div className="text-[9px] font-display uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
