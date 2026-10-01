/* =========================================================
   03 西装藤壶 · 一阶段：下落藤壶 + 砸藤壶
   ========================================================= */

const suitBarnacle = {};

function resetSuitBarnacle() {
  Object.assign(suitBarnacle, {
    phase: 1,
    hp: 1200, maxHp: 1200,
    t: 0,
    attackCd: 320,
    blockCd: SMASHING_BARNACLE_INITIAL_DELAY,
    bodyOffsetY: 0,
    transitionTimer: 0,
    barnacleMonsterBudget: 0
  });
}

function suitBarnacleWeakPoint() {
  return {
    x: SUIT_BARNACLE_HEAD_X,
    Y: SUIT_BARNACLE_HEAD_Y,
    r: SUIT_BARNACLE_WEAK_R
  };
}

// =========================================================
//  一阶段：下落藤壶 + 砸藤壶
// =========================================================
function suitBarnacleWeakPoint() {
  return {
    x: SUIT_BARNACLE_HEAD_X,
    y: SUIT_BARNACLE_HEAD_Y,
    r: SUIT_BARNACLE_WEAK_R
  };
}

function checkSpacing(slots) {
  for (let i = 0; i + 5 <= FALLING_BARNACLE_SLOT_COUNT; i++) {
    let allRed = true;
    for (let j = i; j < i + 5; j++) {
      if (!slots.has(j)) { allRed = false; break; }
    }
    if (allRed) return false;
  }
  return true;
}

function generateFallingBarnacleSlots(n) {
  const playerSlot = Math.max(
    0,
    Math.min(
      FALLING_BARNACLE_SLOT_COUNT - 1,
      Math.floor(player.x / FALLING_BARNACLE_SLOT_W)
    )
  );

  for (let attempt = 0; attempt < 300; attempt++) {
    const slots = new Set();
    slots.add(playerSlot);

    const others = [];
    for (let i = 0; i < FALLING_BARNACLE_SLOT_COUNT; i++) {
      if (i !== playerSlot) others.push(i);
    }
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    for (let i = 0; i < n - 1; i++) {
      slots.add(others[i]);
    }

    if (checkSpacing(slots)) return slots;
  }

  const slots = new Set();
  slots.add(playerSlot);
  const step = Math.max(1, Math.floor(FALLING_BARNACLE_SLOT_COUNT / n));
  let idx = playerSlot;
  while (slots.size < n) {
    idx = (idx + step) % FALLING_BARNACLE_SLOT_COUNT;
    if (idx !== playerSlot) slots.add(idx);
  }
  return slots;
}

function suitBarnacleUpdate() {
  const b = suitBarnacle;
  b.t++;
  if (b.hp <= 0) return;

  const blockActive = smashingBarnacles.some(bl => bl.state !== 'landed');

  b.attackCd--;
  if (b.attackCd <= 0) {
    if (blockActive) {
      b.attackCd = 30;
    } else {
      suitBarnacleAttack();
      const rage = 1 - b.hp / b.maxHp;
      b.attackCd = Math.round(330 - 120 * rage);
    }
  }

  b.blockCd--;
  if (b.blockCd <= 0) {
    if (blockActive || fallingBarnacles.length > 0) {
      b.blockCd = 40;
    } else {
      smashingBarnacleAttack();
      const rage = 1 - b.hp / b.maxHp;
      b.blockCd = Math.round(420 - 120 * rage);
    }
  }
}

function suitBarnacleAttack() {
  if (fallingBarnacles.length > 0) return;
  if (suitBarnacle.phase !== 1) return;

  const wp = suitBarnacleWeakPoint();
  const n = 6 + Math.floor(Math.random() * 3);
  const slots = generateFallingBarnacleSlots(n);

  suitBarnacle.barnacleMonsterBudget = 1 + Math.floor(Math.random() * 2);

  for (const slot of slots) {
    const targetX = (slot + 0.5) * FALLING_BARNACLE_SLOT_W;
    fallingBarnacles.push({
      x: wp.x, y: wp.y,
      targetX,
      r: FALLING_BARNACLE_R,
      phase: 'rising',
      vy: 0,
      vx: 0,
      waitTimer: 0,
      fallVy: 0
    });
  }

  spawnBurst(wp.x, wp.y, '#ff5252', 16);
  shake = Math.max(shake, 6);
}

function smashingBarnacleAttack() {
  if (suitBarnacle.phase !== 1) return;

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < SMASHING_BARNACLE_POSITIONS.length; i++) {
    const d = Math.abs(SMASHING_BARNACLE_POSITIONS[i] - player.x);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  const targetX = SMASHING_BARNACLE_POSITIONS[bestIdx];

  smashingBarnacles.push({
    x: targetX,
    y: -SMASHING_BARNACLE_H / 2 - 20,
    w: SMASHING_BARNACLE_W,
    h: SMASHING_BARNACLE_H,
    state: 'emerging',
    targetX: targetX,
    hoverY: SMASHING_BARNACLE_HOVER_Y,
    vy: 0,
    timer: 0,
    hasHitPlayer: false,
    variant: Math.floor(Math.random() * 2)   // 两只藤壶贴图随机
  });
}

