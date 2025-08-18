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
  private currentMusic: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private isLooping = false;
  private musicVolume = 0.3;
  private sfxVolume = 0.7;
  private currentTrackType: 'intro' | 'main' | 'victory' | 'gameover' | null = null;
  private isInitialized = false;

  // Pre-generated audio buffers
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  // Initialize AudioContext synchronously within user gesture
  initializeAudioContext(): boolean {
    try {
      console.log('Creating AudioContext within user gesture...');
      this.audioContext = new AudioContext();
      console.log('AudioContext created, state:', this.audioContext.state);
      
      // Immediately play a minimal tone to satisfy iOS autoplay requirements
      if (this.audioContext.state === 'running') {
        this.playMinimalTone();
      }
      
      return true;
    } catch (error) {
      console.error('AudioContext creation failed:', error);
      return false;
    }
  }

  // Play a minimal tone immediately within user gesture for iOS compatibility
  private playMinimalTone(): void {
    if (!this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Very quiet, very short tone
      gainNode.gain.setValueAtTime(0.01, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
      
      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
      
      console.log('Minimal tone played for iOS compatibility');
    } catch (error) {
      console.error('Failed to play minimal tone:', error);
    }
  }

  // Generate all audio content asynchronously after AudioContext is ready
  async initializeAudio(): Promise<void> {
    if (!this.audioContext) {
      console.error('AudioContext not created - call initializeAudioContext() first');
      return;
    }

    try {
      console.log('Setting up audio system...');
      
      // Resume AudioContext if suspended
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming AudioContext...');
        await this.audioContext.resume();
        console.log('AudioContext resumed, state:', this.audioContext.state);
      }
      
      await this.setupAudioGraph();
      await this.generateAllAudio();
      this.isInitialized = true;
      console.log('Audio system fully initialized');
    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  }

  private async setupAudioGraph(): Promise<void> {
    if (!this.audioContext) return;

    // Create master gain node
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.setValueAtTime(0.8, this.audioContext.currentTime); // -16 LUFS target

    // Create separate gain nodes for music and SFX
    this.musicGain = this.audioContext.createGain();
    this.musicGain.connect(this.masterGain);
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);

    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.connect(this.masterGain);
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
  }

  private async generateAllAudio(): Promise<void> {
    if (!this.audioContext) return;

    // Generate intro track (2-4s, non-looping)
    const introTrack = this.generateIntroTrack();
    this.audioBuffers.set('intro', await this.createAudioBuffer(introTrack));

    // Generate main loop (48-70s, seamless loop)
    const mainLoopA = this.generateMainLoopA();
    this.audioBuffers.set('main_loop_a', await this.createAudioBuffer(mainLoopA));

    // Generate alternate loop
    const mainLoopB = this.generateMainLoopB();
    this.audioBuffers.set('main_loop_b', await this.createAudioBuffer(mainLoopB));

    // Generate victory sting (1-2s)
    const victoryTrack = this.generateVictoryTrack();
    this.audioBuffers.set('victory', await this.createAudioBuffer(victoryTrack));

    // Generate game over sting (1-2s)
    const gameOverTrack = this.generateGameOverTrack();
    this.audioBuffers.set('gameover', await this.createAudioBuffer(gameOverTrack));

    // Generate SFX
    await this.generateSoundEffects();
  }

  private generateIntroTrack(): ChiptuneTrack {
    return {
      bpm: 132,
      timeSignature: [4, 4],
      key: 'A minor',
      notes: [
        // 4-second energetic intro in A minor
        { frequency: 220, duration: 0.25, waveform: 'square', volume: 0.8 }, // A3
        { frequency: 246.94, duration: 0.25, waveform: 'square', volume: 0.7 }, // B3
        { frequency: 261.63, duration: 0.25, waveform: 'square', volume: 0.8 }, // C4
        { frequency: 293.66, duration: 0.25, waveform: 'square', volume: 0.9 }, // D4
        { frequency: 329.63, duration: 0.5, waveform: 'square', volume: 1.0 }, // E4
        { frequency: 349.23, duration: 0.25, waveform: 'square', volume: 0.8 }, // F4
        { frequency: 392, duration: 0.5, waveform: 'square', volume: 1.0 }, // G4
        { frequency: 440, duration: 1.0, waveform: 'square', volume: 1.0 }, // A4 (climax)
        { frequency: 329.63, duration: 0.5, waveform: 'square', volume: 0.8 }, // E4
        { frequency: 220, duration: 0.5, waveform: 'square', volume: 0.6 }, // A3 (resolve)
      ]
    };
  }

  private generateMainLoopA(): ChiptuneTrack {
    const notes: ChiptuneNote[] = [];
    const baseDuration = 0.125; // 16th notes at 132 BPM
    
    // Classic arcade-style melody with simple, catchy patterns
    const melodyPattern = [
      // Phrase 1 - Simple ascending/descending arpeggios (classic arcade style)
      220, 261.63, 329.63, 440, 329.63, 261.63, 220, 220, // A-C-E-A-E-C-A-A
      246.94, 293.66, 369.99, 493.88, 369.99, 293.66, 246.94, 246.94, // B-D-F#-B-F#-D-B-B
      261.63, 329.63, 392, 523.25, 392, 329.63, 261.63, 261.63, // C-E-G-C5-G-E-C-C
      220, 261.63, 329.63, 440, 329.63, 261.63, 220, 174.61, // A-C-E-A-E-C-A-F (resolve down)
      
      // Phrase 2 - More rhythmic, punchy (Pac-Man style)
      220, 220, 261.63, 293.66, 329.63, 329.63, 293.66, 261.63, // A-A-C-D-E-E-D-C
      246.94, 246.94, 293.66, 329.63, 369.99, 369.99, 329.63, 293.66, // B-B-D-E-F#-F#-E-D  
      261.63, 261.63, 329.63, 392, 440, 440, 392, 329.63, // C-C-E-G-A-A-G-E
      220, 246.94, 261.63, 220, 174.61, 220, 261.63, 220, // A-B-C-A-F-A-C-A (classic ending)
    ];

    // Create lead melody
    melodyPattern.forEach((freq, i) => {
      notes.push({
        frequency: freq,
        duration: baseDuration * 2, // 8th notes
        waveform: 'square',
        volume: 0.7 + (i % 8) * 0.05 // Slight volume variation
      });
    });

    return {
      bpm: 132,
      timeSignature: [4, 4],
      key: 'A minor',
      notes
    };
  }

  private generateMainLoopB(): ChiptuneTrack {
    // More energetic variation - faster tempo feeling with staccato notes
    const notes: ChiptuneNote[] = [];
    const baseDuration = 0.125;
    
    const melodyPattern = [
      // Staccato variation - shorter notes, more space (classic arcade style)
      220, 0, 261.63, 0, 329.63, 0, 440, 0, // A-pause-C-pause-E-pause-A-pause
      392, 0, 329.63, 0, 261.63, 0, 220, 0, // G-pause-E-pause-C-pause-A-pause
      246.94, 0, 293.66, 0, 369.99, 0, 493.88, 0, // B-pause-D-pause-F#-pause-B-pause
      440, 0, 392, 0, 329.63, 0, 293.66, 0, // A-pause-G-pause-E-pause-D-pause
    ];

    melodyPattern.forEach((freq, i) => {
      notes.push({
        frequency: freq || 1, // Use 1Hz for pauses (effectively silent)
        duration: baseDuration * 2, // 8th notes
        waveform: 'square',
        volume: freq === 0 ? 0 : (0.7 + (i % 4) * 0.1) // Silent for pauses, varied volume for notes
      });
    });

    return {
      bpm: 132,
      timeSignature: [4, 4],
      key: 'A minor',
      notes
    };
  }

  private generateVictoryTrack(): ChiptuneTrack {
    return {
      bpm: 132,
      timeSignature: [4, 4],
      key: 'A minor',
      notes: [
        // Triumphant ascending sequence
        { frequency: 220, duration: 0.15, waveform: 'square', volume: 0.8 }, // A3
        { frequency: 261.63, duration: 0.15, waveform: 'square', volume: 0.85 }, // C4
        { frequency: 329.63, duration: 0.15, waveform: 'square', volume: 0.9 }, // E4
        { frequency: 440, duration: 0.15, waveform: 'square', volume: 0.95 }, // A4
        { frequency: 523.25, duration: 0.4, waveform: 'square', volume: 1.0 }, // C5
        { frequency: 659.25, duration: 0.6, waveform: 'square', volume: 1.0 }, // E5 (climax)
        { frequency: 880, duration: 0.4, waveform: 'square', volume: 0.8 }, // A5 (resolve)
      ]
    };
  }

  private generateGameOverTrack(): ChiptuneTrack {
    return {
      bpm: 100, // Slower tempo for dramatic effect
      timeSignature: [4, 4],
      key: 'A minor',
      notes: [
        // Descending dramatic sequence
        { frequency: 440, duration: 0.3, waveform: 'square', volume: 1.0 }, // A4
        { frequency: 392, duration: 0.3, waveform: 'square', volume: 0.9 }, // G4
        { frequency: 349.23, duration: 0.3, waveform: 'square', volume: 0.8 }, // F4
        { frequency: 329.63, duration: 0.3, waveform: 'square', volume: 0.7 }, // E4
        { frequency: 293.66, duration: 0.4, waveform: 'square', volume: 0.6 }, // D4
        { frequency: 261.63, duration: 0.4, waveform: 'square', volume: 0.5 }, // C4
        { frequency: 220, duration: 0.8, waveform: 'square', volume: 0.4 }, // A3 (low resolve)
      ]
    };
  }

  private async createAudioBuffer(track: ChiptuneTrack): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const totalDuration = track.notes.reduce((sum, note) => sum + note.duration, 0);
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sampleRate * totalDuration);
    
    // Create multi-channel buffer for layered synthesis
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    let currentSample = 0;

    for (const note of track.notes) {
      const noteSamples = Math.floor(sampleRate * note.duration);
      const frequency = note.frequency;
      const volume = note.volume || 0.7;
      const waveform = note.waveform || 'square';

      for (let i = 0; i < noteSamples; i++) {
        if (currentSample + i >= length) break;

        const t = i / sampleRate;
        const envelope = this.createEnvelope(i, noteSamples);
        
        let sample = 0;
        
        // Generate waveform
        switch (waveform) {
          case 'square':
            sample = Math.sign(Math.sin(2 * Math.PI * frequency * t)) * 0.8;
            break;
          case 'triangle':
            sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
            break;
          case 'sawtooth':
            sample = 2 * ((frequency * t) % 1) - 1;
            break;
          default:
            sample = Math.sin(2 * Math.PI * frequency * t);
        }

        // Apply envelope and volume
        sample *= envelope * volume * 0.3; // Keep headroom for mixing

        // Add subtle stereo width
        leftChannel[currentSample + i] += sample * 0.9;
        rightChannel[currentSample + i] += sample * 1.1;
      }

      currentSample += noteSamples;
    }

    return buffer;
  }

  private createEnvelope(sample: number, totalSamples: number): number {
    const attackTime = Math.min(totalSamples * 0.1, 441); // 10ms max attack
    const releaseTime = Math.min(totalSamples * 0.2, 882); // 20ms max release
    
    if (sample < attackTime) {
      return sample / attackTime; // Attack
    } else if (sample > totalSamples - releaseTime) {
      return (totalSamples - sample) / releaseTime; // Release
    } else {
      return 1.0; // Sustain
    }
  }

  private async generateSoundEffects(): Promise<void> {
    if (!this.audioContext) return;

    console.log('Generating sound effects...');
    const sampleRate = this.audioContext.sampleRate;

    // Paddle hit sound - chiptune blip
    const paddleBuffer = this.audioContext.createBuffer(1, sampleRate * 0.1, sampleRate);
    const paddleData = paddleBuffer.getChannelData(0);
    for (let i = 0; i < paddleData.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 30); // Quick decay
      const freq = 440 + Math.sin(t * 50) * 100; // Frequency modulation
      paddleData[i] = Math.sign(Math.sin(2 * Math.PI * freq * t)) * envelope * 0.3;
    }
    this.audioBuffers.set('paddle', paddleBuffer);

    // Score sound - ascending chiptune
    const scoreBuffer = this.audioContext.createBuffer(1, sampleRate * 0.3, sampleRate);
    const scoreData = scoreBuffer.getChannelData(0);
    for (let i = 0; i < scoreData.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      const freq = 440 * (1 + t * 2); // Rising frequency
      scoreData[i] = Math.sign(Math.sin(2 * Math.PI * freq * t)) * envelope * 0.4;
    }
    this.audioBuffers.set('score', scoreBuffer);

    // Speed up sound - power-up style
    const speedBuffer = this.audioContext.createBuffer(1, sampleRate * 0.4, sampleRate);
    const speedData = speedBuffer.getChannelData(0);
    for (let i = 0; i < speedData.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 6);
      const freq = 220 * Math.pow(2, t * 3); // Exponential rise
      speedData[i] = Math.sign(Math.sin(2 * Math.PI * freq * t)) * envelope * 0.5;
    }
    this.audioBuffers.set('speedUp', speedBuffer);

    // Game over sound (descending dramatic tone)
    const gameOverBuffer = this.audioContext.createBuffer(1, sampleRate * 1.0, sampleRate);
    const gameOverData = gameOverBuffer.getChannelData(0);
    for (let i = 0; i < gameOverData.length; i++) {
      const t = i / sampleRate;
      const freq = 440 - (t * 200); // Descending from 440Hz to 240Hz
      gameOverData[i] = Math.sin(freq * 2 * Math.PI * t) * Math.exp(-t * 2) * 0.5;
    }
    this.audioBuffers.set('gameover', gameOverBuffer);

    // Record broken sound - triumphant celebration
    const recordBuffer = this.audioContext.createBuffer(1, sampleRate * 1.5, sampleRate);
    const recordData = recordBuffer.getChannelData(0);
    for (let i = 0; i < recordData.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 1.5); // Longer decay for celebration
      // Triumphant chord progression: A major triad arpeggios
      const freq1 = 440 * (1 + Math.sin(t * 4) * 0.1); // A with vibrato
      const freq2 = 554.37 * (1 + Math.sin(t * 6) * 0.1); // C# with vibrato
      const freq3 = 659.25 * (1 + Math.sin(t * 8) * 0.1); // E with vibrato
      
      const sample1 = Math.sign(Math.sin(2 * Math.PI * freq1 * t)) * 0.3;
      const sample2 = Math.sign(Math.sin(2 * Math.PI * freq2 * t)) * 0.3;
      const sample3 = Math.sign(Math.sin(2 * Math.PI * freq3 * t)) * 0.3;
      
      recordData[i] = (sample1 + sample2 + sample3) * envelope * 0.6;
    }
    this.audioBuffers.set('record_broken', recordBuffer);

    console.log('Sound effects generated:', Array.from(this.audioBuffers.keys()));
  }

  async playMusic(trackType: 'intro' | 'main' | 'victory' | 'gameover', loop = false): Promise<void> {
    if (!this.audioContext || !this.musicGain || !this.isInitialized) {
      console.warn('Audio system not ready. Context:', !!this.audioContext, 'Gain:', !!this.musicGain, 'Initialized:', this.isInitialized);
      return;
    }

    // Resume AudioContext if suspended
    if (this.audioContext.state === 'suspended') {
      console.log('Resuming AudioContext for music playback...');
      await this.audioContext.resume();
      console.log('AudioContext state after resume:', this.audioContext.state);
    }

    this.stopMusic();

    const bufferKey = trackType === 'main' ? 'main_loop_a' : trackType;
    const buffer = this.audioBuffers.get(bufferKey);
    if (!buffer) {
      console.warn(`Music track not found: ${trackType}. Available tracks:`, Array.from(this.audioBuffers.keys()));
      return;
    }

    console.log(`Playing music: ${trackType}, loop: ${loop}`);
    this.currentMusic = this.audioContext.createBufferSource();
    this.currentMusic.buffer = buffer;
    this.currentMusic.connect(this.musicGain);
    this.currentMusic.loop = loop;
    
    if (loop && (trackType === 'main')) {
      this.currentMusic.loopStart = 0;
      this.currentMusic.loopEnd = buffer.duration;
    }

    this.currentMusic.start();
    this.isPlaying = true;
    this.isLooping = loop;
    this.currentTrackType = trackType;
  }

  stopMusic(): void {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
      } catch (e) {
        // Ignore errors from stopping already stopped sources
      }
      this.currentMusic = null;
    }
    this.isPlaying = false;
    this.isLooping = false;
    this.currentTrackType = null;
  }

  async playSoundEffect(effectName: string): Promise<void> {
    if (!this.audioContext || !this.sfxGain || !this.isInitialized) {
      console.warn('Audio system not ready for sound effects. Context:', !!this.audioContext, 'Gain:', !!this.sfxGain, 'Initialized:', this.isInitialized);
      return;
    }

    // Resume AudioContext if suspended
    if (this.audioContext.state === 'suspended') {
      console.log('Resuming AudioContext for sound effect...');
      await this.audioContext.resume();
    }

    const buffer = this.audioBuffers.get(effectName);
    if (!buffer) {
      console.warn(`Sound effect not found: ${effectName}. Available effects:`, Array.from(this.audioBuffers.keys()));
      return;
    }

    console.log(`Playing sound effect: ${effectName}`);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.sfxGain);
    source.start();
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
    if (!this.isPlaying || this.currentTrackType !== 'main') return;

    const currentBuffer = this.currentMusic?.buffer;
    const currentLoopA = this.audioBuffers.get('main_loop_a');
    const newBuffer = currentBuffer === currentLoopA ? 
      this.audioBuffers.get('main_loop_b') : 
      this.audioBuffers.get('main_loop_a');

    if (newBuffer && this.audioContext && this.musicGain) {
      this.stopMusic();
      this.currentMusic = this.audioContext.createBufferSource();
      this.currentMusic.buffer = newBuffer;
      this.currentMusic.connect(this.musicGain);
      this.currentMusic.loop = true;
      this.currentMusic.loopStart = 0;
      this.currentMusic.loopEnd = newBuffer.duration;
      this.currentMusic.start();
      this.isPlaying = true;
      this.isLooping = true;
      this.currentTrackType = 'main';
    }
  }

  cleanup(): void {
    this.stopMusic();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioBuffers.clear();
  }
}