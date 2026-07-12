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

function createFileAudio(url) {
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.playsInline = true;
  return audio;
}

export class SoundEngine {
  constructor({ revealUrl = null, wrongUrl = null, foundUrl = null, correctUrl = null, failureUrl = null } = {}) {
    this.lastError = null;
    this.playbackLatency = null;
    this.stateListener = null;
    this.activeSound = null;
    this.activeBufferSource = null;
    this.context = null;
    this.buffers = {};
    this.externalBuffersStarted = false;
    this.needsForegroundRecovery = false;
    this.samples = Object.fromEntries(
      Object.entries(SOUND_DEFINITIONS).map(([name, events]) => [name, createSamples(events)]),
    );
    this.sounds = Object.fromEntries(
      Object.entries(this.samples).map(([name, samples]) => [name, createAudio(samples)]),
    );
    this.externalAudioUrls = Object.fromEntries(
      Object.entries({
        reveal: revealUrl,
        wrong: wrongUrl,
        found: foundUrl,
        correct: correctUrl,
        failure: failureUrl,
      })
        .filter(([, url]) => url),
    );
    for (const [name, url] of Object.entries(this.externalAudioUrls)) {
      this.sounds[name] = createFileAudio(url);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.markForForegroundRecovery();
    });
    window.addEventListener("pagehide", () => this.markForForegroundRecovery());
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) this.markForForegroundRecovery();
    });
  }

  markForForegroundRecovery() {
    if (!this.context) return;
    this.needsForegroundRecovery = true;
    this.notifyState();
  }

  stopActiveSound() {
    const activeSound = this.activeSound;
    const activeBufferSource = this.activeBufferSource;
    this.activeSound = null;
    this.activeBufferSource = null;

    if (activeSound) {
      activeSound.onended = null;
      activeSound.pause();
    }
    if (activeBufferSource) {
      activeBufferSource.onended = null;
      try { activeBufferSource.stop(); } catch { /* It already ended. */ }
    }
  }

  createContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext({ latencyHint: "interactive" });
    this.context = context;
    this.buffers = {};
    this.externalBuffersStarted = false;
    context.addEventListener("statechange", () => {
      if (this.context === context) this.notifyState();
    });

    for (const [name, samples] of Object.entries(this.samples)) {
      const buffer = context.createBuffer(1, samples.length, SAMPLE_RATE);
      buffer.copyToChannel(samples, 0);
      this.buffers[name] = buffer;
    }
  }

  recoverForegroundAudio() {
    const previousContext = this.context;
    this.stopActiveSound();
    this.context = null;
    this.needsForegroundRecovery = false;

    for (const [name, url] of Object.entries(this.externalAudioUrls)) {
      this.sounds[name] = createFileAudio(url);
    }

    if (previousContext && previousContext.state !== "closed") {
      void previousContext.close().catch(() => {});
    }
    this.createContext();
  }

  unlock() {
    if (navigator.audioSession) {
      try { navigator.audioSession.type = "playback"; } catch { /* Use the default session. */ }
    }

    if (this.needsForegroundRecovery) this.recoverForegroundAudio();
    if (!this.context) this.createContext();

    if (!this.externalBuffersStarted) {
      this.externalBuffersStarted = true;
      const context = this.context;
      for (const [name, url] of Object.entries(this.externalAudioUrls)) {
        void fetch(url)
          .then((response) => {
            if (!response.ok) throw new Error(`Failed to load ${name} sound`);
            return response.arrayBuffer();
          })
          .then((data) => context.decodeAudioData(data))
          .then((buffer) => {
            if (this.context === context) this.buffers[name] = buffer;
          })
          .catch((error) => {
            if (this.context !== context) return;
            this.lastError = error instanceof Error ? error.message : String(error);
            this.notifyState();
          });
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
      recoveryPending: this.needsForegroundRecovery,
      error: this.lastError,
    });
  }

  play(name, onEnded = null) {
    const requestedAt = performance.now();

    if (this.context?.state === "running" && this.buffers[name]) {
      this.stopActiveSound();

      const source = this.context.createBufferSource();
      source.buffer = this.buffers[name];
      source.connect(this.context.destination);
      source.onended = () => {
        if (this.activeBufferSource !== source) return;
        this.activeBufferSource = null;
        onEnded?.();
      };
      source.start();
      this.activeBufferSource = source;
      this.lastError = null;
      this.playbackLatency = Math.round(performance.now() - requestedAt);
      this.notifyState();
      return;
    }

    this.stopActiveSound();

    const audio = this.sounds[name];
    audio.currentTime = 0;
    audio.onended = () => {
      if (this.activeSound !== audio) return;
      this.activeSound = null;
      onEnded?.();
    };
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

  playOverlay(name) {
    const buffer = this.buffers[name];
    if (this.context?.state === "running" && buffer) {
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.start();
      return;
    }

    const audio = this.sounds[name]?.cloneNode();
    if (!audio) return;
    audio.playsInline = true;
    void audio.play().catch((error) => {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.notifyState();
    });
  }

  playProblem() {
    this.play("problem");
  }

  playCorrect(onEnded = null) {
    this.play("correct", onEnded);
  }

  playFound() {
    this.play("found");
  }

  playReveal(onEnded = null) {
    this.play("reveal", onEnded);
  }

  playWrong() {
    this.play("wrong");
  }

  playFailure() {
    this.playOverlay("failure");
  }
}
