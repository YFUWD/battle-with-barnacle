/* =========================================================
   Boss 战 · 框架原型（远程 + 二阶段）
   ---------------------------------------------------------
   01 基础配置 / 画布 / 素材槽位 / 输入 / 全局状态
   ---------------------------------------------------------
   A / D 移动    S 蹲下    K 跳跃    J 攻击（按住持续）
   空格 暂停     R 重开
   ========================================================= */

const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
const W = cvs.width;
const H = cvs.height;

const GROUND_H = H / 5;
const GROUND_Y = H - GROUND_H;
const GRAVITY  = 0.85;
const MAX_FALL = 20;

// 海平线（天空与大海的分界线）
// 天空 55% / 海 25% / 沙滩 20%
const SEA_HORIZON_Y = H * 0.55;

// ---------------- 素材槽位 ----------------
// 已接入美术（加载清单见 js/assets.js）：
//   suitBarnacleBody / suitBarnacleHead / barnacleHead / ironBasinFull / ironBasinEmpty
//   ultimate / bulletOrb / winCG / loseCG / playerMove[]
// 仍是程序绘制的占位（素材暂无）：
//   fallingBarnacle / barnacleMonster / bulletText / barnacleBullet /
//   smashingBarnacle / gpt / token / ground / background
const assets = {
  player:                null,   // 单张玩家图（现由 playerMove 动画帧取代）
  playerMove:            [],     // 移动动画帧序列（47 帧）
  suitBarnacleBody:      null,   // 西装藤壶·身体（西装）
  suitBarnacleHead:      null,   // 西装藤壶·脑袋（一阶段藤壶头）
  suitBarnacleWeakPoint: null,   // 弱点（仍程序绘制）
  barnacleHead:          null,   // 二阶段·圆形藤壶
  fallingBarnacle:       null,   // 下落藤壶（藤壶群生贴图）
  barnacleMonster:       [],     // 小怪：从 各种藤壶.png 切的 3 只小藤壶
  bulletText:            null,
  bulletOrb:             null,   // 强化子弹 = 萌鲸鱼
  barnacleBullet:        null,   // 二阶段子弹 = 藤壶贴图
  smashingBarnacle:      [],     // 砸藤壶：2 只藤壶贴图，随机用
  gpt:                   null,   // GPT = 萌化小人
  ironBasinFull:         null,   // 铁盆·满（生命值 / 地面拾取）
  ironBasinEmpty:        null,   // 铁盆·空（已失去的那一格生命值）
  basinHatBack:          null,   // 倒扣铁盆·后半（画在角色后面）
  basinHatFront:         null,   // 倒扣铁盆·前半（画在角色前面，盖住脑袋）
  ultimate:              null,   // 大招图标（深度思考图标放大）
  winCG:                 null,
  loseCG:                null,
  token:                 null,
  ground:                null,
  background:            null,
};

function imgReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

function hasSprite(name) {
  return imgReady(assets[name]);
}

function hasMoveFrames() {
  for (const f of assets.playerMove) if (imgReady(f)) return true;
  return false;
}

// 当前该画哪一帧移动动画
function currentMoveFrame() {
  const list = assets.playerMove;
  if (list.length === 0) return null;
  const f = list[player.animFrame % list.length];
  return imgReady(f) ? f : null;
}

// 小怪贴图（按 g.variant 取不同的一只）
function monsterSprite(m) {
  const list = assets.barnacleMonster;
  if (!list || list.length === 0) return null;
  const i = Math.abs(m.variant || 0) % list.length;
  const img = list[i];
  return imgReady(img) ? img : null;
}

// 砸藤壶贴图（按 b.variant 随机取）
function smashSprite(b) {
  const list = assets.smashingBarnacle;
  if (!list || list.length === 0) return null;
  const i = Math.abs(b.variant || 0) % list.length;
  const img = list[i];
  return imgReady(img) ? img : null;
}

// 倒扣铁盆是否就绪（两层都就绪才能正确分层，否则退回旧的翻转画法）
function basinHatReady() {
  return imgReady(assets.basinHatBack) && imgReady(assets.basinHatFront);
}

// ---------------- 素材绘制参数 ----------------
const PLAYER_SPRITE_H  = 84;     // 移动动画绘制高度（脚底对齐 player.y）
const PLAYER_FACE_LEFT = true;   // 素材本身朝左，facing=1（右）时需要镜像

