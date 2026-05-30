import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipTone = "accent" | "primary" | "ember" | "muted";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  tone?: ChipTone;
  size?: "sm" | "md";
  children: ReactNode;
}

// 可选 / 推荐项小药丸。统一替代多个地方手写的"border + rounded-full"按钮。
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, tone = "accent", size = "md", className, children, ...props },
  ref,
) {
  const tones: Record<ChipTone, string> = {
    accent: selected
      ? "border-accent bg-accent/20 text-accent"
      : "border-border bg-white/5 text-foreground hover:border-accent/70 hover:bg-accent/10",
    primary: selected
      ? "border-primary bg-primary/20 text-primary"
      : "border-border bg-white/5 text-foreground hover:border-primary/70 hover:bg-primary/10",
    ember: selected
      ? "border-destructive bg-destructive/20 text-destructive"
      : "border-border bg-white/5 text-foreground hover:border-destructive/70 hover:bg-destructive/10",
    muted: selected
      ? "border-foreground/40 bg-white/10 text-foreground"
      : "border-border bg-white/5 text-muted-foreground hover:bg-white/10",
  };
  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
});
