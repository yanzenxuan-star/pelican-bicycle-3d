/**
 * Hybrid Audio Engine combining:
 * 1. MiniMax AI-composed original French Riviera accordion/guitar/ukulele soundtrack
 * 2. MiniMax AI-synthesized Captain Peli character voice lines (with automatic BGM ducking)
 * 3. Real-time procedural Web Audio foley:
 *    - Swelling ocean surf waves + speed-scaled coastal breeze
 *    - Metallic FM brass handlebar bell ("Ding-ding!")
 *    - Bicycle freehub ratchet ticks synchronized to wheel spin
 *    - Synthesized pelican squawk & pouch gulp
 */
export function createSoundEngine() {
  let ctx = null;
  let masterGain = null;
  let bgmGain = null;
  let oceanGain = null;
  let windGain = null;
  let windFilter = null;

  let enabled = false;
  let musicEnabled = true;
  let voiceEnabled = true;

  let bgmAudio = null;
  let bgmSource = null;
  let activeVoice = null;
  let freehubAcc = 0;

  const voiceClips = {
    greet: './assets/audio/voice_greet.mp3',
    turbo: './assets/audio/voice_turbo.mp3',
    fish: './assets/audio/voice_fish.mp3',
    wings: './assets/audio/voice_wings.mp3',
  };
  let lastVoiceAt = 0;

  function makePinkNoiseBuffer(audioCtx, seconds = 3) {
    const length = audioCtx.sampleRate * seconds;
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  function initAudioContext() {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.85;
    masterGain.connect(ctx.destination);

    // 1. Procedural Ocean Surf Waves (slowly modulated lowpass pink noise)
    const noiseBuf = makePinkNoiseBuffer(ctx, 4);
    const oceanSrc = ctx.createBufferSource();
    oceanSrc.buffer = noiseBuf;
    oceanSrc.loop = true;

    const oceanFilter = ctx.createBiquadFilter();
    oceanFilter.type = 'lowpass';
    oceanFilter.frequency.value = 340;

    oceanGain = ctx.createGain();
    oceanGain.gain.value = 0.22;

    oceanSrc.connect(oceanFilter);
    oceanFilter.connect(oceanGain);
    oceanGain.connect(masterGain);
    oceanSrc.start();

    // 2. Speed-scaled Coastal Sea Breeze Rush
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuf;
    windSrc.loop = true;

    windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 520;
    windFilter.Q.value = 1.4;

    windGain = ctx.createGain();
    windGain.gain.value = 0.04;

    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    windSrc.start();

    // 3. MiniMax AI-Composed Original Riviera Soundtrack (HTMLAudio -> WebAudio Gain)
    bgmAudio = new Audio('./assets/audio/riviera_theme.mp3');
    bgmAudio.loop = true;
    bgmAudio.crossOrigin = 'anonymous';
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.36;
    try {
      bgmSource = ctx.createMediaElementSource(bgmAudio);
      bgmSource.connect(bgmGain);
      bgmGain.connect(masterGain);
    } catch {
      bgmAudio.volume = 0.36;
    }
  }

  async function enable({ playGreeting = true } = {}) {
    initAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    enabled = true;
    masterGain.gain.setTargetAtTime(0.85, ctx.currentTime, 0.12);
    if (musicEnabled && bgmAudio) {
      bgmAudio.play().catch(() => {});
    }
    if (playGreeting) {
      setTimeout(() => playVoice('greet'), 260);
    }
  }

  function disable() {
    enabled = false;
    if (ctx && masterGain) {
      masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
    }
    if (bgmAudio) {
      bgmAudio.pause();
    }
    if (activeVoice) {
      activeVoice.pause();
      activeVoice = null;
    }
  }

  async function toggle() {
    if (enabled) {
      disable();
      return false;
    }
    await enable({ playGreeting: true });
    return true;
  }

  function playVoice(key) {
    if (!enabled || !voiceEnabled || !voiceClips[key]) return;
    const now = performance.now();
    if (now - lastVoiceAt < 2100 && key !== 'greet') return;
    lastVoiceAt = now;

    if (activeVoice) {
      activeVoice.pause();
      activeVoice = null;
    }
    const v = new Audio(voiceClips[key]);
    v.volume = 0.92;
    activeVoice = v;

    // Gentle BGM ducking while Captain Peli speaks
    if (ctx && bgmGain) {
      bgmGain.gain.setTargetAtTime(0.14, ctx.currentTime, 0.08);
    }
    v.onended = () => {
      if (ctx && bgmGain) {
        bgmGain.gain.setTargetAtTime(musicEnabled ? 0.36 : 0.0, ctx.currentTime, 0.25);
      }
      if (activeVoice === v) activeVoice = null;
    };
    v.play().catch(() => {});
  }

  /**
   * Authentic Brass Bicycle Bell ("Ding-ding!") using harmonic metallic partials
   */
  function playBell() {
    if (!enabled || !ctx) return;
    const now = ctx.currentTime;
    const strikeTimes = [now, now + 0.145];
    const partials = [
      { freq: 1840, gain: 0.28, decay: 1.35 },
      { freq: 3695, gain: 0.16, decay: 0.9 },
      { freq: 5110, gain: 0.09, decay: 0.6 },
      { freq: 2770, gain: 0.11, decay: 0.75 },
    ];

    for (const t0 of strikeTimes) {
      for (const p of partials) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(p.gain, t0 + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + p.decay);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t0);
        osc.stop(t0 + p.decay + 0.05);
      }
    }
  }

  /**
   * Playful pelican throat squawk / pouch gulp foley
   */
  function playSquawk() {
    if (!enabled || !ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filt = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(165, now + 0.32);

    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(780, now);
    filt.Q.value = 3.2;

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(filt);
    filt.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  function playFishCatch() {
    if (!enabled || !ctx) return;
    const now = ctx.currentTime;
    // Playful comical "gulp + happy pop"
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.24, now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
    setTimeout(() => playVoice('fish'), 180);
  }

  function playFreehubTick() {
    if (!enabled || !ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2600 + Math.random() * 280, now);
    g.gain.setValueAtTime(0.018, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.018);
  }

  function update(dt, time, { speedMps, isCoasting }) {
    if (!enabled || !ctx) return;

    // Ocean wave rhythmic swell (period ~7s)
    const surf = 0.14 + (Math.sin(time * 0.85) * 0.5 + 0.5) * 0.13;
    oceanGain.gain.setTargetAtTime(surf, ctx.currentTime, 0.12);

    // Coastal breeze intensity & pitch scale smoothly with cycling velocity!
    const normSpeed = Math.min(1, speedMps / 12);
    windGain.gain.setTargetAtTime(0.02 + normSpeed * 0.12, ctx.currentTime, 0.12);
    windFilter.frequency.setTargetAtTime(360 + normSpeed * 740, ctx.currentTime, 0.12);

    // Authentic bicycle freehub ratchet clicking when coasting with wings spread!
    if (isCoasting && speedMps > 1.0) {
      freehubAcc += speedMps * dt * 3.8;
      if (freehubAcc >= 1) {
        freehubAcc -= 1;
        playFreehubTick();
      }
    }
  }

  return {
    isEnabled: () => enabled,
    toggle,
    enable,
    disable,
    playBell,
    playSquawk,
    playFishCatch,
    playVoice,
    update,
  };
}
