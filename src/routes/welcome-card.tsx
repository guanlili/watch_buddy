import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/mock/store";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { speakTTS } from "@/lib/mock/emotion-map";
import { TOURNAMENTS } from "@/lib/mock/types";
import { Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/welcome-card")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 欢迎加入" }] }),
  component: WelcomeCard,
});

function WelcomeCard() {
  const profile = useAppStore((s) => s.profile);
  const nav = useNavigate();
  const [typed, setTyped] = useState("");

  // 获取显示名称
  const getDisplayName = () => {
    if (!profile) return { tournament: "", team: "", player: "" };
    
    let tournamentName = profile.customTournament || "";
    let teamName = profile.customTeam || "";
    let playerName = profile.customPlayer || "";
    
    if (profile.tournament !== "custom") {
      const tournament = TOURNAMENTS.find(t => t.id === profile.tournament);
      if (tournament) {
        tournamentName = tournament.name;
        
        if (profile.team !== "custom") {
          const team = tournament.teams.find(t => t.id === profile.team);
          if (team) {
            teamName = team.name;
            
            if (profile.player !== "custom") {
              const player = team.players.find(p => p.id === profile.player);
              if (player) {
                playerName = player.name;
              }
            }
          }
        }
      }
    }
    
    return { tournament: tournamentName, team: teamName, player: playerName };
  };

  const { tournament, team, player } = getDisplayName();
  const greeting = `行家啊！选了 ${tournament}${team ? `，支持 ${team}` : ""}${player ? `，本命是 ${player}` : ""}。${player ? `下次 ${player} 开赛我第一个冲！` : "下次主队比赛我第一时间叫你！"}先给你推一条赛前提醒，准备好瓜子。`;

  useEffect(() => {
    if (!profile) {
      nav({ to: "/onboarding" });
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(greeting.slice(0, i));
      if (i >= greeting.length) clearInterval(t);
    }, 35);
    setTimeout(() => speakTTS(greeting), 200);
    return () => clearInterval(t);
  }, []);

  if (!profile) return null;

  return (
    <main className="relative min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 18 }}
        >
          {/* Poster */}
          <div className="relative overflow-hidden rounded-3xl">
            <div
              className="relative p-8"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.25 0.12 295) 0%, oklch(0.15 0.08 285) 50%, oklch(0.1 0.05 200) 100%)",
              }}
            >
              {/* Decoration */}
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-destructive/30 blur-3xl" />

              <div className="relative flex items-center gap-2 text-xs font-display uppercase tracking-[0.4em] text-accent">
                <Sparkles className="h-4 w-4" /> Official Member
              </div>
              <h1 className="title-stroke relative mt-3 text-3xl sm:text-5xl">
                恭喜！你已正式加入<br />
                <span className="text-accent glow-text-accent">【毒奶观察室】</span>
              </h1>

              <div className="relative mt-6 flex flex-wrap items-center gap-3">
                {tournament && (
                  <div className="glass-strong flex items-center gap-2 rounded-2xl px-4 py-2">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">赛事</div>
                      <div className="font-display text-sm">{tournament}</div>
                    </div>
                  </div>
                )}
                {team && (
                  <div className="glass-strong flex items-center gap-2 rounded-2xl px-4 py-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    <div>
                      <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">主队</div>
                      <div className="font-display text-sm">{team}</div>
                    </div>
                  </div>
                )}
                {player && (
                  <div className="glass-strong flex items-center gap-2 rounded-2xl px-4 py-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">本命选手</div>
                      <div className="font-display text-sm">{player}</div>
                    </div>
                  </div>
                )}
                <div className="glass-strong flex items-center gap-2 rounded-2xl px-4 py-2">
                  <span className="text-2xl">📡</span>
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">提醒</div>
                    <div className="font-display text-sm">开赛前 {profile.pushTiming} 分钟</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <GlassCard glow="accent" className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="rounded-md bg-accent/30 px-2 py-0.5 font-display uppercase tracking-wider text-accent">AI 搭子</span>
              <span className="text-muted-foreground">正在播报…</span>
            </div>
            <p className="text-base leading-relaxed">
              {typed}
              <span className="ml-1 inline-block h-4 w-2 bg-accent" style={{ animation: "type-cursor 0.8s infinite" }} />
            </p>
          </GlassCard>

          {/* Demo push preview */}
          <div className="mt-6">
            <div className="mb-2 text-xs font-display uppercase tracking-wider text-muted-foreground">📬 一条示例赛前提醒</div>
            <GlassCard glow="primary">
              <div className="text-xs uppercase tracking-widest text-accent">毒奶观察室</div>
              <div className="mt-1 font-display text-lg">
                泉水指挥官：{team || "你的主队"} 比赛还有 {profile.pushTiming} 分钟！
              </div>
              <p className="mt-1 text-sm text-muted-foreground">点开查看双方数据 + 我的毒奶预测</p>
            </GlassCard>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Link to="/onboarding">
              <NeonButton variant="ghost">改设置</NeonButton>
            </Link>
            <NeonButton variant="ember" size="lg" onClick={() => nav({ to: "/pre-match" })}>
              进赛前阵地 →
            </NeonButton>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
