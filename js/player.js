/* =========================================================
   02 玩家
   ========================================================= */

const player = {};

function resetPlayer() {
  Object.assign(player, {
    x: W * 0.25, y: GROUND_Y,
    vx: 0, vy: 0,
    w: 44, h: 72,
    facing: 1,
    onGround: true,
    jumpsUsed: 0,
    crouching: false,
    spinning: false,
    spin: 0,
    hp: 3, maxHp: 3,
    invuln: 0,
    comboIndex: 0,
    shootCd: 0,
    animT: 0,
    animFrame: 0,
    hasBasin: false,
    fireLockFacing: 1,
    isFiring: false
  });
}

function playerHeight() { return player.crouching ? 40 : 72; }

function playerRect() {
  const h = playerHeight();
  return { x: player.x - player.w / 2, y: player.y - h, w: player.w, h };
}

// =========================================================
//  玩家逻辑
// =========================================================
const SHOT_WORDS = ['Let', 'me', 'go！'];

function playerUpdate() {
  const p = player;

  while (actionQueue.length > 0) {
    const a = actionQueue.shift();
    if (gameState !== 'playing') continue;
    if (a === 'jump') tryJump();
  }

  p.crouching = p.onGround && !!keys['KeyS'];

  let dir = 0;
  if (keys['KeyA']) dir -= 1;
  if (keys['KeyD']) dir += 1;

  if (dir !== 0 && !p.crouching) {
    p.vx += dir * (p.onGround ? 0.8 : 0.5);
    p.facing = dir;
  } else if (p.crouching && p.onGround) {
    p.vx = 0;
  } else {
    let friction;
    if (p.onGround)                friction = 0.75;
    else                            friction = 0.93;
    p.vx *= friction;
    if (Math.abs(p.vx) < 0.08) p.vx = 0;
  }

  const maxSpeed = 4.5;
  if (p.vx >  maxSpeed) p.vx =  maxSpeed;
  if (p.vx < -maxSpeed) p.vx = -maxSpeed;

  p.vy += GRAVITY;
  if (p.vy > MAX_FALL) p.vy = MAX_FALL;
  p.x += p.vx;
  p.y += p.vy;

  const hw = p.w / 2;
  if (p.x < hw)     { p.x = hw;     if (p.vx < 0) p.vx = 0; }
  if (p.x > W - hw) { p.x = W - hw; if (p.vx > 0) p.vx = 0; }

  if (p.y >= GROUND_Y) {
    if (!p.onGround) {
      p.spinning = false;
      p.spin = 0;
      spawnDust(p.x, GROUND_Y, 6);
    }
    p.y = GROUND_Y;
    p.vy = 0;
    p.onGround = true;
    p.jumpsUsed = 0;
  } else {
    p.onGround = false;
  }

  if (p.spinning) {
    p.spin += 0.26 * p.facing;
    if (Math.abs(p.spin) >= Math.PI * 2) {
      p.spin = 0;
      p.spinning = false;
    }
  }

  if (p.invuln  > 0) p.invuln--;
  if (p.shootCd > 0) p.shootCd--;

  // ---- 移动动画（由 鲸鱼娘移动.mp4 抽帧而来，47 帧 @30fps）----
  // 帧序列已经按内容中心逐帧对齐，所以这里只推进播放；站定时停在当前帧，不做归零跳变
  const frameCount = assets.playerMove.length;
  if (frameCount > 0 && (Math.abs(p.vx) > 0.35 || !p.onGround)) {
    p.animT += 0.5 + Math.min(0.5, Math.abs(p.vx) * 0.12);
    p.animFrame = Math.floor(p.animT) % frameCount;
  }

  if (keys['KeyJ']) {
    if (!p.isFiring) {
      p.isFiring = true;
      p.fireLockFacing = p.facing;
    }
    if (p.shootCd <= 0 && gameState === 'playing') {
      fireShot();
      p.shootCd = 16;
    }
  } else {
    p.isFiring = false;
  }
}

function tryJump() {
  const p = player;
  if (p.jumpsUsed >= 2) return;

  if (p.jumpsUsed === 0) {
    p.vy = -15.5;
    p.onGround = false;
    p.jumpsUsed = 1;
    spawnDust(p.x, GROUND_Y, 6);
    playSfx('jump');
  } else {
    p.vy = -13.5;
    p.jumpsUsed = 2;
    p.spinning = true;
    p.spin = 0;
    spawnBurst(p.x, p.y - 36, '#9fe8ff', 8);
    playSfx('jump2');
  }
  p.crouching = false;
}

function fireShot() {
  const p = player;
  const originY = p.y - playerHeight() * 0.8;

  const dirX = p.isFiring ? p.fireLockFacing : p.facing;

  const idx = p.comboIndex;
  p.comboIndex = (idx + 1) % 4;

  const spd = 13;
  const sx = p.x + dirX * 30;
  const sy = originY;

  if (idx < 3) {
    projectiles.push({
      x: sx, y: sy,
      vx: dirX * spd, vy: 0,
      r: 12, dmg: 6,
      from: 'player', kind: 'text',
      text: SHOT_WORDS[idx],
      life: 150
    });
    playSfx('shoot' + (idx + 1));
  } else {
    projectiles.push({
      x: sx, y: sy,
      vx: dirX * spd, vy: 0,
      r: 16, dmg: 18,
      from: 'player', kind: 'orb',
      life: 150
    });
    spawnBurst(sx, sy, '#ffd54f', 10);
    shake = Math.max(shake, 4);
    playSfx('shootOrb');
  }
}