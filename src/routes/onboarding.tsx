import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { useAppStore } from "@/lib/mock/store";
import type { FanType, PushChannel } from "@/lib/mock/types";
import { TOURNAMENTS } from "@/lib/mock/types";
import { Check, ChevronRight, Phone, Mail, MessageCircle, Plus } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 注册" }] }),
  component: Onboarding,
});

const CHANNELS: { value: PushChannel; label: string; icon: typeof Phone }[] = [
  { value: "wechat", label: "微信推送", icon: MessageCircle },
  { value: "app", label: "App 通知", icon: Phone },
  { value: "email", label: "邮件", icon: Mail },
];
const FAN_TYPES: { value: FanType; label: string; desc: string }[] = [
  { value: "diehard", label: "死忠粉", desc: "主队就是天，永远站队" },
  { value: "roaster", label: "吐槽型", desc: "敢喷敢笑，梗王本人" },
  { value: "rational", label: "理性型", desc: "数据派，看完会复盘" },
];

function Onboarding() {
  const nav = useNavigate();
  const setProfile = useAppStore((s) => s.setProfile);
  const [step, setStep] = useState(0); // 0: login, 1: tournament, 2: team, 3: player, 4: preferences
  
  // 状态
  const [tournament, setTournament] = useState<string>("");
  const [customTournament, setCustomTournament] = useState<string>("");
  const [showCustomTournament, setShowCustomTournament] = useState(false);
  
  const [team, setTeam] = useState<string>("");
  const [customTeam, setCustomTeam] = useState<string>("");
  const [showCustomTeam, setShowCustomTeam] = useState(false);
  
  const [player, setPlayer] = useState<string>("");
  const [customPlayer, setCustomPlayer] = useState<string>("");
  const [showCustomPlayer, setShowCustomPlayer] = useState(false);
  
  const [channels, setChannels] = useState<PushChannel[]>(["app"]);
  const [timing, setTiming] = useState(30);
  const [fanType, setFanType] = useState<FanType>("diehard");
  const [aiQuip, setAiQuip] = useState<string | null>(null);

  // 获取当前选中的赛事数据
  const selectedTournament = TOURNAMENTS.find(t => t.id === tournament);
  
  // 获取当前选中的主队数据
  const selectedTeam = selectedTournament?.teams.find(t => t.id === team);

  const toggleChannel = (c: PushChannel) => {
    setChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  };

  const selectTournament = (id: string) => {
    setTournament(id);
    setTeam(""); // 重置主队
    setPlayer(""); // 重置选手
    setAiQuip(TOURNAMENTS.find(t => t.id === id) ? `${TOURNAMENTS.find(t => t.id === id)?.name}？行家啊，接下来选个主队吧。` : null);
  };

  const selectTeam = (id: string) => {
    setTeam(id);
    setPlayer(""); // 重置选手
    const teamName = selectedTournament?.teams.find(t => t.id === id)?.name;
    setAiQuip(teamName ? `${teamName}？有眼光！选个本命选手吧。` : null);
  };

  const selectPlayer = (id: string) => {
    setPlayer(id);
    const playerName = selectedTeam?.players.find(p => p.id === id)?.name;
    setAiQuip(playerName ? `${playerName}！我也超喜欢他，准备好一起看比赛了吗？` : null);
  };

  const finish = () => {
    setProfile({
      nickname: "兄弟",
      tournament,
      team,
      player,
      customTournament: showCustomTournament ? customTournament : undefined,
      customTeam: showCustomTeam ? customTeam : undefined,
      customPlayer: showCustomPlayer ? customPlayer : undefined,
      pushChannels: channels,
      pushTiming: timing,
      fanType,
    });
    nav({ to: "/welcome-card" });
  };

  const stepTitles = ["登录", "选择赛事", "选择主队", "选择选手", "推送偏好"];

  return (
    <main className="relative min-h-screen px-4 py-10">
      <div className="mx-auto max-w-xl">
        {/* Progress chips */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          {stepTitles.map((t, i) => (
            <div
              key={t}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-[10px] uppercase tracking-wider ${
                i === step ? "neon-border-accent bg-accent/20 text-accent" : i < step ? "border border-primary/50 bg-primary/20 text-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              {i < step && <Check className="h-3 w-3" />}
              {t}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <GlassCard glow="accent">
                <h2 className="font-display text-2xl glow-text-accent">登录 / 注册</h2>
                <p className="mt-1 text-sm text-muted-foreground">选个口子进，三秒搞定</p>
                <div className="mt-6 grid gap-3">
                  {[
                    { icon: Phone, label: "手机号一键登录", emoji: "📱" },
                    { icon: MessageCircle, label: "微信登录", emoji: "💚" },
                    { icon: Mail, label: "邮箱注册", emoji: "✉️" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setStep(1)}
                      className="glass flex items-center justify-between rounded-xl p-4 transition hover:neon-border-accent"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="font-display text-sm uppercase tracking-wider">{opt.label}</span>
                      </span>
                      <ChevronRight className="h-5 w-5 text-accent" />
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {step === 1 && (
              <GlassCard glow="primary">
                <h2 className="font-display text-2xl glow-text-primary">关注哪个赛事？</h2>
                <p className="mt-1 text-sm text-muted-foreground">选择你喜欢的赛事，或者自己添加</p>
                
                {!showCustomTournament ? (
                  <>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {TOURNAMENTS.map((t) => {
                        const on = tournament === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => selectTournament(t.id)}
                            className={`rounded-xl px-4 py-2 font-display text-sm uppercase tracking-wider transition ${
                              on ? "neon-border-primary bg-primary/40" : "border border-border bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setShowCustomTournament(true)}
                        className="flex items-center gap-1 rounded-xl px-4 py-2 border border-border bg-white/5 hover:bg-white/10 font-display text-sm uppercase tracking-wider transition"
                      >
                        <Plus className="h-4 w-4" /> 自定义
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-5">
                    <input
                      value={customTournament}
                      onChange={(e) => setCustomTournament(e.target.value)}
                      placeholder="输入赛事名称"
                      className="w-full rounded-xl bg-white/5 px-4 py-3 font-sans text-base outline-none ring-1 ring-border focus:ring-accent"
                    />
                    <div className="mt-3 flex gap-2">
                      <NeonButton variant="ghost" onClick={() => { setShowCustomTournament(false); setCustomTournament(""); }}>取消</NeonButton>
                      <NeonButton variant="accent" onClick={() => { setTournament("custom"); setAiQuip(`${customTournament}？好的，接下来选个主队吧。`); }}>确定</NeonButton>
                    </div>
                  </div>
                )}

                {aiQuip && (
                  <motion.div
                    key={aiQuip}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border-l-2 border-accent bg-accent/10 p-3 text-sm"
                  >
                    🐶 {aiQuip}
                  </motion.div>
                )}
                
                <StepNav onBack={() => setStep(0)} onNext={() => { setAiQuip(null); setStep(2); }} disabled={!tournament} />
              </GlassCard>
            )}

            {step === 2 && (
              <GlassCard glow="primary">
                <h2 className="font-display text-2xl glow-text-primary">支持哪个队伍？</h2>
                <p className="mt-1 text-sm text-muted-foreground">选择你的主队，或者自己添加</p>
                
                {!showCustomTeam ? (
                  <>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedTournament?.teams.map((t) => {
                        const on = team === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => selectTeam(t.id)}
                            className={`rounded-xl px-4 py-2 font-display text-sm uppercase tracking-wider transition ${
                              on ? "neon-border-primary bg-primary/40" : "border border-border bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setShowCustomTeam(true)}
                        className="flex items-center gap-1 rounded-xl px-4 py-2 border border-border bg-white/5 hover:bg-white/10 font-display text-sm uppercase tracking-wider transition"
                      >
                        <Plus className="h-4 w-4" /> 自定义
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-5">
                    <input
                      value={customTeam}
                      onChange={(e) => setCustomTeam(e.target.value)}
                      placeholder="输入主队名称"
                      className="w-full rounded-xl bg-white/5 px-4 py-3 font-sans text-base outline-none ring-1 ring-border focus:ring-accent"
                    />
                    <div className="mt-3 flex gap-2">
                      <NeonButton variant="ghost" onClick={() => { setShowCustomTeam(false); setCustomTeam(""); }}>取消</NeonButton>
                      <NeonButton variant="accent" onClick={() => { setTeam("custom"); setAiQuip(`${customTeam}？有眼光！选个本命选手吧。`); }}>确定</NeonButton>
                    </div>
                  </div>
                )}

                {aiQuip && (
                  <motion.div
                    key={aiQuip}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border-l-2 border-accent bg-accent/10 p-3 text-sm"
                  >
                    🐶 {aiQuip}
                  </motion.div>
                )}
                
                <StepNav onBack={() => setStep(1)} onNext={() => { setAiQuip(null); setStep(3); }} disabled={!team} />
              </GlassCard>
            )}

            {step === 3 && (
              <GlassCard glow="primary">
                <h2 className="font-display text-2xl glow-text-primary">本命选手是谁？</h2>
                <p className="mt-1 text-sm text-muted-foreground">选择你最喜欢的选手，或者自己添加</p>
                
                {!showCustomPlayer ? (
                  <>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedTeam?.players.map((p) => {
                        const on = player === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => selectPlayer(p.id)}
                            className={`rounded-xl px-4 py-2 font-display text-sm uppercase tracking-wider transition ${
                              on ? "neon-border-primary bg-primary/40" : "border border-border bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setShowCustomPlayer(true)}
                        className="flex items-center gap-1 rounded-xl px-4 py-2 border border-border bg-white/5 hover:bg-white/10 font-display text-sm uppercase tracking-wider transition"
                      >
                        <Plus className="h-4 w-4" /> 自定义
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-5">
                    <input
                      value={customPlayer}
                      onChange={(e) => setCustomPlayer(e.target.value)}
                      placeholder="输入选手名称"
                      className="w-full rounded-xl bg-white/5 px-4 py-3 font-sans text-base outline-none ring-1 ring-border focus:ring-accent"
                    />
                    <div className="mt-3 flex gap-2">
                      <NeonButton variant="ghost" onClick={() => { setShowCustomPlayer(false); setCustomPlayer(""); }}>取消</NeonButton>
                      <NeonButton variant="accent" onClick={() => { setPlayer("custom"); setAiQuip(`${customPlayer}！我也超喜欢他，准备好一起看比赛了吗？`); }}>确定</NeonButton>
                    </div>
                  </div>
                )}

                {aiQuip && (
                  <motion.div
                    key={aiQuip}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border-l-2 border-accent bg-accent/10 p-3 text-sm"
                  >
                    🐶 {aiQuip}
                  </motion.div>
                )}
                
                <StepNav onBack={() => setStep(2)} onNext={() => { setAiQuip(null); setStep(4); }} disabled={!player} />
              </GlassCard>
            )}

            {step === 4 && (
              <GlassCard glow="primary">
                <h2 className="font-display text-2xl glow-text-primary">推送偏好</h2>
                <p className="mt-1 text-sm text-muted-foreground">不会半夜叫醒你，除非你选了 LCK</p>

                <div className="mt-5">
                  <div className="mb-2 text-xs font-display uppercase tracking-wider text-muted-foreground">推送渠道</div>
                  <div className="grid grid-cols-3 gap-2">
                    {CHANNELS.map(({ value, label, icon: Icon }) => {
                      const on = channels.includes(value);
                      return (
                        <button
                          key={value}
                          onClick={() => toggleChannel(value)}
                          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 transition ${
                            on ? "neon-border-accent bg-accent/30" : "border border-border bg-white/5"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-display text-[11px] uppercase tracking-wider">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 text-xs font-display uppercase tracking-wider text-muted-foreground">提前提醒</div>
                  <div className="flex gap-2">
                    {[15, 30, 60].map((m) => (
                      <button
                        key={m}
                        onClick={() => setTiming(m)}
                        className={`flex-1 rounded-xl px-3 py-2 font-mono text-sm transition ${
                          timing === m ? "neon-border-primary bg-primary/40" : "border border-border bg-white/5"
                        }`}
                      >
                        {m} 分钟
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 text-xs font-display uppercase tracking-wider text-muted-foreground">你是哪种球迷？</div>
                  <div className="grid gap-2">
                    {FAN_TYPES.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFanType(f.value)}
                        className={`rounded-xl px-4 py-3 text-left transition ${
                          fanType === f.value ? "neon-border-primary bg-primary/30" : "border border-border bg-white/5"
                        }`}
                      >
                        <div className="font-display text-sm uppercase tracking-wider">{f.label}</div>
                        <div className="text-xs text-muted-foreground">{f.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-between gap-3">
                  <NeonButton variant="ghost" onClick={() => setStep(3)}>上一步</NeonButton>
                  <NeonButton variant="ember" size="lg" onClick={finish}>🔥 搞定，开冲</NeonButton>
                </div>
              </GlassCard>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function StepNav({ onBack, onNext, disabled }: { onBack: () => void; onNext: () => void; disabled?: boolean }) {
  return (
    <div className="mt-6 flex justify-between gap-3">
      <NeonButton variant="ghost" onClick={onBack}>上一步</NeonButton>
      <NeonButton variant="accent" onClick={onNext} disabled={disabled}>下一步</NeonButton>
    </div>
  );
}
