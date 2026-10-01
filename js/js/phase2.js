/* =========================================================
   04 藤壶头 · 阶段转换 + 二阶段
   ========================================================= */

function startBarnacleHeadTransition() {
  suitBarnacle.phase = 'transition';
  suitBarnacle.transitionTimer = 0;
  fallingBarnacles.length = 0;
  barnacleMonsters.length = 0;
  smashingBarnacles.length = 0;

  // 藤壶头等到"爆炸"那一刻才炸出来（见 barnacleHeadTransitionUpdate）
  barnacleHead = null;
  shake = Math.max(shake, 8);
}

// 一阶段谢幕（3 秒）：西装抖动 -> 爆炸 + 藤壶头脱离 -> 沉入海中
function barnacleHeadTransitionUpdate() {
  const b = suitBarnacle;
  b.transitionTimer++;
  const t = b.transitionTimer;
  const wp = suitBarnacleWeakPoint();

  if (t < SUIT_SHAKE_FRAMES) {
    shake = Math.max(shake, 3);
    if (t % 6 === 0) {
      spawnBurst(wp.x + (Math.random() - 0.5) * 300,
                 wp.y + (Math.random() - 0.5) * 180, '#ff8a5c', 4);
    }
    return;
  }

  if (t === SUIT_SHAKE_FRAMES) {
    // 爆炸
    spawnBurst(wp.x, wp.y, '#ffd54f', 40);
    spawnBurst(wp.x, wp.y, '#ff5c5c', 30);
    for (let i = 0; i < 12; i++) {
      spawnBurst(wp.x + (Math.random() - 0.5) * 340,
                 wp.y + (Math.random() - 0.5) * 220, '#ffffff', 6);
    }
    shake = Math.max(shake, 26);
    playSfx('explode');

    barnacleHead = {
      x: wp.x, y: wp.y, r: 40,
      hp: 1200, maxHp: 1200,
      vx: 0, vy: 0,
      state: 'falling',
      timer: 0,
      attackCd: 0,
      hitCooldown: 0,
      facing: 1,
      rotation: 0,
      bounces: 0,
      chargeTimer: 0,
      sizeScale: 1,
      gravity: 0,
      rangedBurstLeft: 0,
      lastWasRanged: false,
      rangedShotIndex: 0,
      deathT: 0
    };
  }

  // 沉海
  const sinkFrames = Math.max(1, DEATH_FRAMES - SUIT_SHAKE_FRAMES);
  if (b.bodyOffsetY < H * 1.2) {
    b.bodyOffsetY += (H * 1.2) / sinkFrames;
  }

  if (barnacleHead && barnacleHead.state === 'falling') {
    barnacleHead.vy += 0.8;
    barnacleHead.y += barnacleHead.vy;

    if (barnacleHead.y >= GROUND_Y - barnacleHead.r) {
      barnacleHead.y = GROUND_Y - barnacleHead.r;
      barnacleHead.vy = 0;
      barnacleHead.state = 'idle';
      barnacleHead.attackCd = 90;
      spawnBurst(barnacleHead.x, barnacleHead.y, '#ffd54f', 22);
      shake = Math.max(shake, 8);
    }
  }

  if (t >= DEATH_FRAMES) {
    suitBarnacle.phase = 2;
  }
}

// 二阶段谢幕（3 秒）：藤壶剧烈抖动 -> 压扁 -> 展示胜利 CG
function barnacleHeadDyingUpdate() {
  const c = barnacleHead;
  if (!c) { gameState = 'win'; return; }

  c.deathT = (c.deathT || 0) + 1;
  const t = c.deathT;

  if (t < HEAD_SHAKE_FRAMES) {
    shake = Math.max(shake, 4);
    if (t % 5 === 0) {
      spawnBurst(c.x + (Math.random() - 0.5) * c.r * 2,
                 c.y + (Math.random() - 0.5) * c.r * 2, '#9fd0ff', 4);
    }
  } else if (t === HEAD_SHAKE_FRAMES) {
    spawnBurst(c.x, c.y, '#ffffff', 46);
    spawnBurst(c.x, c.y, '#8fe8ff', 30);
    shake = Math.max(shake, 26);
    playSfx('squash');
  } else if (t > HEAD_SHAKE_FRAMES + HEAD_SQUASH_FRAMES && t % 8 === 0) {
    spawnBurst(c.x + (Math.random() - 0.5) * 160, GROUND_Y - 6, '#8fe8ff', 5);
  }

  if (t >= DEATH_FRAMES) {
    gameState = 'win';
    shake = Math.max(shake, 14);
    onGameOver(true);
  }
}

