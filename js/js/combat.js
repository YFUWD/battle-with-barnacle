/* =========================================================
   05 判定 / 伤害 / 子弹 / 粒子
   ========================================================= */

function circleRectHit(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function projectileUpdate() {
  const pr = playerRect();

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const pj = projectiles[i];
    pj.x += pj.vx;
    pj.y += pj.vy;
    pj.life--;

    if (pj.from === 'barnacleBullet') {
      if (player.invuln <= 0 && circleRectHit(pj.x, pj.y, pj.r, pr)) {
        damagePlayer(1);
        spawnBurst(pj.x, pj.y, '#ff5252', 10);
        projectiles.splice(i, 1);
        continue;
      }
    } else {
      if (suitBarnacle.phase === 1) {
        const wp = suitBarnacleWeakPoint();
        if (suitBarnacle.hp > 0 && Math.hypot(pj.x - wp.x, pj.y - wp.y) <= pj.r + wp.r) {
          damageSuitBarnacle(pj.dmg);
          spawnBurst(pj.x, pj.y,
            pj.kind === 'orb' ? '#ffd54f' : '#ffffff',
            pj.kind === 'orb' ? 14 : 7);
          if (pj.kind === 'orb') shake = Math.max(shake, 6);
          playSfx('hitWeak');
          projectiles.splice(i, 1);
          continue;
        }
      }

      let hitBlock = false;
      for (let k = smashingBarnacles.length - 1; k >= 0; k--) {
        const b = smashingBarnacles[k];
        const br = { x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h };
        if (circleRectHit(pj.x, pj.y, pj.r, br)) {
          damageSuitBarnacle(pj.dmg);
          spawnBurst(pj.x, pj.y, '#ffd54f', 12);
          playSfx('hitBlock');
          hitBlock = true;
          break;
        }
      }
      if (hitBlock) {
        projectiles.splice(i, 1);
        continue;
      }

      if (barnacleHead && suitBarnacle.phase === 2) {
        const ballR = barnacleHead.r * barnacleHead.sizeScale;
        if (Math.hypot(pj.x - barnacleHead.x, pj.y - barnacleHead.y) <= pj.r + ballR) {
          damageBarnacleHead(pj.dmg);
          spawnBurst(pj.x, pj.y,
            pj.kind === 'orb' ? '#ffd54f' : '#ffffff',
            pj.kind === 'orb' ? 14 : 7);
          if (pj.kind === 'orb') shake = Math.max(shake, 6);
          playSfx('hitHead');
          projectiles.splice(i, 1);
          continue;
        }
      }

      let hitGreen = false;
      for (let k = barnacleMonsters.length - 1; k >= 0; k--) {
        const g = barnacleMonsters[k];
        if (Math.hypot(pj.x - g.x, pj.y - g.y) <= pj.r + g.r) {
          g.hp -= pj.dmg;
          spawnBurst(pj.x, pj.y, '#7dff8a', 8);
          if (g.hp <= 0) {
            spawnBurst(g.x, g.y, '#7dff8a', 14);
            playSfx('monsterDie');
            if (Math.random() < TOKEN_DROP_RATE) spawnToken(g.x, g.y);
            barnacleMonsters.splice(k, 1);
          } else {
            playSfx('hitMonster');
          }
          hitGreen = true;
          break;
        }
      }
      if (hitGreen) {
        projectiles.splice(i, 1);
        continue;
      }
    }

    if (pj.life <= 0 || pj.x < -100 || pj.x > W + 100 ||
        pj.y < -100 || pj.y > H + 100) {
      projectiles.splice(i, 1);
    }
  }
}

function damageSuitBarnacle(dmg) {
  if (suitBarnacle.phase !== 1) return;
  if (suitBarnacle.hp <= 0) return;
  suitBarnacle.hp -= dmg;
  if (suitBarnacle.hp <= 0) {
    suitBarnacle.hp = 0;
    startBarnacleHeadTransition();
  }
}

function damageBarnacleHead(dmg) {
  if (!barnacleHead || suitBarnacle.phase !== 2) return;
  if (barnacleHead.hp <= 0) return;
  barnacleHead.hp -= dmg;
  if (barnacleHead.hp <= 0) {
    barnacleHead.hp = 0;
    // 不直接进 CG：先播 3 秒谢幕（抖动 -> 压扁），结束后 gameState 才变 win
    barnacleHead.deathT = 0;
    suitBarnacle.phase = 'dying';
    shake = Math.max(shake, 12);
  }
}

