export class SoundEngine {
  constructor() {
    this.context = null;
    this.activeWrongSound = null;
  }

  async unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") await this.context.resume();
  }

  tone({ frequency, start = 0, duration = 0.12, type = "sine", gain = 0.12 }) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const beginsAt = this.context.currentTime + start;
    const endsAt = beginsAt + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, beginsAt);
    envelope.gain.setValueAtTime(0.0001, beginsAt);
    envelope.gain.exponentialRampToValueAtTime(gain, beginsAt + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endsAt);
    oscillator.connect(envelope).connect(this.context.destination);
    oscillator.start(beginsAt);
    oscillator.stop(endsAt + 0.01);

    return oscillator;
  }

  playProblem() {
    this.tone({ frequency: 440, duration: 0.14, gain: 0.1 });
    this.tone({ frequency: 659.25, start: 0.13, duration: 0.18, gain: 0.1 });
  }

  playCorrect() {
    this.tone({ frequency: 523.25, duration: 0.18, gain: 0.11 });
    this.tone({ frequency: 783.99, start: 0.1, duration: 0.28, gain: 0.12 });
  }

  playWrong() {
    if (this.activeWrongSound) {
      try { this.activeWrongSound.stop(); } catch { /* It already ended. */ }
    }
    this.activeWrongSound = this.tone({ frequency: 164.81, duration: 0.11, type: "triangle", gain: 0.075 });
  }
}
