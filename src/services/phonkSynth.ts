// Original procedural Phonk instrumental synthesizer built purely with the Web Audio API.
// Zero copyrighted recordings or external audio samples.

const BPM = 128;
const SECONDS_PER_STEP = 60 / BPM / 4; // 16th-note resolution
const PATTERN_STEPS = 32; // 2-bar loop

// Frequencies in F Phrygian / minor drift-phonk scale
const COWBELL_PATTERN: Array<number | null> = [
  698.46, null, 830.61, null, 698.46, null, 1046.5, null,
  932.33, null, 830.61, 783.99, 698.46, null, 622.25, null,
  698.46, null, 830.61, null, 1046.5, null, 1108.73, null,
  1046.5, null, 830.61, null, 783.99, null, 622.25, null,
];

const BASS_PATTERN: Array<number | null> = [
  43.65, null, null, null, null, null, 43.65, null,
  null, null, 51.91, null, null, null, 49.0, null,
  43.65, null, null, null, null, null, 43.65, null,
  null, null, 58.27, null, 51.91, null, 41.2, null,
];

export class PhonkSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private distortionCurve: Float32Array<ArrayBuffer> | null = null;
  private schedulerId: number | null = null;
  private stopTimeoutId: number | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private isRunning = false;
  private volume = 0.55;
  private muted = false;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.78;

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      compressor.knee.setValueAtTime(16, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      this.distortionCurve = this.createSoftClipCurve(18);
    }
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createSoftClipCurve(amount: number): Float32Array<ArrayBuffer> {
    const samples = 256;
    const buffer = new ArrayBuffer(samples * 4);
    const curve = new Float32Array(buffer);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  public async start(volume: number, muted: boolean): Promise<void> {
    this.volume = volume;
    this.muted = muted;

    if (this.stopTimeoutId !== null) {
      window.clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (this.masterGain) {
      const target = this.muted ? 0.0001 : Math.max(0.0001, this.volume * 0.65);
      const now = ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.linearRampToValueAtTime(target, now + 0.55);
    }

    if (this.isRunning) return;
    this.isRunning = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.schedulerId = window.setInterval(() => {
      this.scheduleLookahead();
    }, 25);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);

      this.stopTimeoutId = window.setTimeout(() => {
        if (!this.isRunning && this.ctx && this.ctx.state === 'running') {
          void this.ctx.suspend();
        }
      }, 380);
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.applyGainSmoothly();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGainSmoothly();
  }

  private applyGainSmoothly(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target = this.muted ? 0.0001 : Math.max(0.0001, this.volume * 0.65);
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(target, now, 0.04);
  }

  public getFrequencyBars(barCount: number): number[] {
    if (!this.analyser || !this.isRunning) {
      return Array.from({ length: barCount }, () => 0.08);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const bars: number[] = [];
    const stride = Math.max(1, Math.floor(data.length / barCount));
    for (let i = 0; i < barCount; i++) {
      const raw = data[Math.min(data.length - 1, i * stride)] ?? 0;
      bars.push(Math.max(0.1, Math.min(1, raw / 215)));
    }
    return bars;
  }

  private scheduleLookahead(): void {
    if (!this.ctx || !this.isRunning) return;
    const scheduleAheadTime = 0.12;
    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.triggerStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += SECONDS_PER_STEP;
      this.currentStep = (this.currentStep + 1) % PATTERN_STEPS;
    }
  }

  private triggerStep(step: number, time: number): void {
    // Kick on 0, 6, 10, 16, 22, 26
    if (step === 0 || step === 6 || step === 10 || step === 16 || step === 22 || step === 26) {
      this.playKick(time);
    }

    // Snare/Clap on backbeats 4, 12, 20, 28
    if (step % 8 === 4) {
      this.playSnare(time);
    }

    // Closed Hi-Hat on even steps + rapid roll on step 30-31
    if (step % 2 === 0 || step === 29 || step === 31) {
      const accent = step % 4 === 0 ? 0.16 : 0.09;
      this.playHiHat(time, accent);
    }

    // 808 Sub-Bass
    const bassFreq = BASS_PATTERN[step];
    if (bassFreq) {
      this.play808Bass(time, bassFreq, SECONDS_PER_STEP * 3.8);
    }

    // Phonk Cowbell Lead
    const cowbellFreq = COWBELL_PATTERN[step];
    if (cowbellFreq) {
      this.playCowbell(time, cowbellFreq);
    }

    // Dark Atmospheric Pad on downbeats of each bar
    if (step === 0) {
      this.playPadChord(time, [174.61, 207.65, 261.63], SECONDS_PER_STEP * 15);
    } else if (step === 16) {
      this.playPadChord(time, [164.81, 207.65, 246.94], SECONDS_PER_STEP * 15);
    }
  }

  private playKick(time: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(148, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.11);

    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  private playSnare(time: number): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2100, time);
    filter.Q.setValueAtTime(0.9, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.42, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.17);

    // Tonal body snap
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snap.type = 'triangle';
    snap.frequency.setValueAtTime(210, time);
    snap.frequency.exponentialRampToValueAtTime(115, time + 0.08);
    snapGain.gain.setValueAtTime(0.32, time);
    snapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    snap.connect(snapGain);
    snapGain.connect(this.masterGain);
    snap.start(time);
    snap.stop(time + 0.1);
  }

  private playHiHat(time: number, level: number): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(7200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.06);
  }

  private play808Bass(time: number, freq: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.15, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.06);

    const shaper = this.ctx.createWaveShaper();
    if (this.distortionCurve) {
      shaper.curve = this.distortionCurve;
    }

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(210, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.68, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(shaper);
    shaper.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playCowbell(time: number, freq: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.48, time);

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(freq * 1.3, time);
    bp.Q.setValueAtTime(2.6, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.21);

    osc1.connect(bp);
    osc2.connect(bp);
    bp.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.22);
    osc2.stop(time + 0.22);
  }

  private playPadChord(time: number, freqs: number[], duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(620, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.11, time + duration * 0.28);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    lp.connect(gain);
    gain.connect(this.masterGain);

    for (const f of freqs) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, time);
      osc.connect(lp);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    }
  }

  public dispose(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const phonkSynth = new PhonkSynthEngine();