// 西装藤壶：头部坐在身体的领口上（比例参照 素材/参考_西装藤壶头身关系.jpg）
//   身体宽 360 -> 高约 298，顶边落在 y=350
//   脑袋高 240 -> 宽约 182，底边压在领口下沿 y=390（盖住领口 40px）
//   弱点仍在 (720, 315.5)，正好落在脑袋下部 70% 处
const SUIT_BODY_DRAW_W  = 360;   // 西装身体绘制宽度（高度按原图比例）
const SUIT_HEAD_DRAW_H  = 240;   // 藤壶脑袋绘制高度
const SUIT_HEAD_BOTTOM_Y = 390;  // 脑袋底边（盖住西装领口）
const SUIT_WEAK_DRAW_R  = 30;    // 弱点球的视觉半径（判定半径仍是 SUIT_BARNACLE_WEAK_R）

const BASIN_HP_W   = 46;         // 生命值铁盆宽度
const BASIN_ITEM_W = 62;         // 地面铁盆宽度
const BASIN_HAT_W  = 64;         // 头顶倒扣铁盆宽度（前后两层用同一个矩形，保证对得上）
const BASIN_HAT_BOTTOM = 50;     // 倒扣铁盆底边离脚底的高度（盆口前缘压到额头，眼睛露在盆沿下）
                                 // 参考：角色贴图高 84，脑袋顶约在 68、眼睛约在 45
const MONSTER_DRAW_H = 44;       // 小怪贴图绘制高度（碰撞半径仍是 r=18）
const ULTIMATE_ICON_R = 130;     // 大招图标放大后的半径

const GPT_DRAW_H = 96;           // 萌化小人（GPT）绘制高度
const WHALE_BULLET_W = 56;       // 强化子弹（萌鲸鱼）绘制宽度

// 死亡演出（帧 @60fps，180 帧 = 3 秒）
const DEATH_FRAMES = 180;
const SUIT_SHAKE_FRAMES = 60;    // 一阶段：西装抖动 -> 爆炸 -> 沉海
const HEAD_SHAKE_FRAMES = 90;    // 二阶段：藤壶抖动 -> 压扁
const HEAD_SQUASH_FRAMES = 45;

const TOKEN_DROP_RATE = 0.5;     // 小怪掉 Token 的概率（清屏大招杀死的同样判定）

// ---------------- 西装藤壶：三角形身体 + 头部圆圈 ----------------
// 头部圆圈（弱点黄球就放在这里面）
const SUIT_BARNACLE_HEAD_X = W / 2;
const SUIT_BARNACLE_HEAD_Y = SEA_HORIZON_Y - 130;
const SUIT_BARNACLE_HEAD_R = 70;

// 三角形身体（顶点朝上，底边在下）
const SUIT_BARNACLE_APEX_X = W / 2;
const SUIT_BARNACLE_APEX_Y = SUIT_BARNACLE_HEAD_Y + SUIT_BARNACLE_HEAD_R;
const SUIT_BARNACLE_BASE_Y = GROUND_Y;
const SUIT_BARNACLE_W = 500;
const SUIT_BARNACLE_X = (W - SUIT_BARNACLE_W) / 2;
const SUIT_BARNACLE_Y = SUIT_BARNACLE_APEX_Y;
const SUIT_BARNACLE_H = SUIT_BARNACLE_BASE_Y - SUIT_BARNACLE_APEX_Y;

// 弱点（黄球）大小
const SUIT_BARNACLE_WEAK_R = 60;

// ---------------- 下落藤壶槽位 ----------------
const FALLING_BARNACLE_SLOT_COUNT = 10;
const FALLING_BARNACLE_SLOT_W     = W / FALLING_BARNACLE_SLOT_COUNT;
const FALLING_BARNACLE_R          = FALLING_BARNACLE_SLOT_W / 2;

// ---------------- 二阶段：藤壶子弹四个固定高度 ----------------
const BARNACLE_HEAD_HEIGHTS = [
  GROUND_Y - 248,
  GROUND_Y - 141,
  GROUND_Y - 72,
  GROUND_Y - 36
];

const CHARGE_FRAMES = 120;
const DASH_SCALE = 1.45;

const DASH_FLIGHT_FRAMES = 20;
const DASH_GRAVITY = 0.375;
const DASH_VY0 = -7.0;

const BARNACLE_BULLET_SPEED = 4.5;
const BARNACLE_HEAD_BURST_INTERVAL = 65;

