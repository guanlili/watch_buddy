import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { useAppStore } from "@/lib/mock/store";
import type { FanType, PushChannel } from "@/lib/mock/types";
import { Check, ChevronRight, Phone, Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 注册" }] }),
  component: Onboarding,
});

const TEAMS = ["TES", "JDG", "BLG", "WBG", "T1", "GenG", "HLE", "DK", "AG", "TTG", "Faze", "NaVi", "纯路人"];
const GAMES = ["英雄联盟", "DOTA2", "CS2", "瓦罗兰特", "王者荣耀", "永劫无间"];
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
  const [step, setStep] = useState(0); // 0: login, 1-4: questions
  const [teams, setTeams] = useState<string[]>([]);
  const [players, setPlayers] = useState("");
  const [games, setGames] = useState<string[]>([]);
  const [channels, setChannels] = useState<PushChannel[]>(["app"]);
  const [timing, setTiming] = useState(30);
  const [fanType, setFanType] = useState<FanType>("diehard");
  const [aiQuip, setAiQuip] = useState<string | null>(null);

  const toggleTeam = (t: string) => {
    setTeams((cur) => {
      if (cur.includes(t)) return cur.filter((x) => x !== t);
      if (cur.length >= 3) return cur;
      const next = [...cur, t];
      setAiQuip(t === "纯路人" ? "纯路人？那今天我陪你押谁赢谁，反正菜的我喷狠的我夸。" : `${t}？行家啊，选完别改啊，万一我下次反向预测，别怪我毒奶你家主队。`);
      return next;
    });
  };

  const toggleGame = (g: string) => {
    setGames((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g]));
  };
  const toggleChannel = (c: PushChannel) => {
    setChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  };

  const finish = () => {
    setProfile({
      nickname: "兄弟",
      favoriteTeams: teams.length ? teams : ["纯路人"],
      favoritePlayers: players ? players.split(/[,，、\s]+/).filter(Boolean) : [],
      watchedGames: games.length ? games : ["英雄联盟"],
      pushChannels: channels,
      pushTiming: timing,
      fanType,
    });
    nav({ to: "/welcome-card" });
  };

  const stepTitles = ["登录", "选主队", "选选手", "选赛事", "推送偏好"];

  return (
    <main className="relative min-h-screen px-4 py-10">
      <div className="mx-auto max-w-xl">
        {/* Progress chips */}
        <div className="mb-6 flex items-center gap-2">
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
                <h2 className="font-display text-2xl glow-text-primary">你是哪边的？</h2>
                <p className="mt-1 text-sm text-muted-foreground">最多选 3 个，纯路人也算一队</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {TEAMS.map((t) => {
                    const on = teams.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTeam(t)}
                        className={`rounded-xl px-4 py-2 font-display text-sm uppercase tracking-wider transition ${
                          on ? "neon-border-primary bg-primary/40" : "border border-border bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
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
                <StepNav onBack={() => setStep(0)} onNext={() => { setAiQuip(null); setStep(2); }} disabled={teams.length === 0} />
              </GlassCard>
            )}

            {step === 2 && (
              <GlassCard glow="primary">
                <h2 className="font-display text-2xl glow-text-primary">本命选手是谁？</h2>
                <p className="mt-1 text-sm text-muted-foreground">输入名字，多个用空格隔开。跳过也行。</p>
                <input
                  value={players}
                  onChange={(e) => setPlayers(e.target.value)}
                  placeholder="Faker、Uzi、Donk…"
                  className="mt-5 w-full rounded-xl bg-white/5 px-4 py-3 font-sans text-base outline-none ring-1 ring-border focus:ring-accent"
                />
                <div className="mt-4 rounded-xl border-l-2 border-accent bg-accent/10 p-3 text-sm">
                  🐶 没事，跳过的话我默认你最爱"赛后干饭型选手"。
                </div>
                <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
              </GlassCard>
            )}

            {step === 3 && (
              <GlassCard glow="primary">
                <h2 className="font-display text-2xl glow-text-primary">关注哪些赛事？</h2>
                <p className="mt-1 text-sm text-muted-foreground">多选，我好知道啥时候给你推下饭操作集锦</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {GAMES.map((g) => {
                    const on = games.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGame(g)}
                        className={`rounded-xl px-4 py-3 text-left font-display text-sm uppercase tracking-wider transition ${
                          on ? "neon-border-accent bg-accent/30" : "border border-border bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        {on && <Check className="mb-1 h-3 w-3 text-accent" />}
                        {g}
                      </button>
                    );
                  })}
                </div>
                <StepNav onBack={() => setStep(2)} onNext={() => setStep(4)} disabled={games.length === 0} />
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
