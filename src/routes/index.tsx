import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { NeonButton } from "@/components/NeonButton";
import { GlassCard } from "@/components/GlassCard";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/mock/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "毒奶观察室 · 开搞！" },
      { name: "description", content: "AI 搭子陪你看球。" },
    ],
  }),
  component: WelcomePage,
});

const INTRO = "兄弟姐妹！您可算来了！我是你的赛博陪聊，比赛的时候我是你嘴替，输了跟我一起吐槽，赢了跟我一起吹。不废话了，先告诉我你是哪边的？选个主队，我立马把速效救心丸备好！";

function WelcomePage() {
  const nav = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const [typed, setTyped] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 检查是否已经有档案
    if (profile) {
      // 如果有档案，直接跳转到聊天页面
      nav({ to: "/chat" });
    } else {
      setIsChecking(false);
    }
  }, [profile, nav]);

  useEffect(() => {
    if (isChecking) return;
    
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(INTRO.slice(0, i));
      if (i >= INTRO.length) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [isChecking]);

  if (isChecking) {
    return (
      <main className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-spin">⌨️</div>
          <p className="mt-4 text-muted-foreground">正在加载…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Hero silhouette background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, oklch(0.55 0.24 295 / 0.6), transparent 50%), radial-gradient(ellipse at 80% 70%, oklch(0.78 0.18 195 / 0.5), transparent 50%), radial-gradient(ellipse at 50% 100%, oklch(0.68 0.22 40 / 0.4), transparent 60%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 scan-lines opacity-30" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="font-display text-xs uppercase tracking-[0.4em] text-accent">
            E SPORTS · AI · BUDDY
          </div>
          <h1 className="title-stroke mt-3 text-5xl sm:text-6xl">毒奶观察室</h1>
        </motion.div>

        {/* AI buddy avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative mb-6"
        >
          <div className="animate-pulse-glow grid h-32 w-32 place-items-center rounded-full glass-strong text-6xl">
            🐶⌨️
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-display uppercase tracking-wider text-accent-foreground">
            ONLINE
          </div>
        </motion.div>

        <GlassCard glow="accent" className="w-full max-w-xl">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="rounded-md bg-accent/30 px-2 py-0.5 font-display uppercase tracking-wider text-accent">AI 搭子</span>
            <span className="text-muted-foreground">正在和你打招呼…</span>
          </div>
          <p className="text-base leading-relaxed text-foreground">
            {typed}
            <span className="ml-1 inline-block h-4 w-2 bg-accent" style={{ animation: "type-cursor 0.8s infinite" }} />
          </p>
        </GlassCard>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10"
        >
          <NeonButton variant="ember" size="lg" onClick={() => nav({ to: "/onboarding" })}>
            🔥 开搞！
          </NeonButton>
        </motion.div>

        <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
          {["陪看比赛", "一起吐槽", "一起欢呼"].map((t) => (
            <div key={t} className="glass rounded-xl px-3 py-2 font-display uppercase tracking-wider">
              {t}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
