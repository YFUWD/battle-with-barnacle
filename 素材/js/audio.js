/* =========================================================
   08 音频
   ---------------------------------------------------------
   BGM：素材/audio/bgm_let_me_go.m4a（全局循环，音量偏低）
   胜利音效：素材/audio/sfx_victory.m4a（播放前先停 BGM）
   其余音效：全部用 Web Audio 现场合成，不占素材
   静音：M 键 / 主菜单右上角按钮

   浏览器不允许自动播放：所有音频都在"开始游戏"那一下的
   用户手势里初始化并起播。没有音频环境（比如无头自检）时
   整个模块自动降级为空操作，不会影响游戏。
   ========================================================= */

const AUDIO_FILES = {
  bgm:     '素材/audio/bgm_let_me_go.m4a',
  victory: '素材/audio/sfx_victory.m4a',
};

const AUDIO_VOLUME = {
  master:    1.0,
  bgm:       0.32,   // 全局 BGM：压低一点，别盖住音效
  sfx:       0.75,
  victory:   0.9,
};

let audioCtx   = null;
let masterGain = null;
let bgmEl      = null;
let victoryEl  = null;
let audioReady = false;
let muted      = false;

function audioSupported() {
  return typeof window !== 'undefined'
      && typeof window.AudioContext !== 'undefined'
      && typeof window.Audio !== 'undefined';
}

// 必须在用户手势（点击开始游戏）里调用
function audioInit() {
  if (!audioSupported()) return false;
  if (audioReady) { audioResume(); return true; }
  try {
    audioCtx = new window.AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : AUDIO_VOLUME.master;
    masterGain.connect(audioCtx.destination);

    bgmEl = new window.Audio(AUDIO_FILES.bgm);
    bgmEl.loop = true;
    bgmEl.volume = AUDIO_VOLUME.bgm;
    bgmEl.muted = muted;

    victoryEl = new window.Audio(AUDIO_FILES.victory);
    victoryEl.volume = AUDIO_VOLUME.victory;
    victoryEl.muted = muted;

    audioReady = true;
    return true;
  } catch (e) {
    audioReady = false;
    return false;
  }
}

function audioResume() {
  try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
}

function isMuted() { return muted; }

function setMuted(m) {
  muted = !!m;
  try {
    if (masterGain) masterGain.gain.value = muted ? 0 : AUDIO_VOLUME.master;
    if (bgmEl) bgmEl.muted = muted;
    if (victoryEl) victoryEl.muted = muted;
  } catch (e) {}
}

function toggleMute() {
  setMuted(!muted);
  if (!muted) playSfx('ui');
  return muted;
}

// ---------------- BGM / 胜利音效 ----------------
function startBGM() {
  if (!audioReady || !bgmEl) return;
  audioResume();
  try {
    bgmEl.volume = AUDIO_VOLUME.bgm;
    const p = bgmEl.play();
    if (p && p.catch) p.catch(function () {});
  } catch (e) {}
}

// 淡出后再停，避免"啪"的一声
function stopBGM(fadeMs) {
  if (!audioReady || !bgmEl) return;
  const fade = fadeMs || 0;
  if (fade <= 0) { try { bgmEl.pause(); } catch (e) {} return; }
  const steps = Math.max(1, Math.round(fade / 40));
  let i = 0;
  const from = bgmEl.volume;
  const timer = setInterval(function () {
    i++;
    try { bgmEl.volume = Math.max(0, from * (1 - i / steps)); } catch (e) {}
    if (i >= steps) {
      clearInterval(timer);
      try { bgmEl.pause(); bgmEl.volume = AUDIO_VOLUME.bgm; } catch (e) {}
    }
  }, 40);
}

function playVictory() {
  stopBGM(400);
  if (!audioReady || !victoryEl) return;
  audioResume();
  try {
    victoryEl.currentTime = 0;
    const p = victoryEl.play();
    if (p && p.catch) p.catch(function () {});
  } catch (e) {}
}