// ---------------- 砸藤壶 ----------------
const SMASHING_BARNACLE_W = W / 4;   // 宽度缩小为原来的 3/4（W/3 × 3/4 = W/4）
const SMASHING_BARNACLE_H = 260;
const SMASHING_BARNACLE_LIFE = 300;
const SMASHING_BARNACLE_HOVER_Y = 130;
const SMASHING_BARNACLE_HOVER_TIME = 20;
const SMASHING_BARNACLE_FALL_VY0 = 22;
const SMASHING_BARNACLE_FALL_GRAVITY = 3.0;

// 五个落点：均匀分布
const SMASHING_BARNACLE_POSITIONS = [
  W * 0.1,
  W * 0.3,
  W * 0.5,
  W * 0.7,
  W * 0.9
];

const SMASHING_BARNACLE_INITIAL_DELAY = 600;

// ---------------- 开场按钮 ----------------
// 说明面板 8 行（325~617），按钮放到面板下方，别再压住最后几行
const INTRO_BTN = { x: (W - 260) / 2, y: 632, w: 260, h: 70 };
// 主菜单右上角的静音按钮
const INTRO_MUTE_BTN = { x: W - 260, y: 36, w: 220, h: 54 };

function inRect(p, b) {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

// ---------------- 输入 ----------------
const keys = {};
const actionQueue = [];
const mouse = { x: W * 0.5, y: 100 };

function getMousePos(e) {
  const r = cvs.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (W / r.width),
    y: (e.clientY - r.top)  * (H / r.height)
  };
}

window.addEventListener('keydown', (e) => {
  if (['Space','KeyA','KeyD','KeyS','KeyJ','KeyK','KeyR','KeyL','KeyM'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;

  if (e.code === 'KeyK') { actionQueue.push('jump'); }
  if (e.code === 'KeyR') resetGame();
  if (e.code === 'KeyL') unleashUltimate();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'Space') {
    if (gameState === 'playing') {
      paused = !paused;
    }
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

window.addEventListener('mousemove', (e) => {
  const p = getMousePos(e);
  mouse.x = p.x;
  mouse.y = p.y;
});
// 鼠标 / 触屏共用的"点了一下"逻辑（坐标已换算到画布）
function handlePointerDown(gx, gy) {
  if (gameState === 'intro') {
    if (inRect({ x: gx, y: gy }, INTRO_MUTE_BTN)) { toggleMute(); return; }
    if (!introTransition && allAssetsReady() && inRect({ x: gx, y: gy }, INTRO_BTN)) {
      audioInit();          // 必须在用户手势里初始化音频
      startBGM();
      loadLateAssets();     // 两张 CG 这时候开始后台加载
      playSfx('ui');
      introTransition = true;
    }
  }
}

cvs.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  const p = getMousePos(e);
  handlePointerDown(p.x, p.y);
});

// ---------------- 触屏 ----------------
function onTouchStart(e) {
  if (typeof touchPress !== 'function') return;
  e.preventDefault();
  for (const t of e.changedTouches) {
    const p = getMousePos(t);
    const key = touchPress(p.x, p.y);
    if (key) touchPointers[t.identifier] = key;
  }
}
function onTouchEnd(e) {
  if (typeof touchReleaseKey !== 'function') return;
  e.preventDefault();
  for (const t of e.changedTouches) {
    touchReleaseKey(touchPointers[t.identifier]);
    delete touchPointers[t.identifier];
  }
}
cvs.addEventListener('touchstart',  onTouchStart, { passive: false });
cvs.addEventListener('touchend',    onTouchEnd,   { passive: false });
cvs.addEventListener('touchcancel', onTouchEnd,   { passive: false });
cvs.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------------- 全局状态 ----------------
let gameState = 'intro';
let paused = false;
let globalTime = 0;
let shake = 0;

let cameraY = H;
let introTransition = false;
let hasIntroPlayed = false;

const projectiles = [];
const particles   = [];
const fallingBarnacles  = [];
const barnacleMonsters  = [];
const smashingBarnacles = [];

const gptList = [];
const ironBasins = [];
const tokenList = [];

let tokensCollected = 0;
let ultimateFlash = 0;

let barnacleHead = null;

let gptCooldown = 900;

let lastAttackType = null;
let secondLastAttackType = null;

// ---------------- 云朵 ----------------
const clouds = [];
function initClouds() {
  clouds.length = 0;
  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: Math.random() * W,
      y: -H + 60 + Math.random() * (H - 120),
      w: 100 + Math.random() * 100,
      h: 40 + Math.random() * 30,
      speed: 0.15 + Math.random() * 0.35,
      alpha: 0.4 + Math.random() * 0.4
    });
  }
}
initClouds();