import type { ComponentType, ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "accent" | "primary" | "ember";

interface LoadingOverlayProps {
  message?: string;
  tone?: Tone;
  // absolute = 覆盖最近的 relative 父容器；inline = 自身占位。
  variant?: "absolute" | "inline";
}

// 统一的全屏/局部加载遮罩。
export function LoadingOverlay({
  message,
  tone = "accent",
  variant = "absolute",
}: LoadingOverlayProps) {
  const wrap =
    variant === "absolute"
      ? "absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm rounded-[inherit]"
      : "grid place-items-center px-4 py-8";
  const toneClass =
    tone === "accent" ? "text-accent" : tone === "primary" ? "text-primary" : "text-destructive";
  return (
    <div className={wrap}>
      <div className={cn("flex flex-col items-center gap-2", toneClass)}>
        <Loader2 className="h-7 w-7 animate-spin" />
        {message && <div className="font-display text-xs uppercase tracking-widest">{message}</div>}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  // absolute 用于盖在卡片底部；inline 用于段落内联展示。
  variant?: "absolute" | "inline";
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = "重试",
  variant = "inline",
}: ErrorStateProps) {
  if (variant === "absolute") {
    return (
      <div className="absolute inset-x-2 bottom-2 rounded-lg bg-destructive/80 px-2 py-1.5 text-center text-[10px] text-destructive-foreground">
        <div>{message}</div>
        {onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="mt-1 inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 hover:bg-white/30"
          >
            <RefreshCw className="h-3 w-3" />
            {retryLabel}
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-2 text-xs text-destructive">
      <div>{message}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-destructive hover:bg-white/20"
        >
          <RefreshCw className="h-3 w-3" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="grid place-items-center px-4 py-8 text-center">
      {Icon && <Icon className="mb-2 h-10 w-10 text-muted-foreground/40" />}
      <div className="font-display text-sm text-muted-foreground">{title}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground/70">{hint}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
