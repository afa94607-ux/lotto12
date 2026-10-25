// Sound synthesizers for Yuki 12 using Web Audio API

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playChip() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // AudioContext policy fallback
    }
  }

  playBowlShuffle() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      // Golden bowl metallic resonance
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // ignore
    }
  }

  playBowlFlip(stepNumber: number) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      // Escalating pitch chime to build anticipation as each bowl is revealed one by one
      const baseFreq = 420 + Math.min(stepNumber, 12) * 35;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.15, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    } catch {
      // ignore
    }
  }

  playSuspense() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      // Suspense tension sweep before opening the final Line 3 winning number
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.7);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.75);
    } catch {
      // ignore
    }
  }

  playReveal() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      // Harmonious chime chords (C major / Pentatonic)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.07);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + index * 0.07 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + index * 0.07);
        osc.stop(this.ctx.currentTime + index * 0.07 + 0.65);
      });
    } catch {
      // ignore
    }
  }

  playWin() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      // Celebratory ascending fanfare
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);

        gain.gain.setValueAtTime(0.22, this.ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.09);
        osc.stop(this.ctx.currentTime + idx * 0.09 + 0.55);
      });
    } catch {
      // ignore
    }
  }


  // Khmer Audio Cache & Player (Web Audio API Buffers + HTML5 Audio Fallback)
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private preloaded: boolean = false;
  private isPreloading: boolean = false;

  async preloadKhmerAudio() {
    if (typeof window === 'undefined' || this.preloaded || this.isPreloading) return;
    this.isPreloading = true;
    this.init();

    const files = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'goodluck'];

    // 1. Preload HTML5 Audio objects
    files.forEach((id) => {
      try {
        const audio = new Audio(`/audio/khmer/${id}.wav`);
        audio.preload = 'auto';
        this.audioElements.set(id, audio);
      } catch {
        // ignore
      }
    });

    // 2. Pre-decode into Web Audio AudioBuffers for 0ms latency and high-fidelity mixing
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      for (const id of files) {
        try {
          const res = await fetch(`/audio/khmer/${id}.wav`);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            const decoded = await this.ctx.decodeAudioData(arrayBuf);
            this.audioBuffers.set(id, decoded);
          }
        } catch {
          // ignore - HTMLAudioElement fallback will handle it
        }
      }
    }

    this.preloaded = true;
    this.isPreloading = false;
  }

  // Play a decoded AudioBuffer through Web Audio API
  private playBuffer(buffer: AudioBuffer, gainLevel = 1.0) {
    if (!this.ctx) return false;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const src = this.ctx.createBufferSource();
      const gainNode = this.ctx.createGain();
      src.buffer = buffer;
      gainNode.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      src.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      src.start(0);
      return true;
    } catch {
      return false;
    }
  }

  speakKhmer(text: string) {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'km-KH';
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        const voices = window.speechSynthesis.getVoices();
        const khmerVoice = voices.find((v) => v.lang.includes('km') || v.lang.includes('KM'));
        if (khmerVoice) utterance.voice = khmerVoice;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // ignore
    }
  }

  // High-Quality Studio Countdown Warning Ticker
  playCountdownWarning(secondsLeft: number) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

      const isUrgent = secondsLeft <= 3;
      const now = this.ctx.currentTime;

      if (isUrgent) {
        // Double-ping escalating urgent chime for 3, 2, 1
        const primaryFreq = secondsLeft === 1 ? 1480 : secondsLeft === 2 ? 1320 : 1175;
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(primaryFreq, now);
        osc1.frequency.exponentialRampToValueAtTime(primaryFreq * 1.15, now + 0.12);

        gain1.gain.setValueAtTime(0.28, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);
      } else {
        // Clean crisp digital casino ticker for 10 down to 4
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.07);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch {
      // AudioContext policy fallback
    }
  }

  // Good Luck Blessing Chime (Harmonic Pentatonic Golden Chime)
  playGoodLuckChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

      const now = this.ctx.currentTime;
      // Golden harmonic chime chord (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.22, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.95);
      });
    } catch {
      // ignore
    }
  }

  // Play Khmer Count (10 to 1): speaks ដប់, ប្រាំបួន, ប្រាំបី, ប្រាំពីរ, ប្រាំមួយ, ប្រាំ, បួន, បី, ពីរ, មួយ
  playKhmerCountdown(seconds: number) {
    if (!this.enabled || seconds < 1 || seconds > 10) return;
    this.preloadKhmerAudio();

    // 1. Play high-quality studio countdown warning tick/ping
    this.playCountdownWarning(seconds);

    // 2. Play Khmer vocal announcement
    const id = String(seconds);

    // Try zero-latency Web Audio API buffer first
    const buffer = this.audioBuffers.get(id);
    if (buffer) {
      this.playBuffer(buffer, 1.0);
      return;
    }

    // Fallback to HTMLAudioElement
    const audio = this.audioElements.get(id) || new Audio(`/audio/khmer/${id}.wav`);
    audio.currentTime = 0;
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to Web Speech API
        const words: Record<number, string> = {
          10: 'ដប់',
          9: 'ប្រាំបួន',
          8: 'ប្រាំបី',
          7: 'ប្រាំពីរ',
          6: 'ប្រាំមួយ',
          5: 'ប្រាំ',
          4: 'បួន',
          3: 'បី',
          2: 'ពីរ',
          1: 'មួយ',
        };
        this.speakKhmer(words[seconds] || String(seconds));
      });
    }
  }

  // Play Good Luck announcement at 0s: speaks "សូមជូនពរឱ្យសំណាងល្អ"
  playKhmerGoodLuck() {
    if (!this.enabled) return;
    this.preloadKhmerAudio();

    // 1. Play celebratory golden chime chord
    this.playGoodLuckChime();

    // 2. Play Khmer voice: "សូមជូនពរឱ្យសំណាងល្អ"
    const buffer = this.audioBuffers.get('goodluck');
    if (buffer) {
      this.playBuffer(buffer, 1.0);
      return;
    }

    const audio = this.audioElements.get('goodluck') || new Audio('/audio/khmer/goodluck.wav');
    audio.currentTime = 0;
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        this.speakKhmer('សូមជូនពរឱ្យសំណាងល្អ');
      });
    }
  }
}

export const sound = new SoundEffects();

export const KHMER_COUNTDOWN_MAP: Record<number, { numeral: string; word: string; audioSrc: string }> = {
  10: { numeral: '១០', word: 'ដប់', audioSrc: '/audio/khmer/10.wav' },
  9: { numeral: '៩', word: 'ប្រាំបួន', audioSrc: '/audio/khmer/9.wav' },
  8: { numeral: '៨', word: 'ប្រាំបី', audioSrc: '/audio/khmer/8.wav' },
  7: { numeral: '៧', word: 'ប្រាំពីរ', audioSrc: '/audio/khmer/7.wav' },
  6: { numeral: '៦', word: 'ប្រាំមួយ', audioSrc: '/audio/khmer/6.wav' },
  5: { numeral: '៥', word: 'ប្រាំ', audioSrc: '/audio/khmer/5.wav' },
  4: { numeral: '៤', word: 'បួន', audioSrc: '/audio/khmer/4.wav' },
  3: { numeral: '៣', word: 'បី', audioSrc: '/audio/khmer/3.wav' },
  2: { numeral: '២', word: 'ពីរ', audioSrc: '/audio/khmer/2.wav' },
  1: { numeral: '១', word: 'មួយ', audioSrc: '/audio/khmer/1.wav' },
};

export const KHMER_GOODLUCK_MESSAGE = 'សូមជូនពរឱ្យសំណាងល្អ';

