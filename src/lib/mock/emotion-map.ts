import type { EmotionLabel } from "./types";

export interface EmotionMeta {
  label: string;
  emoji: string;
  color: string; // css var
  effect: "confetti" | "explosion" | "rain" | "heartbeat" | "none";
  beepFreq?: number; // synth tone
}

export const EMOTION_MAP: Record<EmotionLabel, EmotionMeta> = {
  ecstasy: {
    label: "狂喜",
    emoji: "🎉",
    color: "var(--ecstasy)",
    effect: "confetti",
    beepFreq: 880,
  },
  anger: { label: "愤怒", emoji: "💥", color: "var(--anger)", effect: "explosion", beepFreq: 220 },
  devastated: {
    label: "破防",
    emoji: "🌧️",
    color: "var(--devastated)",
    effect: "rain",
    beepFreq: 180,
  },
  tension: {
    label: "紧张",
    emoji: "💓",
    color: "var(--tension)",
    effect: "heartbeat",
    beepFreq: 440,
  },
  calm: { label: "平淡", emoji: "💬", color: "var(--calm)", effect: "none" },
};

// Synth beep (no audio file needed)。
// iOS Safari 的 Web Audio / 语音合成必须由用户手势解锁，否则赛中音效/解说会静默失败。
// 用单例 AudioContext + unlockAudio()（在点击回调里调一次）解锁后，事件音效才能自动播放。
let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    audioCtx ||= new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    return audioCtx;
  } catch {
    return null;
  }
}

// 必须在用户手势（点击 / 触摸）回调里调用一次。
export function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") void ctx.resume();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
  }
  audioUnlocked = true;
}

export function isAudioUnlocked() {
  return audioUnlocked;
}

export function playBeep(freq: number, duration = 0.25) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* noop */
  }
}

export function speakTTS(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 1.15;
    u.pitch = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* noop */
  }
}
