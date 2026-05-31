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

// 解说搭档的声音 prosody 设定：语速中等偏快、有情绪起伏。
// 精彩时刻提速 + 升调；劣势时降调但不丧；其余情绪用强度做微调。
const TTS_PROSODY: Record<EmotionLabel, { rate: number; pitch: number }> = {
  ecstasy: { rate: 1.3, pitch: 1.3 },
  anger: { rate: 1.25, pitch: 1.15 },
  tension: { rate: 1.2, pitch: 1.1 },
  devastated: { rate: 1.0, pitch: 0.9 },
  calm: { rate: 1.1, pitch: 1.0 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// 把整句按标点切成短段，逐段入队 → speechSynthesis 在每段之间自然停顿，
// 听起来像真人讲话的吸气 / 顿挫，而不是一口气念完。
function splitForProsody(text: string): string[] {
  const segs: string[] = [];
  let buf = "";
  for (const ch of text) {
    buf += ch;
    if (/[，。！？!?,.~～；;]/.test(ch) && buf.trim()) {
      segs.push(buf.trim());
      buf = "";
    }
  }
  if (buf.trim()) segs.push(buf.trim());
  return segs.length ? segs : [text];
}

export interface SpeakOptions {
  emotion?: EmotionLabel;
  intensity?: 1 | 2 | 3 | 4 | 5;
}

export function speakTTS(text: string, opts: SpeakOptions = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const { emotion = "calm", intensity = 2 } = opts;
  const base = TTS_PROSODY[emotion];
  // intensity 2 = 基准；越高越夸张。破防方向的强度让音调反向下沉，避免越激动越尖。
  const boost = (intensity - 2) * 0.06;
  const rate = clamp(base.rate + boost, 0.8, 1.6);
  const pitch = clamp(base.pitch + (emotion === "devastated" ? -Math.abs(boost) : boost), 0.6, 1.8);
  try {
    window.speechSynthesis.cancel();
    for (const seg of splitForProsody(text)) {
      const u = new SpeechSynthesisUtterance(seg);
      u.lang = "zh-CN";
      u.rate = rate;
      u.pitch = pitch;
      window.speechSynthesis.speak(u);
    }
  } catch {
    /* noop */
  }
}
