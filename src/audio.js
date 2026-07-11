const SAMPLE_RATE = 44100;

function writeText(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function waveValue(type, phase) {
  if (type === "triangle") return (2 / Math.PI) * Math.asin(Math.sin(phase));
  return Math.sin(phase);
}

function createWavUrl(events) {
  const duration = Math.max(...events.map((event) => event.start + event.duration));
  const sampleCount = Math.ceil(duration * SAMPLE_RATE);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);

  writeText(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
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
  view.setUint32(40, sampleCount * 2, true);

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

    const clampedSample = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + sampleIndex * 2, clampedSample * 0x7fff, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function createAudio(events) {
  const audio = new Audio(createWavUrl(events));
  audio.preload = "auto";
  audio.playsInline = true;
  return audio;
}

export class SoundEngine {
  constructor() {
    this.lastError = null;
    this.stateListener = null;
    this.activeSound = null;
    this.sounds = {
      problem: createAudio([
        { frequency: 440, start: 0, duration: 0.14, gain: 0.32 },
        { frequency: 659.25, start: 0.13, duration: 0.18, gain: 0.32 },
      ]),
      correct: createAudio([
        { frequency: 523.25, start: 0, duration: 0.18, gain: 0.34 },
        { frequency: 783.99, start: 0.1, duration: 0.28, gain: 0.36 },
      ]),
      wrong: createAudio([
        { frequency: 164.81, start: 0, duration: 0.11, type: "triangle", gain: 0.24 },
      ]),
    };
  }

  unlock() {
    this.notifyState();
  }

  onStateChange(listener) {
    this.stateListener = listener;
    this.notifyState();
  }

  notifyState() {
    this.stateListener?.({
      state: "media-element",
      sampleRate: SAMPLE_RATE,
      error: this.lastError,
    });
  }

  play(name) {
    if (this.activeSound) {
      this.activeSound.pause();
      this.activeSound.currentTime = 0;
    }

    const audio = this.sounds[name];
    audio.currentTime = 0;
    this.activeSound = audio;
    void audio.play()
      .then(() => {
        this.lastError = null;
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