// ---------------- 合成音效 ----------------
function sfxTone(o) {
  // o: {type, freq, freq2, dur, vol, delay, attack}
  if (!audioCtx || !masterGain) return;
  const t0 = audioCtx.currentTime + (o.delay || 0);
  const dur = o.dur || 0.12;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = o.type || 'square';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freq2), t0 + dur);

  const vol = (o.vol == null ? 0.5 : o.vol) * AUDIO_VOLUME.sfx;
  const atk = o.attack == null ? 0.006 : o.attack;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(g); g.connect(masterGain);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function sfxNoise(o) {
  // o: {dur, vol, freq (低通截止), delay, q}
  if (!audioCtx || !masterGain) return;
  const t0 = audioCtx.currentTime + (o.delay || 0);
  const dur = o.dur || 0.2;
  const len = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(o.freq || 1200, t0);
  if (o.freq2) filter.frequency.exponentialRampToValueAtTime(o.freq2, t0 + dur);
  filter.Q.value = o.q || 1;

  const g = audioCtx.createGain();
  const vol = (o.vol == null ? 0.5 : o.vol) * AUDIO_VOLUME.sfx;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(filter); filter.connect(g); g.connect(masterGain);
  src.start(t0); src.stop(t0 + dur + 0.02);
}

function playSfx(name) {
  if (!audioReady || muted) return;
  audioResume();
  try {
    switch (name) {
      // ---- 玩家 ----
      case 'jump':      sfxTone({ type: 'square',   freq: 320, freq2: 720, dur: 0.13, vol: 0.30 }); break;
      case 'jump2':     sfxTone({ type: 'triangle', freq: 520, freq2: 1180, dur: 0.16, vol: 0.34 });
                        sfxTone({ type: 'sine',     freq: 900, freq2: 1600, dur: 0.18, vol: 0.18, delay: 0.03 }); break;
      case 'shoot1':    sfxTone({ type: 'square',   freq: 660, freq2: 880, dur: 0.07, vol: 0.26 }); break;
      case 'shoot2':    sfxTone({ type: 'square',   freq: 780, freq2: 1040, dur: 0.07, vol: 0.26 }); break;
      case 'shoot3':    sfxTone({ type: 'square',   freq: 920, freq2: 1240, dur: 0.09, vol: 0.28 }); break;
      case 'shootOrb':  sfxNoise({ dur: 0.22, vol: 0.35, freq: 2400, freq2: 500 });
                        sfxTone({ type: 'sine', freq: 300, freq2: 900, dur: 0.2, vol: 0.30 }); break;

      // ---- 命中 ----
      case 'hitWeak':   sfxTone({ type: 'triangle', freq: 880, freq2: 320, dur: 0.09, vol: 0.30 });
                        sfxNoise({ dur: 0.07, vol: 0.22, freq: 3000 }); break;
      case 'hitHead':   sfxTone({ type: 'triangle', freq: 520, freq2: 200, dur: 0.12, vol: 0.32 });
                        sfxNoise({ dur: 0.09, vol: 0.26, freq: 2200 }); break;
      case 'hitBlock':  sfxTone({ type: 'sine', freq: 180, freq2: 90, dur: 0.14, vol: 0.30 });
                        sfxNoise({ dur: 0.1, vol: 0.2, freq: 900 }); break;
      case 'hitMonster':sfxTone({ type: 'sawtooth', freq: 240, freq2: 120, dur: 0.09, vol: 0.22 }); break;
      case 'monsterDie':sfxTone({ type: 'square', freq: 420, freq2: 120, dur: 0.16, vol: 0.26 });
                        sfxNoise({ dur: 0.14, vol: 0.24, freq: 1600 }); break;

      // ---- 拾取 / 铁盆 ----
      case 'token':     sfxTone({ type: 'square', freq: 880,  dur: 0.06, vol: 0.22 });
                        sfxTone({ type: 'square', freq: 1320, dur: 0.06, vol: 0.22, delay: 0.06 });
                        sfxTone({ type: 'square', freq: 1760, dur: 0.12, vol: 0.22, delay: 0.12 }); break;
      case 'basinPickup': sfxTone({ type: 'sine', freq: 1200, freq2: 1800, dur: 0.18, vol: 0.22 });
                        sfxTone({ type: 'sine', freq: 2400, dur: 0.2, vol: 0.12, delay: 0.02 }); break;
      case 'basinBlock': // 铁盆挡伤害：金属"当"一声
                        sfxTone({ type: 'triangle', freq: 1480, freq2: 1150, dur: 0.45, vol: 0.30 });
                        sfxTone({ type: 'triangle', freq: 2230, freq2: 1900, dur: 0.35, vol: 0.20, delay: 0.005 });
                        sfxTone({ type: 'triangle', freq: 3150, dur: 0.22, vol: 0.12, delay: 0.01 });
                        sfxNoise({ dur: 0.06, vol: 0.22, freq: 5000 }); break;

      // ---- 藤壶 ----
      case 'smashWarn': sfxTone({ type: 'square', freq: 300, dur: 0.09, vol: 0.18 });
                        sfxTone({ type: 'square', freq: 300, dur: 0.09, vol: 0.18, delay: 0.14 }); break;
      case 'smashLand': sfxTone({ type: 'sine', freq: 150, freq2: 55, dur: 0.32, vol: 0.42 });
                        sfxNoise({ dur: 0.3, vol: 0.34, freq: 700, freq2: 200 }); break;
      case 'fallLand':  sfxTone({ type: 'sine', freq: 220, freq2: 90, dur: 0.16, vol: 0.26 });
                        sfxNoise({ dur: 0.14, vol: 0.2, freq: 1100 }); break;

      // ---- 受伤 / 演出 ----
      case 'hurt':      sfxTone({ type: 'sawtooth', freq: 420, freq2: 110, dur: 0.28, vol: 0.34 });
                        sfxNoise({ dur: 0.18, vol: 0.2, freq: 1400 }); break;
      case 'explode':   sfxNoise({ dur: 0.9, vol: 0.5, freq: 1600, freq2: 120 });
                        sfxTone({ type: 'sine', freq: 90, freq2: 35, dur: 0.8, vol: 0.45 });
                        sfxNoise({ dur: 0.25, vol: 0.35, freq: 4000, delay: 0.02 }); break;
      case 'squash':    sfxTone({ type: 'sawtooth', freq: 300, freq2: 60, dur: 0.4, vol: 0.34 });
                        sfxNoise({ dur: 0.35, vol: 0.26, freq: 900, freq2: 250 }); break;
      case 'ultimate':  sfxTone({ type: 'sine', freq: 120, freq2: 900, dur: 0.7, vol: 0.45 });
                        sfxNoise({ dur: 0.7, vol: 0.35, freq: 2600, freq2: 300 });
                        sfxTone({ type: 'triangle', freq: 880, dur: 0.5, vol: 0.22, delay: 0.18 }); break;
      // 失败 sting：小调下行 + 低频闷音
      case 'defeat':    sfxTone({ type: 'triangle', freq: 392, dur: 0.28, vol: 0.32 });
                        sfxTone({ type: 'triangle', freq: 311, dur: 0.28, vol: 0.32, delay: 0.22 });
                        sfxTone({ type: 'triangle', freq: 233, dur: 0.6,  vol: 0.34, delay: 0.44 });
                        sfxTone({ type: 'sine',     freq: 98,  freq2: 60, dur: 1.1, vol: 0.3, delay: 0.44 }); break;

      case 'ui':        sfxTone({ type: 'square', freq: 720, freq2: 980, dur: 0.05, vol: 0.2 }); break;
      default: break;
    }
  } catch (e) {}
}

// 胜负统一入口：胜利放 victory 音效（先停 BGM），失败停 BGM + 合成失败 sting
function onGameOver(isWin) {
  if (isWin) {
    playVictory();
  } else {
    stopBGM(500);
    playSfx('defeat');
  }
}
