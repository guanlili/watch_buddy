import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  fillOpsTemplate,
  getOpsConfig,
  getOpsRecommendedMatches,
  getPrimaryPushTemplate,
} from "@/lib/ops-config";

export function PushBanner() {
  const [open, setOpen] = useState(true);
  const banner = useMemo(() => {
    const config = getOpsConfig();
    const primaryMatch = getOpsRecommendedMatches(config)[0];
    const template = getPrimaryPushTemplate(config);
    const vars = {
      team1: primaryMatch?.team1 ?? "主队",
      team2: primaryMatch?.team2 ?? "客队",
      tournament: primaryMatch?.tournamentName ?? "电竞赛事",
    };
    return {
      title: template.title,
      body: fillOpsTemplate(template.body, vars),
      cta: template.cta,
    };
  }, []);

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
              <div className="text-xs uppercase tracking-widest text-accent">{banner.title}</div>
              <div className="truncate text-sm font-semibold text-foreground">{banner.body}</div>
            </div>
            <Link
              to="/pre-match"
              className="rounded-lg bg-accent/30 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-accent-foreground neon-border-accent hover:bg-accent/50"
            >
              {banner.cta}
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
