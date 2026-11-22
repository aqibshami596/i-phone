import { MusicTrack } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  public soundEnabled = true;
  public hapticsEnabled = true;
  public volume = 0.75;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public haptic(ms = 10) {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore vibration restriction
      }
    }
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    if (!this.soundEnabled || this.volume <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainVal * this.volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public tap() {
    this.haptic(8);
    this.tone(920, 0.035, 'triangle', 0.035);
  }

  public keyClick() {
    this.haptic(6);
    this.tone(680, 0.025, 'sine', 0.028);
  }

  public lock() {
    this.haptic(14);
    this.tone(320, 0.06, 'triangle', 0.07);
    this.tone(210, 0.07, 'sine', 0.06, 0.04);
  }

  public unlock() {
    this.haptic(12);
    this.tone(587.33, 0.09, 'sine', 0.06);
    this.tone(880, 0.14, 'sine', 0.07, 0.07);
  }

  public shutter() {
    this.haptic(16);
    this.tone(1100, 0.03, 'square', 0.04);
    this.tone(440, 0.05, 'triangle', 0.05, 0.025);
  }

  public messageSent() {
    this.haptic(10);
    this.tone(520, 0.06, 'sine', 0.05);
    this.tone(780, 0.09, 'sine', 0.06, 0.04);
  }

  public notification() {
    this.haptic(15);
    this.tone(784, 0.12, 'sine', 0.07);
    this.tone(1046.5, 0.18, 'sine', 0.07, 0.09);
  }

  public timerRing() {
    this.haptic(30);
    this.tone(880, 0.16, 'sine', 0.11);
    this.tone(1174.66, 0.18, 'sine', 0.11, 0.18);
    this.tone(880, 0.16, 'sine', 0.11, 0.36);
  }

  public dtmf(key: string) {
    this.haptic(8);
    const map: Record<string, [number, number]> = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
    };
    const freqs = map[key];
    if (!freqs) return;
    this.tone(freqs[0], 0.12, 'sine', 0.05);
    this.tone(freqs[1], 0.12, 'sine', 0.05);
  }

  private ringtoneTimer: number | null = null;
  private ringbackTimer: number | null = null;

  public startRingtone() {
    this.stopCallTones();
    const playPhrase = () => {
      this.haptic(260);
      if (!this.soundEnabled || this.volume <= 0.01) return;
      // Clean Apple-inspired marimba arpeggio phrase
      const notes = [659.25, 783.99, 987.77, 1318.51, 987.77, 1174.66];
      notes.forEach((freq, idx) => {
        this.tone(freq, 0.22, 'triangle', 0.09, idx * 0.14);
      });
    };
    playPhrase();
    this.ringtoneTimer = window.setInterval(playPhrase, 2400);
  }

  public startRingback() {
    this.stopCallTones();
    const playRing = () => {
      if (!this.soundEnabled || this.volume <= 0.01) return;
      // Standard North American dual-frequency ringback tone (440Hz + 480Hz)
      this.tone(440, 1.3, 'sine', 0.038, 0);
      this.tone(480, 1.3, 'sine', 0.038, 0);
    };
    playRing();
    this.ringbackTimer = window.setInterval(playRing, 3800);
  }

  public playCallEnded() {
    this.stopCallTones();
    this.haptic(25);
    this.tone(480, 0.16, 'sine', 0.06, 0);
    this.tone(620, 0.16, 'sine', 0.06, 0);
    this.tone(480, 0.16, 'sine', 0.05, 0.24);
    this.tone(620, 0.16, 'sine', 0.05, 0.24);
  }

  public stopCallTones() {
    if (this.ringtoneTimer !== null) {
      clearInterval(this.ringtoneTimer);
      this.ringtoneTimer = null;
    }
    if (this.ringbackTimer !== null) {
      clearInterval(this.ringbackTimer);
      this.ringbackTimer = null;
    }
  }

  public startMusic(track: MusicTrack) {
    this.stopMusic();
    const stepMs = Math.round((60 / track.bpm) * 500);
    this.musicStep = 0;
    const playStep = () => {
      if (!this.soundEnabled || this.volume <= 0.01) return;
      const note = track.notes[this.musicStep % track.notes.length];
      if (note > 0) {
        this.tone(note, 0.38, 'sine', 0.055);
        if (this.musicStep % 2 === 0) {
          this.tone(note * 0.5, 0.45, 'triangle', 0.035);
        }
      }
      this.musicStep += 1;
    };
    playStep();
    this.musicTimer = window.setInterval(playStep, stepMs);
  }

  public stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
