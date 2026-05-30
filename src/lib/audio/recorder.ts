// 浏览器麦克风录制 → 解码 → 16kHz 单声道 16-bit PCM → base64。
// StepFun ASR 要的就是这个格式（pcm_s16le, 16000Hz, channel=1）。

export interface RecordedAudio {
  pcmBase64: string;
  sampleRate: number;
  durationMs: number;
}

const TARGET_SAMPLE_RATE = 16000;

export class VoiceRecorder {
  private stream: MediaStream;
  private recorder: MediaRecorder;
  private chunks: Blob[] = [];
  private startedAt = 0;

  private constructor(stream: MediaStream, recorder: MediaRecorder) {
    this.stream = stream;
    this.recorder = recorder;
  }

  static async start(): Promise<VoiceRecorder> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("当前浏览器不支持麦克风录音");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const inst = new VoiceRecorder(stream, recorder);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) inst.chunks.push(e.data);
    };
    inst.startedAt = Date.now();
    recorder.start();
    return inst;
  }

  cancel(): void {
    if (this.recorder.state !== "inactive") this.recorder.stop();
    this.stream.getTracks().forEach((t) => t.stop());
  }

  async stop(): Promise<RecordedAudio> {
    return new Promise<RecordedAudio>((resolve, reject) => {
      this.recorder.onstop = async () => {
        this.stream.getTracks().forEach((t) => t.stop());
        try {
          const durationMs = Date.now() - this.startedAt;
          const blob = new Blob(this.chunks, { type: this.recorder.mimeType });
          const audio = await blobToPcm(blob);
          resolve({ ...audio, durationMs });
        } catch (e) {
          reject(e);
        }
      };
      if (this.recorder.state !== "inactive") {
        this.recorder.stop();
      } else {
        reject(new Error("录音已经停止"));
      }
    });
  }
}

async function blobToPcm(blob: Blob): Promise<Omit<RecordedAudio, "durationMs">> {
  const arrayBuffer = await blob.arrayBuffer();
  // Safari 需要 webkit 前缀的 AudioContext。
  const AudioCtor: typeof AudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtor();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  await audioCtx.close();

  // 用 OfflineAudioContext 把任意采样率/声道数重采样到 16k 单声道。
  const length = Math.max(1, Math.ceil(decoded.duration * TARGET_SAMPLE_RATE));
  const offline = new OfflineAudioContext(1, length, TARGET_SAMPLE_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();

  const float32 = rendered.getChannelData(0);
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return {
    pcmBase64: arrayBufferToBase64(int16.buffer),
    sampleRate: TARGET_SAMPLE_RATE,
  };
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  // 分块处理，避免 String.fromCharCode 调用栈爆掉。
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
