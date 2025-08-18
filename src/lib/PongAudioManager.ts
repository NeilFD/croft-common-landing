export interface ChiptuneNote {
  frequency: number;
  duration: number;
  waveform?: OscillatorType;
  volume?: number;
}

export interface ChiptuneTrack {
  bpm: number;
  timeSignature: [number, number];
  key: string;
  notes: ChiptuneNote[];
}

export class PongAudioManager {
  public audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentOscillator: OscillatorNode | null = null;
  private oscillatorGain: GainNode | null = null;
  private musicVolume = 0.3;
  private sfxVolume = 0.7;
  private isPlaying = false;
  private isLooping = false;
  private currentTrackType: 'intro' | 'main' | 'victory' | 'gameover' | null = null;
  private isInitialized = false;
  
  // Simplified audio state: INACTIVE | UNLOCKING | READY | FAILED
  private audioState: 'INACTIVE' | 'UNLOCKING' | 'READY' | 'FAILED' = 'INACTIVE';

  // iOS-Compliant Audio Unlock Pattern
  initializeAudioContext(): boolean {
    if (this.audioState !== 'INACTIVE') {
      console.log('🔊 Audio already initializing/ready, state:', this.audioState);
      return this.audioState === 'READY';
    }

    this.audioState = 'UNLOCKING';
    console.log('🔊 iOS audio unlock starting...');
    
    try {
      // 1. Create AudioContext with iOS fallback
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported');
      }
      
      this.audioContext = new AudioContextClass({ latencyHint: 'interactive' });
      console.log('🔊 AudioContext created, state:', this.audioContext.state);
      
      // 2. Create master gain chain IMMEDIATELY
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      
      // Connect gains
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Set volumes
      this.masterGain.gain.setValueAtTime(0.9, this.audioContext.currentTime);
      this.musicGain.gain.setValueAtTime(0.7, this.audioContext.currentTime);
      this.sfxGain.gain.setValueAtTime(1.0, this.audioContext.currentTime);

      // 3. CRITICAL: Resume AudioContext SYNCHRONOUSLY
      this.audioContext.resume();
      
      // 4. Create SILENT oscillator for warmup (per checklist)
      const osc = this.audioContext.createOscillator();
      const g = this.audioContext.createGain();
      g.gain.value = 0; // SILENT
      osc.connect(g);
      g.connect(this.audioContext.destination);
      osc.start(0);
      osc.stop(this.audioContext.currentTime + 0.05);
      
      // 5. Set up remaining audio chains
      this.setupAudioChains();
      
      // 6. Start background music
      this.startSimpleBackgroundMusic();
      
      this.audioState = 'READY';
      this.isInitialized = true;
      console.log('🔊 iOS audio unlock SUCCESS');
      
      return true;
      
    } catch (error) {
      console.error('🔊 iOS audio unlock FAILED:', error);
      this.audioState = 'FAILED';
      return false;
    }
  }

  // Simplified Audio Chain Setup
  private setupAudioChains(): void {
    if (!this.audioContext || !this.masterGain) return;

    console.log('🔊 Setting up audio chains...');
    
    // Oscillator gain for simple music
    this.oscillatorGain = this.audioContext.createGain();
    this.oscillatorGain.connect(this.musicGain);
    this.oscillatorGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);

    console.log('🔊 Audio chains ready');
  }


  // Background Music
  private startSimpleBackgroundMusic(): void {
    if (!this.audioContext || !this.oscillatorGain || this.audioState !== 'READY') return;

    console.log('🔊 Starting background music...');
    
    this.currentOscillator = this.audioContext.createOscillator();
    this.currentOscillator.connect(this.oscillatorGain);
    
    const currentTime = this.audioContext.currentTime;
    
    // Simple repeating melody
    const melody = [
      { freq: 329.63, time: 0.0 },   // E4
      { freq: 392.00, time: 0.5 },   // G4
      { freq: 440.00, time: 1.0 },   // A4
      { freq: 329.63, time: 1.5 },   // E4
    ];
    
    melody.forEach(({ freq, time }) => {
      this.currentOscillator!.frequency.setValueAtTime(freq, currentTime + time);
    });
    
    this.oscillatorGain.gain.setValueAtTime(0.3, currentTime);
    
    this.currentOscillator.type = 'triangle';
    this.currentOscillator.start(currentTime);
    this.currentOscillator.stop(currentTime + 2.0);
    
    // Keep looping
    this.currentOscillator.onended = () => {
      this.currentOscillator = null;
      if (this.audioState === 'READY') {
        this.startSimpleBackgroundMusic();
      }
    };
  }

  // Simple getter for audio readiness
  isAudioReady(): boolean {
    return this.audioState === 'READY';
  }

  // Get current audio state for debugging
  getAudioState(): string {
    return this.audioState;
  }

  // Compatibility getter (legacy property)
  get canPlayAudio(): boolean {
    return this.audioState === 'READY';
  }

  // SYNCHRONOUS Sound Effects - Only Oscillators
  playSoundEffect(effectName: string): void {
    if (!this.audioContext || !this.sfxGain || this.audioState !== 'READY') return;

    console.log('🔊 Playing SFX:', effectName);
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    const currentTime = this.audioContext.currentTime;
    
    // Simple sound effects using oscillators only
    switch (effectName) {
      case 'paddle_hit':
        oscillator.frequency.setValueAtTime(400, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.8, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        oscillator.type = 'square';
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.1);
        break;
        
      case 'score':
        oscillator.frequency.setValueAtTime(800, currentTime);
        oscillator.frequency.setValueAtTime(1000, currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1200, currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.7, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        oscillator.type = 'sine';
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.3);
        break;
        
      case 'speed_up':
        oscillator.frequency.setValueAtTime(1000, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(2000, currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.6, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        oscillator.type = 'sawtooth';
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.2);
        break;
        
      case 'game_over':
        oscillator.frequency.setValueAtTime(600, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.8, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
        oscillator.type = 'square';
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.5);
        break;
        
      case 'record_broken':
        // Celebratory ascending sound
        oscillator.frequency.setValueAtTime(400, currentTime);
        oscillator.frequency.setValueAtTime(600, currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1000, currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.9, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.4);
        oscillator.type = 'triangle';
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.4);
        break;
        
      default:
        // Default beep
        oscillator.frequency.setValueAtTime(440, currentTime);
        gainNode.gain.setValueAtTime(0.5, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        oscillator.type = 'sine';
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.1);
    }
  }

  // SYNCHRONOUS Music - Only Oscillators
  playMusic(trackType: 'intro' | 'main' | 'victory' | 'gameover', loop: boolean = false): void {
    if (!this.audioContext || !this.oscillatorGain || this.audioState !== 'READY') return;

    console.log('🔊 Playing music:', trackType, 'loop:', loop);
    
    // Stop any current music
    this.stopMusic();
    
    this.currentOscillator = this.audioContext.createOscillator();
    this.currentOscillator.connect(this.oscillatorGain);
    
    const currentTime = this.audioContext.currentTime;
    this.currentTrackType = trackType;
    this.isLooping = loop;
    this.isPlaying = true;
    
    // Simple melody patterns for each track type
    switch (trackType) {
      case 'intro':
        this.playIntroMelody(currentTime);
        break;
      case 'main':
        this.playMainMelody(currentTime);
        break;
      case 'victory':
        this.playVictoryMelody(currentTime);
        break;
      case 'gameover':
        this.playGameOverMelody(currentTime);
        break;
    }
  }
  
  private playIntroMelody(startTime: number): void {
    if (!this.currentOscillator) return;
    
    const melody = [
      { freq: 220, time: 0.0 },   // A3
      { freq: 261.63, time: 0.25 }, // C4
      { freq: 329.63, time: 0.5 },  // E4
      { freq: 440, time: 0.75 },    // A4
    ];
    
    melody.forEach(({ freq, time }) => {
      this.currentOscillator!.frequency.setValueAtTime(freq, startTime + time);
    });
    
    this.currentOscillator.type = 'square';
    this.currentOscillator.start(startTime);
    this.currentOscillator.stop(startTime + 1.0);
    
    this.currentOscillator.onended = () => {
      this.currentOscillator = null;
      this.isPlaying = false;
    };
  }
  
  private playMainMelody(startTime: number): void {
    if (!this.currentOscillator) return;
    
    const melody = [
      { freq: 329.63, time: 0.0 },   // E4
      { freq: 392.00, time: 0.5 },   // G4
      { freq: 440.00, time: 1.0 },   // A4
      { freq: 329.63, time: 1.5 },   // E4
    ];
    
    melody.forEach(({ freq, time }) => {
      this.currentOscillator!.frequency.setValueAtTime(freq, startTime + time);
    });
    
    this.currentOscillator.type = 'triangle';
    this.currentOscillator.start(startTime);
    this.currentOscillator.stop(startTime + 2.0);
    
    this.currentOscillator.onended = () => {
      this.currentOscillator = null;
      if (this.isLooping && this.audioState === 'READY') {
        this.playMusic('main', true);
      } else {
        this.isPlaying = false;
      }
    };
  }
  
  private playVictoryMelody(startTime: number): void {
    if (!this.currentOscillator) return;
    
    const melody = [
      { freq: 440, time: 0.0 },     // A4
      { freq: 523.25, time: 0.2 },  // C5
      { freq: 659.25, time: 0.4 },  // E5
      { freq: 880, time: 0.6 },     // A5
    ];
    
    melody.forEach(({ freq, time }) => {
      this.currentOscillator!.frequency.setValueAtTime(freq, startTime + time);
    });
    
    this.currentOscillator.type = 'sine';
    this.currentOscillator.start(startTime);
    this.currentOscillator.stop(startTime + 0.8);
    
    this.currentOscillator.onended = () => {
      this.currentOscillator = null;
      this.isPlaying = false;
    };
  }
  
  private playGameOverMelody(startTime: number): void {
    if (!this.currentOscillator) return;
    
    const melody = [
      { freq: 440, time: 0.0 },     // A4
      { freq: 392, time: 0.3 },     // G4
      { freq: 349.23, time: 0.6 },  // F4
      { freq: 220, time: 0.9 },     // A3
    ];
    
    melody.forEach(({ freq, time }) => {
      this.currentOscillator!.frequency.setValueAtTime(freq, startTime + time);
    });
    
    this.currentOscillator.type = 'square';
    this.currentOscillator.start(startTime);
    this.currentOscillator.stop(startTime + 1.2);
    
    this.currentOscillator.onended = () => {
      this.currentOscillator = null;
      this.isPlaying = false;
    };
  }

  stopMusic(): void {
    this.isLooping = false;
    this.isPlaying = false;
    
    if (this.currentOscillator) {
      try {
        this.currentOscillator.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
      this.currentOscillator = null;
    }
    
    this.currentTrackType = null;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioContext?.currentTime || 0);
    }
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioContext?.currentTime || 0);
    }
  }

  toggleMute(): boolean {
    if (!this.masterGain) return false;
    
    const currentGain = this.masterGain.gain.value;
    const newGain = currentGain > 0 ? 0 : 0.8;
    this.masterGain.gain.setValueAtTime(newGain, this.audioContext?.currentTime || 0);
    
    return newGain === 0;
  }

  switchMainLoop(): void {
    if (!this.isPlaying || this.currentTrackType !== 'main') {
      console.log('🔊 Cannot switch main loop - conditions not met');
      return;
    }

    // Stop current music and restart
    this.stopMusic();
    console.log('🔊 Switching main loop melody');
    this.playMusic('main', true);
  }

  playVictoryMusic(): void {
    this.playMusic('victory', false);
  }

  playGameOverMusic(): void {
    this.playMusic('gameover', false);
  }

  // iOS Lifecycle Management (Phase 5)
  handleVisibilityChange(): void {
    if (!this.audioContext) return;
    
    if (document.hidden) {
      console.log('🔊 Page hidden - suspending audio context');
      this.audioContext.suspend();
    } else if (this.audioState === 'READY') {
      console.log('🔊 Page visible - resuming audio context');
      this.audioContext.resume();
    }
  }

  cleanup(): void {
    console.log('🔊 Cleaning up audio manager...');
    
    this.isLooping = false;
    this.isPlaying = false;
    this.audioState = 'INACTIVE';
    
    this.stopMusic();
    
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        console.warn('🔊 Error closing audio context:', e);
      }
      this.audioContext = null;
    }
    
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.oscillatorGain = null;
    this.isInitialized = false;
    
    console.log('🔊 Audio manager cleanup complete');
  }
}
