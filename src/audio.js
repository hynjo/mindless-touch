const SAMPLE_RATE = 44100;
const SOUND_DEFINITIONS = {
  problem: [
    { frequency: 440, start: 0, duration: 0.14, gain: 0.32 },
    { frequency: 659.25, start: 0.13, duration: 0.18, gain: 0.32 },
  ],
  correct: [
    { frequency: 523.25, start: 0, duration: 0.18, gain: 0.34 },
    { frequency: 783.99, start: 0.1, duration: 0.28, gain: 0.36 },
  ],
  wrong: [
    { frequency: 164.81, start: 0, duration: 0.11, type: "triangle", gain: 0.24 },
  ],
};

function writeText(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function waveValue(type, phase) {
  if (type === "triangle") return (2 / Math.PI) * Math.asin(Math.sin(phase));
  return Math.sin(phase);
}

function createSamples(events) {
  const duration = Math.max(...events.map((event) => event.start + event.duration));
  const sampleCount = Math.ceil(duration * SAMPLE_RATE);
  const samples = new Float32Array(sampleCount);

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const time = sampleIndex / SAMPLE_RATE;
    let sample = 0;

    for (const event of events) {
      const localTime = time - event.start;
      if (localTime < 0 || localTime >= event.duration) continue;
      const attack = Math.min(1, localTime / 0.012);
      const release = Math.min(1, (event.duration - localTime) / 0.035);
      const envelope = attack * release;
      sample += waveValue(event.type ?? "sine", Math.PI * 2 * event.frequency * localTime)
        * event.gain * envelope;
    }

    samples[sampleIndex] = Math.max(-1, Math.min(1, sample));
  }

  return samples;
}

function createWavUrl(samples) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeText(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(view, 8, "WAVE");
  writeText(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  for (let index = 0; index < samples.length; index += 1) {
    view.setInt16(44 + index * 2, samples[index] * 0x7fff, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function createAudio(samples) {
  const audio = new Audio(createWavUrl(samples));
  audio.preload = "auto";
  audio.playsInline = true;
  return audio;
}

export class SoundEngine {
  constructor() {
    this.lastError = null;
    this.playbackLatency = null;
    this.stateListener = null;
    this.activeSound = null;
    this.activeBufferSource = null;
    this.context = null;
    this.buffers = {};
    this.samples = Object.fromEntries(
      Object.entries(SOUND_DEFINITIONS).map(([name, events]) => [name, createSamples(events)]),
    );
    this.sounds = Object.fromEntries(
      Object.entries(this.samples).map(([name, samples]) => [name, createAudio(samples)]),
    );
  }

  unlock() {
    if (navigator.audioSession) {
      try { navigator.audioSession.type = "playback"; } catch { /* Use the default session. */ }
    }

    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext({ latencyHint: "interactive" });
      this.context.addEventListener("statechange", () => this.notifyState());

      for (const [name, samples] of Object.entries(this.samples)) {
        const buffer = this.context.createBuffer(1, samples.length, SAMPLE_RATE);
        buffer.copyToChannel(samples, 0);
        this.buffers[name] = buffer;
      }
    }

    if (this.context.state !== "running") {
      void this.context.resume()
        .catch((error) => {
          this.lastError = error instanceof Error ? error.message : String(error);
        })
        .finally(() => this.notifyState());
    }

    this.notifyState();
  }

  onStateChange(listener) {
    this.stateListener = listener;
    this.notifyState();
  }

  notifyState() {
    this.stateListener?.({
      state: this.context ? `web-audio:${this.context.state}` : "media-fallback",
      sampleRate: SAMPLE_RATE,
      playbackLatency: this.playbackLatency,
      error: this.lastError,
    });
  }

  play(name) {
    const requestedAt = performance.now();

    if (this.context?.state === "running") {
      if (this.activeSound) {
        this.activeSound.pause();
        this.activeSound = null;
      }
      if (this.activeBufferSource) {
        try { this.activeBufferSource.stop(); } catch { /* It already ended. */ }
      }

      const source = this.context.createBufferSource();
      source.buffer = this.buffers[name];
      source.connect(this.context.destination);
      source.start();
      this.activeBufferSource = source;
      this.lastError = null;
      this.playbackLatency = Math.round(performance.now() - requestedAt);
      this.notifyState();
      return;
    }

    if (this.activeSound) {
      this.activeSound.pause();
    }

    const audio = this.sounds[name];
    audio.currentTime = 0;
    this.activeSound = audio;
    void audio.play()
      .then(() => {
        this.lastError = null;
        this.playbackLatency = Math.round(performance.now() - requestedAt);
      })
      .catch((error) => {
        this.lastError = error instanceof Error ? error.message : String(error);
      })
      .finally(() => this.notifyState());
  }

  playProblem() {
    this.play("problem");
  }

  playCorrect() {
    this.play("correct");
  }

  playWrong() {
    this.play("wrong");
  }
}
