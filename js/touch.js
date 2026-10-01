/* =========================================================
   09 触屏按键
   ---------------------------------------------------------
   按键画在画布里（和游戏同一套坐标），所以缩放、对齐都不用额外处理。
   入口页通过 window.DSH_TOUCH_MODE 指定：
     'off'  -> 电脑版：纯键盘，永不显示按键
     'on'   -> 手机版：始终显示按键
     'auto' -> 默认：检测到触屏设备才显示（没指定时用这个）
   ========================================================= */

const TOUCH_MODE = (typeof window !== 'undefined' && window.DSH_TOUCH_MODE) || 'auto';

function isTouchDevice() {
  if (TOUCH_MODE === 'on')  return true;
  if (TOUCH_MODE === 'off') return false;

  // 注意：不能只看 'ontouchstart' in window
  // —— Windows 上的 Chrome 即使没有触摸屏，这个值也可能是 true，会把按键误显示到电脑上。
  // 用媒体查询判断"手指输入"：手机/平板是 coarse + hover:none；带触摸屏的笔记本仍有鼠标，hover 成立，不会误判。
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const coarse  = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  const points  = (typeof navigator !== 'undefined' && navigator.maxTouchPoints) || 0;
  return (coarse || noHover) && points > 0;
}

// 按下的都是游戏里已有的键，逻辑不用改
const TOUCH_KEYS = [
  { id: 'left',  key: 'KeyA', label: '◀',  x: 150,  y: 690, r: 66 },
  { id: 'right', key: 'KeyD', label: '▶',  x: 306,  y: 690, r: 66 },
  { id: 'down',  key: 'KeyS', label: '蹲',  x: 228,  y: 556, r: 50 },
  { id: 'jump',  key: 'KeyK', label: '跳',  x: 1128, y: 686, r: 62 },
  { id: 'fire',  key: 'KeyJ', label: '攻击', x: 1300, y: 690, r: 76 },
  { id: 'ult',   key: 'KeyL', label: '大招', x: 1180, y: 540, r: 50 },
];

// 边角小按钮（不是长按键，点一下触发一次）
const TOUCH_TAPS = [
  { id: 'pause', label: '暂停', x: 636, y: 70, r: 40 },
  { id: 'mute',  label: '静音', x: 752, y: 70, r: 40 },
];

const touchPointers = {};   // touch.identifier -> 正在按的键

// ---------------- 强制横屏 ----------------
// QQ/微信内置浏览器通常锁不住屏幕方向，所以：
//   1) 先试着进全屏 + screen.orientation.lock('landscape')（普通手机浏览器能成）
//   2) 没成就把画布自己转 90°，让玩家把手机横过来看（H5 通用做法）
let forcedLandscape = false;

function viewportPortrait() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < window.innerHeight;
}

function enterForcedLandscape() {
  // ① 全屏 + 尝试锁定方向
  try {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) {
      const p = req.call(el);
      if (p && p.catch) p.catch(function () {});
    }
  } catch (e) {}
  try {
    if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
      const p = screen.orientation.lock('landscape');
      if (p && p.catch) p.catch(function () {});
    }
  } catch (e) {}

  // ② 兜底：自己转
  forcedLandscape = true;
  layoutForcedCanvas();
}

function layoutForcedCanvas() {
  if (!forcedLandscape) return;
  const el = document.getElementById('game');
  if (!el) return;
  const vw = window.innerWidth, vh = window.innerHeight;
  const scale = Math.min(vh / W, vw / H);     // 横过来之后能塞多大
  const dw = Math.round(W * scale);
  const dh = Math.round(H * scale);
  el.style.position = 'fixed';
  el.style.left = '50%';
  el.style.top = '50%';
  el.style.width = dw + 'px';
  el.style.height = dh + 'px';
  el.style.maxWidth = 'none';
  el.style.maxHeight = 'none';
  el.style.transform = 'translate(-50%,-50%) rotate(90deg)';
  el.style.transformOrigin = 'center center';
  el.style.borderRadius = '0';
}

function clearForcedLandscape() {
  forcedLandscape = false;
  try {
    const el = document.getElementById('game');
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.width = '';
    el.style.height = '';
    el.style.maxWidth = '';
    el.style.maxHeight = '';
    el.style.transform = '';
    el.style.transformOrigin = '';
    el.style.borderRadius = '';
  } catch (e) {}
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('resize', function () {
    // 玩家自己把手机横过来了 -> 取消强制旋转，免得转两下
    if (forcedLandscape && !viewportPortrait()) clearForcedLandscape();
    else if (forcedLandscape) layoutForcedCanvas();
  });
}

