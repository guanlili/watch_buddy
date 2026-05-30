import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "ember" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function NeonButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: Props) {
  const variants: Record<string, string> = {
    primary: "bg-primary/30 text-foreground neon-border-primary hover:bg-primary/50",
    accent: "bg-accent/20 text-accent-foreground neon-border-accent hover:bg-accent/40",
    ember: "bg-destructive/25 text-foreground neon-border-ember hover:bg-destructive/45",
    ghost: "bg-transparent border border-border text-foreground hover:bg-white/5",
  };
  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };
  return (
    <button
      {...props}
      className={cn(
        "relative font-display uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
