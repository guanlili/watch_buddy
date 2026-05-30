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

// Synth beep (no audio file needed)
let audioCtx: AudioContext | null = null;
export function playBeep(freq: number, duration = 0.25) {
  if (typeof window === "undefined") return;
  try {
    audioCtx ||= new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const ctx = audioCtx;
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