function pickAttackType() {
  if (lastAttackType === 'charging' && secondLastAttackType === 'charging') {
    secondLastAttackType = lastAttackType;
    lastAttackType = 'rolling';
    return 'rolling';
  }
  if (lastAttackType === 'rolling' && secondLastAttackType === 'rolling') {
    secondLastAttackType = lastAttackType;
    lastAttackType = 'charging';
    return 'charging';
  }
  const choice = Math.random() < 0.55 ? 'rolling' : 'charging';
  secondLastAttackType = lastAttackType;
  lastAttackType = choice;
  return choice;
}


function barnacleHeadUpdate() {
  if (!barnacleHead) return;
  const c = barnacleHead;
  c.timer++;

  if (suitBarnacle.bodyOffsetY < H * 1.2) {
    suitBarnacle.bodyOffsetY += 7;
  }

  if (c.hitCooldown > 0) c.hitCooldown--;

  let targetScale = 1;
  if (c.state === 'charging' || c.state === 'dashing') {
    targetScale = DASH_SCALE;
  }
  c.sizeScale += (targetScale - c.sizeScale) * 0.08;

  if (c.state === 'idle') {
    c.rotation += 0.02;
    c.attackCd--;
    if (c.attackCd <= 0) {
      if (c.rangedBurstLeft > 0) {
        // ---- 连发中：射一轮，间隔很短 ----
        c.rangedBurstLeft--;
        barnacleHeadRangedAttack();
        if (c.rangedBurstLeft > 0) {
          c.attackCd = BARNACLE_HEAD_BURST_INTERVAL;
        } else {
          // 连发结束 → 4 秒冷却（240 帧），并标记"上一次是红球"
          c.attackCd = 240;
          c.lastWasRanged = true;
        }

      } else if (!c.lastWasRanged && Math.random() < 0.55) {
        // ---- 开始新一轮红球连发 ----
        c.rangedBurstLeft = 5 + Math.floor(Math.random() * 3);
        c.rangedBurstLeft--;
        barnacleHeadRangedAttack();
        if (c.rangedBurstLeft > 0) {
          c.attackCd = BARNACLE_HEAD_BURST_INTERVAL;
        } else {
          c.attackCd = 240;
          c.lastWasRanged = true;
        }

      } else {
        // ---- 近战（翻滚 / 冲撞） ----
        startBarnacleHeadAttack();
        c.lastWasRanged = false;
      }
    }

  } else if (c.state === 'rolling') {
    c.x += c.vx;
    c.rotation += c.vx * 0.06;

    if (c.x - c.r <= 0) {
      c.x = c.r;
      c.vx = 0;
      c.state = 'idle';
      c.attackCd = 45;
      spawnBurst(c.x, c.y, '#ffd54f', 8);
    } else if (c.x + c.r >= W) {
      c.x = W - c.r;
      c.vx = 0;
      c.state = 'idle';
      c.attackCd = 45;
      spawnBurst(c.x, c.y, '#ffd54f', 8);
    }

  } else if (c.state === 'charging') {
    c.chargeTimer--;

    const vr = c.r * c.sizeScale;
    const targetY = GROUND_Y - vr;
    c.y += (targetY - c.y) * 0.15;

    c.dashTargetX = player.x;

    if (c.chargeTimer % 4 === 0) {
      spawnBurst(
        c.x + (Math.random() - 0.5) * 40,
        c.y + (Math.random() - 0.5) * 40,
        '#ff3030', 3
      );
    }

    if (c.chargeTimer <= 0) {
      c.state = 'dashing';
      const dx = c.dashTargetX - c.x;
      c.vx = dx / DASH_FLIGHT_FRAMES;
      c.vy = DASH_VY0;
      c.gravity = DASH_GRAVITY;
      c.facing = Math.sign(c.vx) || 1;
      c.bounces = 0;
      spawnBurst(c.x, c.y, '#ff5252', 18);
      shake = Math.max(shake, 10);
    }

  } else if (c.state === 'dashing') {
    c.vy += c.gravity;
    c.x += c.vx;
    c.y += c.vy;
    c.rotation += c.vx * 0.05;

    const ballR = c.r * c.sizeScale;
    const floorY = GROUND_Y - ballR;

    let hitEdge = false;
    if (c.x - ballR < 0) {
      c.x = ballR;
      hitEdge = true;
    } else if (c.x + ballR > W) {
      c.x = W - ballR;
      hitEdge = true;
    }
    if (c.y - ballR < 0) {
      c.y = ballR;
      hitEdge = true;
    }
    if (c.y > floorY) {
      c.y = floorY;
      hitEdge = true;
    }

    if (hitEdge) {
      c.vx = 0;
      c.vy = 0;
      c.state = 'returning';
      spawnBurst(c.x, c.y, '#ff5252', 8);
      shake = Math.max(shake, 4);
    }

  } else if (c.state === 'returning') {
    c.vy += GRAVITY * 0.7;
    c.y += c.vy;
    c.vx = 0;

    const ballR = c.r * c.sizeScale;

    if (c.y >= GROUND_Y - ballR) {
      c.y = GROUND_Y - ballR;
      c.vy = 0;
      c.state = 'idle';
      c.attackCd = 60;
      spawnBarnacleMonster(c.x);
    }
  }

  checkBarnacleHeadHit(c);
}

