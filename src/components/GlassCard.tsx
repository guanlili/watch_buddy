import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  glow?: "primary" | "accent" | "ember" | "none";
  strong?: boolean;
  children: ReactNode;
}

export function GlassCard({ glow = "none", strong = false, className, children, ...props }: Props) {
  const glowClass = {
    primary: "neon-border-primary",
    accent: "neon-border-accent",
    ember: "neon-border-ember",
    none: "",
  }[glow];
  return (
    <div
      {...props}
      className={cn(strong ? "glass-strong" : "glass", "rounded-2xl p-5", glowClass, className)}
    >
      {children}
    </div>
  );
}
