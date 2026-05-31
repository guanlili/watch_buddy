import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Loader2, Mic } from "lucide-react";
import { toast } from "sonner";

import { transcribeAudio } from "@/lib/api/asr.functions";
import { VoiceRecorder } from "@/lib/audio/recorder";
import { withTimeout } from "@/lib/net";
import { getDemoMode } from "@/lib/ops-config";
import { cn } from "@/lib/utils";

// 微信式按住说话：
// - pointerdown 开始录音
// - 上滑超过阈值进入「松开取消」状态
// - pointerup 在「录音中」状态发送，在「取消区」状态丢弃
// - pointercancel（系统中断）一律取消
type RecState = "idle" | "recording" | "cancel-armed" | "transcribing";

const CANCEL_SLIDE_PX = 60;

interface MicButtonProps {
  onTranscribe: (text: string) => void;
  disabled?: boolean;
  // 录音过短判定阈值（ms），默认 400。低于此值视作误触。
  minDurationMs?: number;
  // compact = 12x12 方块图标按钮；bar = 横向自适应宽条，带"按住说话"文字
  variant?: "compact" | "bar";
}

export function MicButton({
  onTranscribe,
  disabled,
  minDurationMs = 400,
  variant = "compact",
}: MicButtonProps) {
  const [state, setState] = useState<RecState>("idle");
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const startYRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);

  function isActive(s: RecState): s is "recording" | "cancel-armed" {
    return s === "recording" || s === "cancel-armed";
  }

  async function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (disabled || state !== "idle") return;
    e.preventDefault();
    // 捕获指针，让后续 move/up 即使滑出按钮也仍然派发到这里。
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerRef.current = e.pointerId;
    startYRef.current = e.clientY;
    try {
      recorderRef.current = await VoiceRecorder.start();
      setState("recording");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`麦克风启动失败：${msg}`);
      activePointerRef.current = null;
    }
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!isActive(state)) return;
    if (e.pointerId !== activePointerRef.current) return;
    const dy = startYRef.current - e.clientY; // 上滑为正
    if (dy > CANCEL_SLIDE_PX && state === "recording") {
      setState("cancel-armed");
    } else if (dy <= CANCEL_SLIDE_PX && state === "cancel-armed") {
      setState("recording");
    }
  }

  async function handlePointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!isActive(state)) return;
    if (e.pointerId !== activePointerRef.current) return;
    activePointerRef.current = null;
    const rec = recorderRef.current;
    if (!rec) {
      setState("idle");
      return;
    }

    if (state === "cancel-armed") {
      rec.cancel();
      recorderRef.current = null;
      setState("idle");
      toast.info("已取消");
      return;
    }

    setState("transcribing");
    try {
      const audio = await rec.stop();
      if (audio.durationMs < minDurationMs) {
        toast.warning("说话时间太短");
        return;
      }
      const { text } = await withTimeout(
        transcribeAudio({
          data: { pcmBase64: audio.pcmBase64, sampleRate: audio.sampleRate },
        }),
        getDemoMode().requestTimeoutMs,
      );
      const cleaned = text.trim();
      if (cleaned) onTranscribe(cleaned);
      else toast.warning("没听清，再说一遍？");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`语音识别失败：${msg}`);
    } finally {
      recorderRef.current = null;
      setState("idle");
    }
  }

  function handlePointerCancel() {
    activePointerRef.current = null;
    recorderRef.current?.cancel();
    recorderRef.current = null;
    setState("idle");
  }

  const isRecording = state === "recording";
  const isCancelArmed = state === "cancel-armed";
  const isTranscribing = state === "transcribing";
  const isHolding = isRecording || isCancelArmed;

  const sharedHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onContextMenu: (e: ReactPointerEvent<HTMLButtonElement>) => e.preventDefault(),
  };

  if (variant === "bar") {
    return (
      <>
        <button
          type="button"
          {...sharedHandlers}
          disabled={disabled || isTranscribing}
          className={cn(
            "flex h-12 flex-1 items-center justify-center gap-2 select-none touch-none rounded-xl border font-display text-sm tracking-wider transition",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isHolding &&
              (isCancelArmed
                ? "border-destructive bg-destructive/30 text-destructive"
                : "border-accent bg-accent/30 text-accent"),
            isTranscribing && "border-accent/60 bg-accent/10 text-accent",
            !isHolding &&
              !isTranscribing &&
              "border-border bg-white/5 hover:border-accent/70 hover:bg-accent/10",
          )}
        >
          {isTranscribing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>识别中…</span>
            </>
          ) : (
            <>
              <Mic className={cn("h-4 w-4", isHolding && "animate-pulse")} />
              <span>{isCancelArmed ? "松开取消" : isHolding ? "正在录音…" : "按住说话"}</span>
            </>
          )}
        </button>
        {isHolding && <RecordingOverlay cancelArmed={isCancelArmed} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        {...sharedHandlers}
        disabled={disabled || isTranscribing}
        title="按住说话 · 上滑取消"
        className={cn(
          "grid h-12 w-12 shrink-0 select-none touch-none place-items-center rounded-xl border transition",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isHolding && "scale-110 border-accent bg-accent/30 text-accent",
          isTranscribing && "border-accent/60 bg-accent/10 text-accent",
          !isHolding &&
            !isTranscribing &&
            "border-border bg-white/5 hover:border-accent/70 hover:bg-accent/10",
        )}
      >
        {isTranscribing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Mic className={cn("h-5 w-5", isHolding && "animate-pulse")} />
        )}
      </button>
      {isHolding && <RecordingOverlay cancelArmed={isCancelArmed} />}
    </>
  );
}

function RecordingOverlay({ cancelArmed }: { cancelArmed: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-3xl px-10 py-8 shadow-2xl transition",
          cancelArmed
            ? "bg-destructive/90 text-destructive-foreground"
            : "bg-accent/90 text-accent-foreground",
        )}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white/20">
          {cancelArmed ? (
            <span className="font-display text-3xl">✕</span>
          ) : (
            <div className="flex items-end gap-1">
              <Waveform />
            </div>
          )}
        </div>
        <div className="font-display text-base tracking-wider">
          {cancelArmed ? "松开手指 · 取消发送" : "松开发送  ·  上滑取消"}
        </div>
      </div>
    </div>
  );
}

function Waveform() {
  // 简易跳动条波形，纯视觉效果，不依赖真实音量。
  const bars = [0.5, 0.9, 0.4, 1, 0.6, 0.8, 0.3];
  return (
    <>
      {bars.map((scale, i) => (
        <span
          key={i}
          className="w-1.5 origin-bottom animate-pulse rounded-full bg-white"
          style={{
            height: `${scale * 36}px`,
            animationDelay: `${i * 80}ms`,
            animationDuration: "600ms",
          }}
        />
      ))}
    </>
  );
}