function spawnBarnacleMonster(x) {
  if (barnacleMonsters.length >= 4) return;
  const gx = Math.max(30, Math.min(W - 30, x + (Math.random() - 0.5) * 160));
  barnacleMonsters.push({
    x: gx,
    y: GROUND_Y - 18,
    r: 18,
    hp: 10, maxHp: 10,
    speed: 2.1,
    vx: 0, vy: 0,
    hitCd: 0,
    rotation: 0,
    variant: Math.floor(Math.random() * 3)
  });
  spawnBurst(gx, GROUND_Y - 18, '#7dff8a', 10);
}

function startBarnacleHeadAttack() {
  const c = barnacleHead;
  const dx = player.x - c.x;
  c.facing = Math.sign(dx) || 1;
  c.timer = 0;

  const type = pickAttackType();

  if (type === 'rolling') {
    c.state = 'rolling';
    c.y = GROUND_Y - c.r * c.sizeScale;
    c.vx = c.facing * 15;
    spawnBurst(c.x, c.y, '#ffd54f', 10);
  } else {
    c.state = 'charging';
    c.chargeTimer = CHARGE_FRAMES;
    c.dashTargetX = player.x;
    spawnBurst(c.x, c.y, '#ff3030', 14);
  }
}

function barnacleHeadRangedAttack() {
  const c = barnacleHead;
  const dir = c.x < W / 2 ? 1 : -1;
  const spd = BARNACLE_BULLET_SPEED;

  // 每两次释放，第 2、4、6… 次必含高度 4（index 3）
  const forceLowest = (c.rangedShotIndex % 2 === 1);
  c.rangedShotIndex++;

  let chosen;
  let guard = 0;
  do {
    const count = 2 + Math.floor(Math.random() * 2);  // 2~3 个
    const pool = [0, 1, 2, 3];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    chosen = pool.slice(0, count);
    guard++;

    // 禁止同时出现 1、2、4 层（index 0、1、3）
    const banned = chosen.includes(0) && chosen.includes(1) && chosen.includes(3);
    const okForce = !forceLowest || chosen.includes(3);

    if (!banned && okForce) break;
  } while (guard < 100);

  // 兜底：先保证 forceLowest 含第 4 层
  if (forceLowest && !chosen.includes(3)) {
    chosen[chosen.length - 1] = 3;
  }

  // 兜底：再消除 1、2、4 同时出现（把第 1 层换成第 3 层）
  if (chosen.includes(0) && chosen.includes(1) && chosen.includes(3)) {
    chosen[chosen.indexOf(0)] = 2;
  }

  for (const idx of chosen) {
    projectiles.push({
      x: c.x,
      y: BARNACLE_HEAD_HEIGHTS[idx],
      vx: dir * spd, vy: 0,
      r: 14, dmg: 12,
      from: 'barnacleBullet',
      life: 400
    });
  }

  spawnBurst(c.x, c.y, '#ff5252', 12);
  shake = Math.max(shake, 5);
}

function checkBarnacleHeadHit(c) {
  if (c.hitCooldown > 0) return;
  if (player.invuln > 0) return;

  const pr = playerRect();
  const ballR = c.r * c.sizeScale * 0.9;
  if (circleRectHit(c.x, c.y, ballR, pr)) {
    c.hitCooldown = 40;
    damagePlayer(1);
    spawnBurst(c.x, c.y, '#ff5252', 12);
  }
}