function damagePlayer(amount) {
  const p = player;
  if (p.invuln > 0 || gameState !== 'playing') return;

  if (p.hasBasin) {
    p.hasBasin = false;
    p.invuln = 70;
    shake = Math.max(shake, 8);
    spawnBurst(p.x, p.y - playerHeight() / 2, '#e8e8e8', 20);
    playSfx('basinBlock');   // 铁盆挡伤害：金属"当"
    return;
  }

  p.hp -= 1;
  p.invuln = 70;
  shake = Math.max(shake, 8);

  if (p.hp <= 0) {
    p.hp = 0;
    gameState = 'lose';
    onGameOver(false);
  } else {
    playSfx('hurt');
  }
}

// =========================================================
//  特效
// =========================================================
function spawnBurst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 1,
      gravity: 0.28,
      life: 20 + Math.random() * 20,
      maxLife: 40,
      size: 2 + Math.random() * 4,
      color
    });
  }
}

function spawnDust(x, y, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y - 2,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 2.5,
      gravity: 0.15,
      life: 18 + Math.random() * 12,
      maxLife: 30,
      size: 3 + Math.random() * 4,
      color: '#d8b878'
    });
  }
}

function effectUpdate() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += pt.gravity;
    pt.vx *= 0.98;
    pt.life--;
    if (pt.life <= 0) particles.splice(i, 1);
  }
  if (shake > 0) shake *= 0.85;
  if (shake < 0.3) shake = 0;
}

// =========================================================
//  Token
// =========================================================
function spawnToken(x, y) {
  tokenList.push({
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 3,
    vy: -5 - Math.random() * 2,
    r: 16,
    state: 'flying',
    life: 600,
    rotation: 0
  });
}

function tokenUpdate() {
  const pr = playerRect();

  for (let i = tokenList.length - 1; i >= 0; i--) {
    const t = tokenList[i];
    t.rotation += 0.06;

    if (t.state === 'flying') {
      t.vy += 0.5;
      t.x += t.vx;
      t.y += t.vy;
      t.vx *= 0.98;

      if (t.y >= GROUND_Y - t.r) {
        t.y = GROUND_Y - t.r;
        t.vy = 0;
        t.vx = 0;
        t.state = 'ground';
      }
    } else if (t.state === 'ground') {
      t.life--;

      const dx = player.x - t.x;
      const dy = (player.y - playerHeight() / 2) - t.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < 140) {
        t.x += (dx / dist) * 4;
        t.y += (dy / dist) * 4;
      }

      if (circleRectHit(t.x, t.y, t.r + 10, pr)) {
        tokensCollected++;
        spawnBurst(t.x, t.y, '#8fe8ff', 14);
        playSfx('token');
        tokenList.splice(i, 1);
        continue;
      }

      if (t.life <= 0) {
        spawnBurst(t.x, t.y, '#8fe8ff', 6);
        tokenList.splice(i, 1);
      }
    }
  }
}

// =========================================================
//  大招：消耗 3 个 Token，全屏伤害 + 清屏
// =========================================================
function unleashUltimate() {
  if (gameState !== 'playing') return;
  if (tokensCollected < 3) return;

  tokensCollected -= 3;
  ultimateFlash = 20;
  shake = Math.max(shake, 22);
  playSfx('ultimate');

  const dmg = 180; // 10 × 强化普攻(18)

  if (suitBarnacle.phase === 1) {
    damageSuitBarnacle(dmg);
  } else if (suitBarnacle.phase === 2) {
    damageBarnacleHead(dmg);
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].from === 'barnacleBullet') {
      spawnBurst(projectiles[i].x, projectiles[i].y, '#ff5252', 6);
      projectiles.splice(i, 1);
    }
  }

  for (let i = barnacleMonsters.length - 1; i >= 0; i--) {
    spawnBurst(barnacleMonsters[i].x, barnacleMonsters[i].y, '#7dff8a', 12);
    // 清屏打死的小怪同样有掉落判定
    if (Math.random() < TOKEN_DROP_RATE) spawnToken(barnacleMonsters[i].x, barnacleMonsters[i].y);
    barnacleMonsters.splice(i, 1);
  }

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    spawnBurst(x, y, '#8fe8ff', 3);
  }
}