function updateSmashingBarnacles() {
  const pr = playerRect();

  for (let i = smashingBarnacles.length - 1; i >= 0; i--) {
    const b = smashingBarnacles[i];

    if (b.state === 'emerging') {
      const dy = b.hoverY - b.y;
      if (dy > 6) {
        b.y += 4;
      } else {
        b.y = b.hoverY;
        b.state = 'hovering';
        b.timer = 0;
      }

    } else if (b.state === 'hovering') {
      b.timer++;
      if (b.timer === 1) playSfx('smashWarn');
      if (b.timer >= SMASHING_BARNACLE_HOVER_TIME) {
        b.state = 'falling';
        b.vy = SMASHING_BARNACLE_FALL_VY0;
      }

    } else if (b.state === 'falling') {
      b.vy += SMASHING_BARNACLE_FALL_GRAVITY;
      b.y += b.vy;

      if (!b.hasHitPlayer && player.invuln <= 0) {
        const br = { x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h };
        if (rectsOverlap(pr, br)) {
          damagePlayer(1);
          b.hasHitPlayer = true;
        }
      }

      if (b.y + b.h / 2 >= GROUND_Y) {
        b.y = GROUND_Y - b.h / 2;
        b.state = 'landed';
        b.timer = 0;
        shake = Math.max(shake, 12);
        spawnBurst(b.x, GROUND_Y, '#ff5252', 26);
        playSfx('smashLand');
      }

    } else if (b.state === 'landed') {
      b.timer++;
      if (b.timer >= SMASHING_BARNACLE_LIFE) {
        spawnBurst(b.x, b.y, '#ff5252', 10);
        smashingBarnacles.splice(i, 1);
      }
    }
  }
}

function fallingBarnacleUpdate() {
  const pr = playerRect();

  for (let i = fallingBarnacles.length - 1; i >= 0; i--) {
    const o = fallingBarnacles[i];

    if (o.phase === 'rising') {
      o.vx = (o.targetX - o.x) * 0.09;
      o.x += o.vx;

      // 恒定上升速度：保证从 Boss 弱点出发后一定能飞到屏幕顶端
      o.y -= 16;

      if (o.y < -o.r) {
        o.y = -o.r;
        o.x = o.targetX;
        o.phase = 'waiting';
        o.waitTimer = 70;
      }

    } else if (o.phase === 'waiting') {
      o.waitTimer--;
      if (o.waitTimer <= 0) {
        o.phase = 'falling';
        o.y = -o.r;
        o.fallVy = 6;
      }

    } else if (o.phase === 'falling') {
      o.fallVy += 1.2;
      o.y += o.fallVy;

      if (player.invuln <= 0 && circleRectHit(o.x, o.y, o.r * 0.85, pr)) {
        damagePlayer(1);
        spawnBurst(o.x, o.y, '#ff5252', 14);
        fallingBarnacles.splice(i, 1);
        continue;
      }

      if (o.y > GROUND_Y + o.r) {
        spawnBurst(o.x, GROUND_Y, '#ff5252', 10);
        shake = Math.max(shake, 5);
        playSfx('fallLand');

        if (suitBarnacle.barnacleMonsterBudget > 0 && barnacleMonsters.length < 5) {
          suitBarnacle.barnacleMonsterBudget--;
          barnacleMonsters.push({
            x: o.targetX + (Math.random() - 0.5) * 20,
            y: GROUND_Y - 18,
            r: 18,
            hp: 10, maxHp: 10,
            speed: 2.1,
            vx: 0, vy: 0,
            hitCd: 0,
            rotation: 0,
            variant: Math.floor(Math.random() * 3)
          });
          spawnBurst(o.targetX, GROUND_Y - 18, '#7dff8a', 8);
        }

        fallingBarnacles.splice(i, 1);
        continue;
      }
    }
  }
}

function barnacleMonsterUpdate() {
  const pr = playerRect();

  for (let i = barnacleMonsters.length - 1; i >= 0; i--) {
    const g = barnacleMonsters[i];

    // 只在地面横向追人：竖直方向锁死，不会跟着玩家跳上天
    const dx = player.x - g.x;
    if (Math.abs(dx) > 1) g.x += Math.sign(dx) * g.speed;
    g.y = GROUND_Y - g.r;

    if (g.x < g.r) g.x = g.r;
    if (g.x > W - g.r) g.x = W - g.r;

    g.rotation += 0.03;

    if (g.hitCd > 0) g.hitCd--;

    if (g.hitCd <= 0 && player.invuln <= 0 && circleRectHit(g.x, g.y, g.r, pr)) {
      damagePlayer(1);
      spawnBurst(g.x, g.y, '#7dff8a', 8);
      g.hitCd = 40;
    }
  }
}