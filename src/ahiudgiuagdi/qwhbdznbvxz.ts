// Web Audio API ambient sound generator
// No external audio files needed - pure mathematical synthesis

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: string | null = null;
  private gainNode: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private filterNodes: BiquadFilterNode[] = [];
  private oscillators: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public stop() {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      this.cleanup();
      this.currentType = null;
    }, 850);
  }

  private cleanup() {
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.oscillators = [];

    if (this.lfo) {
      try {
        this.lfo.stop();
        this.lfo.disconnect();
      } catch {
        // ignore
      }
      this.lfo = null;
    }

    if (this.noiseNode) {
      try {
        this.noiseNode.disconnect();
      } catch {
        // ignore
      }
      this.noiseNode = null;
    }

    this.filterNodes.forEach(f => {
      try {
        f.disconnect();
      } catch {
        // ignore
      }
    });
    this.filterNodes = [];

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // ignore
      }
      this.gainNode = null;
    }
  }

  public play(type: 'brown' | 'rain' | 'waves' | 'cosmic', volume = 0.5) {
    this.initContext();
    if (!this.ctx) return;

    if (this.currentType === type) {
      this.stop();
      return;
    }

    this.cleanup();
    this.currentType = type;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(volume, this.ctx.currentTime + 1.2);
    masterGain.connect(this.ctx.destination);
    this.gainNode = masterGain;

    if (type === 'brown') {
      // Brown noise (warm, deep white noise)
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Gain compensation
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 400;

      noise.connect(lowpass);
      lowpass.connect(masterGain);
      noise.start();
      this.noiseNode = noise;
      this.filterNodes.push(lowpass);
    } else if (type === 'rain') {
      // Gentle rainfall synthesis
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.15;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1200;
      bandpass.Q.value = 0.8;

      noise.connect(bandpass);
      bandpass.connect(masterGain);
      noise.start();
      this.noiseNode = noise;
      this.filterNodes.push(bandpass);
    } else if (type === 'waves') {
      // Gentle ocean swell
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      // LFO for surf wave rising and falling
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.12; // slow 8-second cycle
      lfoGain.gain.value = 260;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.lfo = lfo;

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      this.noiseNode = noise;
      this.filterNodes.push(filter);
    } else if (type === 'cosmic') {
      // Deep resonant meditative drone (432Hz ambient harmonic base)
      const freqs = [108, 216, 324];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        oscGain.gain.value = 0.15 / (idx + 1);

        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
        this.oscillators.push(osc);
      });
    }
  }

  public setVolume(val: number) {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gainNode.gain.setValueAtTime(Math.max(0.0001, Math.min(1, val)), this.ctx.currentTime);
      } catch {
        // ignore
      }
    }
  }

  public playChime() {
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 2.6);
  }

  public getCurrentType() {
    return this.currentType;
  }
}

export const soundEngine = new AmbientSoundEngine();
