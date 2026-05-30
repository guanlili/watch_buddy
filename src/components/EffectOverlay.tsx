import { AnimatePresence, motion } from "framer-motion";
import type { EmotionLabel } from "@/lib/mock/types";

interface Props {
  trigger: { id: number; emotion: EmotionLabel } | null;
}

export function EffectOverlay({ trigger }: Props) {
  if (!trigger) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {trigger.emotion === "ecstasy" && <ConfettiBurst key={trigger.id} />}
        {trigger.emotion === "anger" && <ExplosionFlash key={trigger.id} />}
        {trigger.emotion === "devastated" && <RainFall key={trigger.id} />}
        {trigger.emotion === "tension" && <HeartbeatPulse key={trigger.id} />}
      </AnimatePresence>
    </div>
  );
}

function ConfettiBurst() {
  const pieces = Array.from({ length: 80 });
  const colors = ["#f1c40f", "#a855f7", "#22d3ee", "#fb923c", "#ec4899"];
  return (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const dur = 2 + Math.random() * 1.5;
        const rotate = Math.random() * 360;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 6;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-10vh",
              width: size,
              height: size * 1.6,
              background: color,
              boxShadow: `0 0 8px ${color}`,
              transform: `rotate(${rotate}deg)`,
              animation: `confetti-fall ${dur}s ${delay}s linear forwards`,
              borderRadius: 2,
            }}
          />
        );
      })}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.4, 1.6, 2.4] }}
        transition={{ duration: 1.6 }}
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(255,215,80,0.5), transparent 60%)",
        }}
      />
    </motion.div>
  );
}

function ExplosionFlash() {
  return (
    <>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 1, 0] }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle, rgba(255,80,40,0.55), transparent 70%)" }}
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 8] }}
        transition={{ duration: 0.7 }}
        exit={{ opacity: 0 }}
        className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,180,60,0.9), rgba(255,60,40,0.4) 40%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />
      <div className="absolute inset-0 animate-shake" />
    </>
  );
}

function RainFall() {
  const drops = Array.from({ length: 120 });
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0"
    >
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(20,20,40,0.5), rgba(0,0,0,0.6))",
          filter: "grayscale(0.7)",
        }}
      />
      {drops.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const dur = 0.7 + Math.random() * 0.8;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: 0,
              width: 1.5,
              height: 30,
              background: "linear-gradient(180deg, transparent, rgba(180,200,220,0.7))",
              animation: `rain-fall ${dur}s ${delay}s linear infinite`,
            }}
          />
        );
      })}
    </motion.div>
  );
}

function HeartbeatPulse() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.5, 0, 0.5, 0] }}
      transition={{ duration: 1.2 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0"
      style={{ boxShadow: "inset 0 0 200px rgba(80,150,255,0.6)" }}
    />
  );
}
