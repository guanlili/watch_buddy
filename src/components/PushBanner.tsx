import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useState } from "react";

export function PushBanner() {
  const [open, setOpen] = useState(true);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="fixed left-1/2 top-4 z-40 w-[min(560px,calc(100%-2rem))] -translate-x-1/2"
        >
          <div className="glass-strong flex items-center gap-3 rounded-2xl p-3 pr-2 neon-border-primary">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/30 text-2xl">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-widest text-accent">毒奶观察室</div>
              <div className="truncate text-sm font-semibold text-foreground">
                泉水指挥官：TES vs JDG 30 分钟后开团！
              </div>
            </div>
            <Link
              to="/pre-match"
              className="rounded-lg bg-accent/30 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-accent-foreground neon-border-accent hover:bg-accent/50"
            >
              查看
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/10"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