// =========================================================
//  GPT + 铁盆
// =========================================================
function gptUpdate() {
  gptCooldown--;
  if (gptCooldown <= 0 && gptList.length === 0) {
    const fromLeft = Math.random() < 0.5;
    const y = 90 + Math.random() * 140;
    gptList.push({
      x: fromLeft ? -140 : W + 140,
      y: y,
      vx: fromLeft ? 2.4 : -2.4,
      w: 110,
      h: 64,
      hasDropped: false,
      dropX: W * (0.2 + Math.random() * 0.6)
    });
    gptCooldown = 2700 + Math.floor(Math.random() * 2700);
  }

  for (let i = gptList.length - 1; i >= 0; i--) {
    const g = gptList[i];
    g.x += g.vx;

    if (!g.hasDropped) {
      const passed = g.vx > 0 ? (g.x >= g.dropX) : (g.x <= g.dropX);
      if (passed) {
        g.hasDropped = true;
        ironBasins.push({
          x: g.dropX,
          y: g.y + g.h / 2 + 10,
          r: 24,
          vy: 0,
          rotation: 0,
          state: 'falling',
          life: 900
        });
      }
    }

    if (g.x < -220 || g.x > W + 220) {
      gptList.splice(i, 1);
    }
  }
}

function ironBasinUpdate() {
  const pr = playerRect();

  for (let i = ironBasins.length - 1; i >= 0; i--) {
    const b = ironBasins[i];

    if (b.state === 'falling') {
      b.vy += 0.55;
      if (b.vy > 14) b.vy = 14;
      b.y += b.vy;
      b.rotation += 0.14;

      if (b.y >= GROUND_Y - b.r) {
        b.y = GROUND_Y - b.r;
        b.vy = 0;
        b.state = 'ground';
        spawnBurst(b.x, GROUND_Y - b.r, '#d8d8d8', 8);
      }
    } else if (b.state === 'ground') {
      b.life--;

      if (!player.hasBasin && circleRectHit(b.x, b.y, b.r + 8, pr)) {
        player.hasBasin = true;
        spawnBurst(b.x, b.y, '#ffffff', 16);
        playSfx('basinPickup');
        ironBasins.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        spawnBurst(b.x, b.y, '#888888', 6);
        ironBasins.splice(i, 1);
      }
    }
  }
}

// =========================================================
//  gpt + 铁盆
// =========================================================
function gptupdate() {
  gptcooldown--;
  if (gptcooldown <= 0 && gptlist.length === 0) {
    const fromleft = math.random() < 0.5;
    const y = 90 + math.random() * 140;
    gptlist.push({
      x: fromleft ? -140 : w + 140,
      y: y,
      vx: fromleft ? 2.4 : -2.4,
      w: 110,
      h: 64,
      hasdropped: false,
      dropx: w * (0.2 + math.random() * 0.6)
    });
    gptcooldown = 2700 + math.floor(math.random() * 2700);
  }

  for (let i = gptlist.length - 1; i >= 0; i--) {
    const g = gptlist[i];
    g.x += g.vx;

    if (!g.hasdropped) {
      const passed = g.vx > 0 ? (g.x >= g.dropx) : (g.x <= g.dropx);
      if (passed) {
        g.hasdropped = true;
        ironbasins.push({
          x: g.dropx,
          y: g.y + g.h / 2 + 10,
          r: 24,
          vy: 0,
          rotation: 0,
          state: 'falling',
          life: 900
        });
      }
    }

    if (g.x < -220 || g.x > w + 220) {
      gptlist.splice(i, 1);
    }
  }
}

function ironbasinupdate() {
  const pr = playerrect();

  for (let i = ironbasins.length - 1; i >= 0; i--) {
    const b = ironbasins[i];

    if (b.state === 'falling') {
      b.vy += 0.55;
      if (b.vy > 14) b.vy = 14;
      b.y += b.vy;
      b.rotation += 0.14;

      if (b.y >= ground_y - b.r) {
        b.y = ground_y - b.r;
        b.vy = 0;
        b.state = 'ground';
        spawnburst(b.x, ground_y - b.r, '#d8d8d8', 8);
      }
    } else if (b.state === 'ground') {
      b.life--;

      if (!player.hasbasin && circlerecthit(b.x, b.y, b.r + 8, pr)) {
        player.hasbasin = true;
        spawnburst(b.x, b.y, '#ffffff', 16);
        ironbasins.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        spawnburst(b.x, b.y, '#888888', 6);
        ironbasins.splice(i, 1);
      }
    }
  }
}