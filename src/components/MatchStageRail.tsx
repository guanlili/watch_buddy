import { Link } from "@tanstack/react-router";
import { CalendarClock, Clapperboard, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "pre" | "live" | "post";

interface Props {
  current: Stage;
  className?: string;
}

const stages: Array<{
  id: Stage;
  label: string;
  title: string;
  tone: string;
  to: "/pre-match" | "/match" | "/post-match";
  icon: typeof CalendarClock;
}> = [
  {
    id: "pre",
    label: "赛前",
    title: "情报 / 毒奶 / 提醒",
    tone: "from-destructive/60 to-primary/50",
    to: "/pre-match",
    icon: CalendarClock,
  },
  {
    id: "live",
    label: "赛中",
    title: "比分 / 事件 / 陪聊",
    tone: "from-accent/70 to-primary/50",
    to: "/match",
    icon: Radio,
  },
  {
    id: "post",
    label: "赛后",
    title: "复盘 / 金句 / 海报",
    tone: "from-ecstasy/70 to-accent/40",
    to: "/post-match",
    icon: Clapperboard,
  },
];

export function MatchStageRail({ current, className }: Props) {
  return (
    <nav
      aria-label="比赛阶段"
      className={cn(
        "grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-black/20 p-2",
        className,
      )}
    >
      {stages.map((stage) => {
        const Icon = stage.icon;
        const active = stage.id === current;

        return (
          <Link
            key={stage.id}
            to={stage.to}
            className={cn(
              "group relative overflow-hidden rounded-xl border px-3 py-3 transition",
              active
                ? "border-accent/70 bg-white/10 text-foreground"
                : "border-white/5 bg-white/[0.03] text-muted-foreground hover:border-accent/40 hover:bg-white/[0.06]",
            )}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                stage.tone,
                active ? "opacity-100" : "opacity-35 group-hover:opacity-70",
              )}
            />
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
                  active
                    ? "border-accent/50 bg-accent/20 text-accent"
                    : "border-white/10 bg-white/5",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-sm">{stage.label}</span>
                <span className="block truncate text-[11px]">{stage.title}</span>
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