function touchControlsOn() {
  return touchActive;
}
let touchActive = isTouchDevice();

// 手指按下：命中虚拟键 -> 变成对应的键盘状态
function touchPress(gx, gy) {
  // 竖屏（QQ 里转不过来）-> 第一次点屏幕就强制横过来
  if (viewportPortrait() && !forcedLandscape) { enterForcedLandscape(); return null; }

  // 边角小钮要在任何状态下都能用（尤其是"暂停后点它恢复"）
  if (gameState === 'playing') {
    for (const t of TOUCH_TAPS) {
      if (Math.hypot(gx - t.x, gy - t.y) <= t.r + 14) {
        if (t.id === 'pause') paused = !paused;
        if (t.id === 'mute') toggleMute();
        return null;
      }
    }
  }

  // 结算画面：点哪儿都重开
  if (gameState === 'win' || gameState === 'lose') { resetGame(); return null; }

  // 主菜单 / 暂停中：交给鼠标那套点击逻辑
  if (gameState !== 'playing' || paused) {
    handlePointerDown(gx, gy);
    return null;
  }

  for (const b of TOUCH_KEYS) {
    if (Math.hypot(gx - b.x, gy - b.y) <= b.r + 12) {
      keys[b.key] = true;
      if (b.key === 'KeyK') actionQueue.push('jump');   // 跳是一次性动作
      return b.key;
    }
  }
  return null;
}

function touchReleaseAll() {
  for (const k of Object.keys(touchPointers)) {
    keys[touchPointers[k]] = false;
    delete touchPointers[k];
  }
  // 兜底：把按键全部松开，避免"卡住一直往右跑"
  for (const b of TOUCH_KEYS) keys[b.key] = false;
}

function touchReleaseKey(key) {
  if (!key) return;
  for (const id of Object.keys(touchPointers)) {
    if (touchPointers[id] === key) delete touchPointers[id];
  }
  keys[key] = false;
}

function drawTouchControls() {
  if (!touchActive) return;

  // 竖屏且还没强制旋转：给一个"点这里强制横屏"的按钮（QQ/微信里转不过来的情况）
  if (viewportPortrait() && !forcedLandscape) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
    ctx.fillText('请横屏游玩', W / 2, H / 2 - 96);

    const bw = 520, bh = 104;
    const bx = (W - bw) / 2, by = H / 2 - 10;
    ctx.save();
    ctx.shadowColor = 'rgba(90,210,255,0.85)';
    ctx.shadowBlur = 28;
    ctx.fillStyle = 'rgba(90,210,255,0.95)';
    roundRect(bx, by, bw, bh, 18);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    roundRect(bx, by, bw, bh, 18);
    ctx.stroke();

    ctx.fillStyle = '#062033';
    ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
    ctx.fillText('点这里强制横屏', W / 2, by + bh / 2 + 2);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '26px "Segoe UI", Arial, sans-serif';
    ctx.fillText('（点完把手机横过来：顶部朝左）', W / 2, by + bh + 46);
    ctx.restore();
    return;
  }

  const drawing = (gameState === 'playing' && !paused);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (drawing) {
    for (const b of TOUCH_KEYS) {
      const on = !!keys[b.key];
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = on ? 'rgba(120,215,255,0.55)' : 'rgba(10,25,45,0.42)';
      ctx.fill();
      ctx.strokeStyle = on ? 'rgba(200,245,255,0.95)' : 'rgba(150,215,255,0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = on ? '#ffffff' : 'rgba(215,240,255,0.9)';
      ctx.font = 'bold ' + Math.round(b.r * 0.62) + 'px "Segoe UI", Arial, sans-serif';
      ctx.fillText(b.label, b.x, b.y + 2);
    }
  }

  for (const t of TOUCH_TAPS) {
    if (gameState !== 'playing') continue;   // 只在游戏里显示暂停/静音小钮
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,25,45,0.42)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,215,255,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(215,240,255,0.9)';
    ctx.font = 'bold ' + Math.round(t.r * 0.5) + 'px "Segoe UI", Arial, sans-serif';
    const label = (t.id === 'mute' && typeof isMuted === 'function' && isMuted()) ? '开声' : t.label;
    ctx.fillText(label, t.x, t.y + 2);
  }

  ctx.restore();
}
