/**
 * Audio helpers for gemini-3.8-live Real-Time Voice Conversations
 */

export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export class LiveAudioPlayer {
  private ctx: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor() {
    // AudioContext created lazily on user gesture
  }

  private initCtx() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 24000 });
      this.nextPlayTime = this.ctx.currentTime;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playChunk(base64Pcm: string) {
    this.initCtx();
    if (!this.ctx) return;

    try {
      const arrayBuffer = base64ToArrayBuffer(base64Pcm);
      const dataView = new DataView(arrayBuffer);
      const numSamples = Math.floor(arrayBuffer.byteLength / 2);
      const float32Array = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
      }

      const audioBuffer = this.ctx.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.ctx.destination);

      const currentTime = this.ctx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);
      };
    } catch (err) {
      console.error('Error playing live audio chunk:', err);
    }
  }

  public stopAll() {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (_) {}
    }
    this.activeSources = [];
    if (this.ctx) {
      this.nextPlayTime = this.ctx.currentTime;
    }
  }

  public close() {
    this.stopAll();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (_) {}
      this.ctx = null;
    }
  }
}
