/* =========================================================
   06 绘制
   ========================================================= */

function roundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function drawStar(cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// =========================================================
//  天空 / 大海 / 沙滩
// =========================================================
function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0,    '#1e4a8a');
  g.addColorStop(0.25, '#4a7ec2');
  g.addColorStop(0.45, '#a8cceb');
  g.addColorStop(0.52, '#ffd9a0');
  g.addColorStop(0.56, '#ffb27a');
  g.addColorStop(1,    '#ffb27a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawClouds() {
  for (const c of clouds) {
    ctx.save();
    ctx.globalAlpha = c.alpha * 0.85;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c.x - c.w * 0.28, c.y + 4, c.w * 0.32, c.h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c.x + c.w * 0.28, c.y + 4, c.w * 0.32, c.h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSun() {
  const sx = W * 0.78;
  const sy = SEA_HORIZON_Y - 60;

  ctx.save();
  const g = ctx.createRadialGradient(sx, sy, 10, sx, sy, 140);
  g.addColorStop(0, 'rgba(255,240,180,0.95)');
  g.addColorStop(0.4, 'rgba(255,200,120,0.45)');
  g.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx, sy, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sx, sy, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSea() {
  const g = ctx.createLinearGradient(0, SEA_HORIZON_Y, 0, GROUND_Y);
  g.addColorStop(0,    '#3d85c4');
  g.addColorStop(0.35, '#2a6aa8');
  g.addColorStop(0.75, '#1a4a7e');
  g.addColorStop(1,    '#0f3562');
  ctx.fillStyle = g;
  ctx.fillRect(0, SEA_HORIZON_Y, W, GROUND_Y - SEA_HORIZON_Y);

  ctx.save();
  ctx.globalAlpha = 0.55;
  const sx = W * 0.78;
  const rg = ctx.createLinearGradient(sx, SEA_HORIZON_Y, sx, GROUND_Y);
  rg.addColorStop(0,   'rgba(255,220,140,0.85)');
  rg.addColorStop(0.5, 'rgba(255,200,120,0.25)');
  rg.addColorStop(1,   'rgba(255,200,120,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(sx - 90, SEA_HORIZON_Y, 180, GROUND_Y - SEA_HORIZON_Y);
  ctx.restore();
}

function drawSeaOverlay() {
  const g = ctx.createLinearGradient(0, SEA_HORIZON_Y, 0, GROUND_Y);
  g.addColorStop(0,   'rgba(45,105,165,0.35)');
  g.addColorStop(0.5, 'rgba(30,80,130,0.55)');
  g.addColorStop(1,   'rgba(15,50,90,0.78)');
  ctx.fillStyle = g;
  ctx.fillRect(0, SEA_HORIZON_Y, W, GROUND_Y - SEA_HORIZON_Y);
}

function drawSeaWaves() {
  ctx.save();
  const t = globalTime * 0.02;
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const frac = i / 6;
    const baseY = SEA_HORIZON_Y + 16 + frac * (GROUND_Y - SEA_HORIZON_Y - 32);
    const amp   = 3 + frac * 6;
    ctx.globalAlpha = 0.22 + frac * 0.35;
    ctx.strokeStyle = '#dff0ff';
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 14) {
      const yy = baseY + Math.sin(x * 0.018 + t * (0.5 + frac * 0.9) + i) * amp;
      if (x === -20) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawGround() {
  if (hasSprite('ground')) {
    ctx.drawImage(assets.ground, 0, GROUND_Y, W, GROUND_H);
    return;
  }

  const g = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  g.addColorStop(0,    '#e8d29a');
  g.addColorStop(0.25, '#f2daa8');
  g.addColorStop(0.65, '#e8c98c');
  g.addColorStop(1,    '#d0a868');
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND_Y, W, GROUND_H);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, GROUND_Y, W, 4);

  ctx.fillStyle = 'rgba(120,80,40,0.22)';
  ctx.fillRect(0, GROUND_Y + 4, W, GROUND_H * 0.12);

  for (let i = 0; i < 140; i++) {
    const seed1 = (i * 137 + 29) % 997 / 997;
    const seed2 = (i * 89 + 173) % 991 / 991;
    const depth = seed1 * seed1;
    const x = seed2 * W;
    const y = GROUND_Y + 8 + depth * (GROUND_H - 14);
    const size = 1 + depth * 4.5;
    ctx.fillStyle = depth > 0.55
      ? 'rgba(120,80,40,0.42)'
      : 'rgba(150,110,60,0.32)';
    ctx.fillRect(x, y, size, size * 0.7);
  }

  for (let i = 0; i < 24; i++) {
    const depth = ((i * 53 + 7) % 97) / 97;
    const x = ((i * 211 + 89) % 947) / 947 * W;
    const y = GROUND_Y + 20 + depth * (GROUND_H - 28);
    const r = 2 + depth * 5;
    ctx.fillStyle = 'rgba(90,60,30,0.32)';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(160,120,70,0.16)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const yy = GROUND_Y + 12 + i * 14;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(W, yy);
    ctx.stroke();
  }
}

// =========================================================
//  西装藤壶 / 藤壶头
// =========================================================
function drawSuitBarnacle() {
  if (suitBarnacle.phase === 2 && suitBarnacle.bodyOffsetY >= H) return;

  const wp = suitBarnacleWeakPoint();
  const dy = suitBarnacle.bodyOffsetY;

  ctx.save();
  ctx.translate(0, dy);

  // 一阶段谢幕：爆炸前先抖动（之后靠 bodyOffsetY 往下沉进海里）
  if (suitBarnacle.phase === 'transition' && suitBarnacle.transitionTimer < SUIT_SHAKE_FRAMES) {
    const k = 1 - suitBarnacle.transitionTimer / SUIT_SHAKE_FRAMES;
    ctx.translate((Math.random() - 0.5) * 12 * k, (Math.random() - 0.5) * 7 * k);
  }

  if (hasSprite('suitBarnacleBody')) {
    // 西装：按原图比例绘制，底边贴在沙滩上
    const bodyImg = assets.suitBarnacleBody;
    const bw = SUIT_BODY_DRAW_W;
    const bh = bw * (bodyImg.naturalHeight / bodyImg.naturalWidth);
    ctx.drawImage(bodyImg, SUIT_BARNACLE_APEX_X - bw / 2, SUIT_BARNACLE_BASE_Y - bh, bw, bh);
  } else {
    // ---------- 三角形身体（占位） ----------
    const apexX = SUIT_BARNACLE_APEX_X;
    const apexY = SUIT_BARNACLE_APEX_Y;
    const baseL = SUIT_BARNACLE_X;
    const baseR = SUIT_BARNACLE_X + SUIT_BARNACLE_W;
    const baseY = SUIT_BARNACLE_BASE_Y;

    const g = ctx.createLinearGradient(apexX, apexY, apexX, baseY);
    g.addColorStop(0,    '#b24550');
    g.addColorStop(0.45, '#7a2a36');
    g.addColorStop(1,    '#3a1018');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(apexX, apexY);
    ctx.lineTo(baseR, baseY);
    ctx.lineTo(baseL, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#d96b78';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 内部横向纹路
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(apexX, apexY);
    ctx.lineTo(baseR, baseY);
    ctx.lineTo(baseL, baseY);
    ctx.closePath();
    ctx.clip();

    ctx.strokeStyle = 'rgba(255,180,190,0.18)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const y  = apexY + (baseY - apexY) * t;
      const lx = apexX - (apexX - baseL) * t;
      const rx = apexX + (baseR - apexX) * t;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(rx, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 头部：藤壶脑袋，底边压在西装领口上 ----------
  if (hasSprite('suitBarnacleHead')) {
    const headImg = assets.suitBarnacleHead;
    const hh = SUIT_HEAD_DRAW_H;
    const hw = hh * (headImg.naturalWidth / headImg.naturalHeight);
    ctx.drawImage(
      headImg,
      SUIT_BARNACLE_HEAD_X - hw / 2,
      SUIT_HEAD_BOTTOM_Y - hh,
      hw, hh
    );
  } else {
    // ---------- 头部圆圈（占位） ----------
    const hx = SUIT_BARNACLE_HEAD_X;
    const hy = SUIT_BARNACLE_HEAD_Y;
    const hr = SUIT_BARNACLE_HEAD_R;

    // 脖子
    ctx.fillStyle = '#7a2a36';
    ctx.beginPath();
    ctx.moveTo(hx - hr * 0.55, hy + hr * 0.55);
    ctx.lineTo(hx + hr * 0.55, hy + hr * 0.55);
    ctx.lineTo(SUIT_BARNACLE_APEX_X + hr * 0.7, SUIT_BARNACLE_APEX_Y + 14);
    ctx.lineTo(SUIT_BARNACLE_APEX_X - hr * 0.7, SUIT_BARNACLE_APEX_Y + 14);
    ctx.closePath();
    ctx.fill();

    // 圆圈描边 + 金光
    ctx.save();
    ctx.shadowColor = '#ffd54f';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = '#d96b78';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 圆圈内部凹陷
    const hg = ctx.createRadialGradient(hx, hy - hr * 0.3, 4, hx, hy, hr);
    hg.addColorStop(0,   '#5a1e28');
    hg.addColorStop(0.7, '#2a0a12');
    hg.addColorStop(1,   '#14040a');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(hx, hy, hr - 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- 弱点：黄球（真正的判定点，以前只判定不画） ----------
  if (suitBarnacle.phase === 1 && suitBarnacle.hp > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(globalTime * 0.12);

    ctx.save();
    ctx.globalAlpha = 0.22 + 0.22 * pulse;
    ctx.strokeStyle = '#ffe89a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, wp.r * (0.88 + 0.14 * pulse), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#ffd54f';
    ctx.shadowBlur = 22 + 12 * pulse;
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, SUIT_WEAK_DRAW_R * (0.92 + 0.08 * pulse), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawBarnacleHead() {
  if (!barnacleHead) return;
  const c = barnacleHead;
  const vr = c.r * c.sizeScale;

  let shakeX = 0, shakeY = 0;
  if (c.state === 'charging') {
    const intensity = 4 + 5 * (1 - c.chargeTimer / CHARGE_FRAMES);
    shakeX = (Math.random() - 0.5) * intensity;
    shakeY = (Math.random() - 0.5) * intensity;
  }
  // 二阶段谢幕：先剧烈抖动，再被压扁
  const dying = (suitBarnacle.phase === 'dying');
  const deathT = c.deathT || 0;
  if (dying && deathT < HEAD_SHAKE_FRAMES) {
    const k = 1 - deathT / HEAD_SHAKE_FRAMES;
    shakeX = (Math.random() - 0.5) * 16 * k;
    shakeY = (Math.random() - 0.5) * 10 * k;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // 压扁：底边钉在原地，只压上半部分
  if (dying && deathT >= HEAD_SHAKE_FRAMES) {
    const k = Math.max(0, Math.min(1, (deathT - HEAD_SHAKE_FRAMES) / HEAD_SQUASH_FRAMES));
    const squash = 1 - 0.78 * k;
    const widen  = 1 + 0.35 * k;
    ctx.translate(c.x, c.y + vr - vr * squash);
    ctx.scale(widen, squash);
    ctx.translate(-c.x, -c.y);
  }

  const isCharging = c.state === 'charging';

  if (hasSprite('barnacleHead')) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation);
    ctx.drawImage(assets.barnacleHead, -vr, -vr, vr * 2, vr * 2);
    ctx.restore();
    if (isCharging) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#ff2020';
      ctx.beginPath();
      ctx.arc(c.x, c.y, vr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    ctx.save();
    ctx.shadowColor = isCharging ? '#ff1010' : '#ffd54f';
    ctx.shadowBlur = isCharging ? 50 : 24 * c.sizeScale;
    ctx.fillStyle = isCharging ? '#ff2020' : '#ffd54f';
    ctx.beginPath();
    ctx.arc(c.x, c.y, vr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation);

    ctx.fillStyle = isCharging ? '#7a0000' : '#8b5a00';
    ctx.beginPath();
    ctx.arc(0, 0, vr * 0.72, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isCharging ? '#ff8080' : '#ffd54f';
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * vr * 0.42, Math.sin(a) * vr * 0.42, vr * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (isCharging) {
      const t = 1 - c.chargeTimer / CHARGE_FRAMES;
      ctx.save();
      ctx.strokeStyle = '#ff2020';
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(c.x, c.y, vr + 40 * (1 - t), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();

  const bw = 70, bh = 6;
  const bx = c.x - bw / 2;
  const by = c.y - vr - 18;

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = '#2a2f4a';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(bx, by, bw * (c.hp / c.maxHp), bh);
}

function drawPlayer() {
  const p = player;
  const h = playerHeight();

  ctx.save();
  ctx.translate(p.x, p.y - h / 2);

  if (p.invuln > 0 && Math.floor(p.invuln / 4) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }
  if (p.spinning) ctx.rotate(p.spin);

  const moveImg = currentMoveFrame();
  const hatReady = player.hasBasin && basinHatReady();
  const hatW = BASIN_HAT_W;
  const hatH = hatReady ? hatW * (assets.basinHatBack.naturalHeight / assets.basinHatBack.naturalWidth) : 0;

  // 脚底为原点、朝向翻转、蹲下朝脚底压扁 —— 盆和角色共用同一套变换，
  // 这样"盆后半 -> 角色 -> 盆前半"三层才能对齐（脑袋看起来就在盆里）
  ctx.save();
  ctx.translate(0, h / 2);
  ctx.scale(PLAYER_FACE_LEFT ? -p.facing : p.facing, p.crouching ? 0.62 : 1);

  if (hatReady) {
    ctx.drawImage(assets.basinHatBack, -hatW / 2, -BASIN_HAT_BOTTOM - hatH, hatW, hatH);
  }

  if (moveImg) {
    // 移动动画帧：脚底对齐 player.y
    const sh = PLAYER_SPRITE_H;
    const sw = sh * (moveImg.naturalWidth / moveImg.naturalHeight);
    ctx.drawImage(moveImg, -sw / 2, -sh, sw, sh);
  } else if (hasSprite('player')) {
    ctx.drawImage(assets.player, -p.w / 2, -h, p.w, h);
  } else {
    ctx.fillStyle = '#5ad2ff';
    roundRect(-p.w / 2, -h, p.w, h, 10);
    ctx.fill();

    ctx.fillStyle = '#a8ecff';
    ctx.beginPath();
    ctx.arc(0, -h + 8, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0b1020';
    ctx.beginPath();
    ctx.arc(p.facing * 5, -h + 8, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (hatReady) {
    ctx.drawImage(assets.basinHatFront, -hatW / 2, -BASIN_HAT_BOTTOM - hatH, hatW, hatH);
  } else if (player.hasBasin) {
    // 没有倒扣铁盆素材时的旧画法：把满盆翻转过来
    const basinImg = assets.ironBasinFull;
    if (imgReady(basinImg)) {
      const bw = BASIN_HAT_W, bh = bw * (basinImg.naturalHeight / basinImg.naturalWidth);
      ctx.save();
      ctx.translate(0, -h - bh * 0.34);
      ctx.scale(1, -1);
      ctx.drawImage(basinImg, -bw / 2, -bh / 2, bw, bh);
      ctx.restore();
    }
  }

  ctx.restore();

  ctx.restore();
}

function drawSmashingBarnacles() {
  for (const b of smashingBarnacles) {
    const img = smashSprite(b);
    const x = b.x - b.w / 2;
    const y = b.y - b.h / 2;

    let alpha = 1;
    if (b.state === 'emerging') {
      const t = Math.min(1, (b.y + b.h / 2) / (b.hoverY + b.h / 2));
      alpha = 0.35 + 0.65 * t;
    }
    if (b.state === 'landed') {
      alpha = 0.55;
    }

    if (img) {
      // 贴图和碰撞框保持一致：朝向不一致就把贴图转 90°，再等比塞进 b.w x b.h
      const boxAR = b.w / b.h;
      const imgAR = img.naturalWidth / img.naturalHeight;
      const rot = (imgAR < 1) !== (boxAR < 1);
      const effAR = rot ? 1 / imgAR : imgAR;
      let fw, fh;
      if (effAR > boxAR) { fw = b.w; fh = b.w / effAR; }
      else               { fh = b.h; fw = b.h * effAR; }
      const drawW = rot ? fh : fw;
      const drawH = rot ? fw : fh;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(b.x, b.y);
      if (rot) ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.fillStyle = '#7a1a1a';
      ctx.fillRect(x + b.w * 0.3, y, b.w * 0.4, b.h * 0.25);

      ctx.fillStyle = '#c62828';
      roundRect(x, y + b.h * 0.18, b.w, b.h * 0.82, 24);
      ctx.fill();

      ctx.fillStyle = '#8b0000';
      roundRect(x + b.w * 0.1, y + b.h * 0.42, b.w * 0.8, b.h * 0.42, 16);
      ctx.fill();

      ctx.fillStyle = '#ff5252';
      const knuckleR = Math.max(10, b.w * 0.05);
      for (let i = 0; i < 4; i++) {
        const kx = x + b.w * 0.15 + i * b.w * 0.7 / 3;
        ctx.beginPath();
        ctx.arc(kx, y + b.h * 0.42, knuckleR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#ff5252';
      ctx.lineWidth = 4;
      roundRect(x, y + b.h * 0.18, b.w, b.h * 0.82, 24);
      ctx.stroke();

      ctx.restore();
    }

    if (b.state === 'landed') {
      const k = 1 - b.timer / SMASHING_BARNACLE_LIFE;
      if (k > 0) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          x - 6 - 2 * k, y - 6 - 2 * k,
          b.w + 12 + 4 * k, b.h + 12 + 4 * k
        );
        ctx.restore();
      }
    }
  }
}

function drawFallingBarnacles() {
  for (const o of fallingBarnacles) {
    if (o.phase === 'waiting') {
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(globalTime * 0.25));

      ctx.save();
      ctx.globalAlpha = 0.16 + 0.12 * pulse;
      const lg = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      lg.addColorStop(0,   'rgba(255,60,60,0)');
      lg.addColorStop(0.6, 'rgba(255,60,60,0.5)');
      lg.addColorStop(1,   'rgba(255,60,60,0.9)');
      ctx.fillStyle = lg;
      ctx.fillRect(o.targetX - o.r, 0, o.r * 2, GROUND_Y);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(255,80,80,' + (0.5 + 0.4 * pulse) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(o.targetX, GROUND_Y, o.r * (0.9 + 0.15 * pulse), o.r * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (imgReady(assets.fallingBarnacle)) {
      const fImg = assets.fallingBarnacle;
      const bAR = fImg.naturalWidth / fImg.naturalHeight;
      let fw = o.r * 2, fh = fw / bAR;
      if (fh > o.r * 2) { fh = o.r * 2; fw = fh * bAR; }
      ctx.save();
      ctx.shadowColor = '#ff5c5c';
      ctx.shadowBlur = 14;
      ctx.drawImage(fImg, o.x - fw / 2, o.y - fh / 2, fw, fh);
      ctx.restore();
    } else {
      ctx.save();
      ctx.shadowColor = '#ff3b3b';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ff3b3b';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(o.x - o.r * 0.32, o.y - o.r * 0.32, o.r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBarnacleMonsters() {
  for (const g of barnacleMonsters) {
    const mImg = monsterSprite(g);
    if (mImg) {
      // 小藤壶贴图：底边贴地，轻微左右摇摆（比整只打转自然）
      const mh = MONSTER_DRAW_H;
      const mw = mh * (mImg.naturalWidth / mImg.naturalHeight);
      ctx.save();
      ctx.translate(g.x, g.y + g.r - mh / 2);
      ctx.rotate(Math.sin(globalTime * 0.12 + g.x * 0.05) * 0.13);
      ctx.drawImage(mImg, -mw / 2, -mh / 2, mw, mh);
      ctx.restore();
    } else {
      ctx.save();
      ctx.shadowColor = '#7dff8a';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#7dff8a';
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rotation);

      ctx.fillStyle = '#1b6b22';
      ctx.beginPath();
      ctx.arc(0, 0, g.r * 0.62, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7dff8a';
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * g.r * 0.35, Math.sin(a) * g.r * 0.35, g.r * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    const bw = 32, bh = 4;
    const bx = g.x - bw / 2;
    const by = g.y - g.r - 12;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#2a2f4a';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#7dff8a';
    ctx.fillRect(bx, by, bw * (g.hp / g.maxHp), bh);
  }
}

function drawGPT() {
  for (const g of gptList) {
    if (hasSprite('gpt')) {
      // 萌化小人：按飞行方向翻转
      const img = assets.gpt;
      const gh = GPT_DRAW_H;
      const gw = gh * (img.naturalWidth / img.naturalHeight);
      ctx.save();
      ctx.translate(g.x, g.y);
      if (g.vx > 0) ctx.scale(-1, 1);   // 素材朝左
      ctx.drawImage(img, -gw / 2, -gh / 2, gw, gh);
      ctx.restore();
      continue;
    }

    ctx.save();
    ctx.translate(g.x, g.y);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(-g.w / 2, -g.h / 2, g.w, g.h, 16);
    ctx.fill();

    ctx.strokeStyle = '#7aa7ff';
    ctx.lineWidth = 3;
    roundRect(-g.w / 2, -g.h / 2, g.w, g.h, 16);
    ctx.stroke();

    ctx.fillStyle = '#1a3a7a';
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GPT', 0, 0);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.moveTo(-10, g.h / 2);
    ctx.lineTo(10, g.h / 2);
    ctx.lineTo(0, g.h / 2 + 12);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function drawIronBasins() {
  for (const b of ironBasins) {
    ctx.save();
    ctx.translate(b.x, b.y);

    if (b.state === 'falling') {
      ctx.rotate(b.rotation);
    }

    const r = b.r;

    if (imgReady(assets.ironBasinFull)) {
      const basinImg = assets.ironBasinFull;
      const bw = BASIN_ITEM_W;
      const bh = bw * (basinImg.naturalHeight / basinImg.naturalWidth);
      ctx.drawImage(basinImg, -bw / 2, -bh / 2, bw, bh);
    } else {
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#b8b8b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#d0d0d0';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (b.state === 'ground' && !player.hasBasin) {
      const pulse = 0.5 + 0.5 * Math.abs(Math.sin(globalTime * 0.1));
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.35 * pulse;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 6 + 2 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawTokens() {
  for (const t of tokenList) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rotation);

    // Token 硬币：蓝圆 + 中间一个 T（程序绘制，不用素材）
    ctx.save();
    ctx.shadowColor = '#4aa8ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#4aa8ff';
    ctx.beginPath();
    ctx.arc(0, 0, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#8fe8ff';
    ctx.beginPath();
    ctx.arc(0, 0, t.r * 0.82, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a2a4a';
    ctx.font = 'bold ' + Math.round(t.r * 1.3) + 'px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', 0, 1);

    ctx.restore();
  }
}

function drawUltimateFlash() {
  if (ultimateFlash <= 0) return;
  const k = ultimateFlash / 20;

  ctx.save();
  ctx.globalAlpha = k * 0.7;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = k * 0.5;
  ctx.strokeStyle = '#8fe8ff';
  ctx.lineWidth = 8 * k;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, (1 - k) * Math.max(W, H), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 放大版大招图标（深度思考图标）
  if (hasSprite('ultimate')) {
    const d = ULTIMATE_ICON_R * 2 * (0.72 + 0.55 * (1 - k));
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 1.5);
    ctx.shadowColor = '#8fe8ff';
    ctx.shadowBlur = 70;
    ctx.drawImage(assets.ultimate, W / 2 - d / 2, H / 2 - d / 2, d, d);
    ctx.restore();
  }
}

function drawProjectiles() {
  for (const pj of projectiles) {
    if (pj.from === 'barnacleBullet') {
      if (imgReady(assets.barnacleBullet)) {
        const bImg = assets.barnacleBullet;
        const bAR = bImg.naturalWidth / bImg.naturalHeight;
        let bw = pj.r * 2, bh = bw / bAR;
        if (bh > pj.r * 2) { bh = pj.r * 2; bw = bh * bAR; }
        ctx.save();
        ctx.shadowColor = '#ff5c5c';
        ctx.shadowBlur = 10;
        ctx.drawImage(bImg, pj.x - bw / 2, pj.y - bh / 2, bw, bh);
        ctx.restore();
      } else {
        ctx.fillStyle = '#ff5252';
        ctx.beginPath();
        ctx.arc(pj.x, pj.y, pj.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(pj.x - pj.r * 0.3, pj.y - pj.r * 0.3, pj.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (pj.kind === 'orb') {
      if (hasSprite('bulletOrb')) {
        // 强化子弹 = 萌鲸鱼（素材朝左，往右飞时镜像）
        const wImg = assets.bulletOrb;
        const wh = WHALE_BULLET_W * (wImg.naturalHeight / wImg.naturalWidth);
        ctx.save();
        ctx.shadowColor = '#8fe8ff';
        ctx.shadowBlur = 18;
        ctx.translate(pj.x, pj.y);
        if (pj.vx > 0) ctx.scale(-1, 1);
        ctx.drawImage(wImg, -WHALE_BULLET_W / 2, -wh / 2, WHALE_BULLET_W, wh);
        ctx.restore();
      } else {
        const g = ctx.createRadialGradient(pj.x, pj.y, 2, pj.x, pj.y, pj.r * 1.8);
        g.addColorStop(0,   '#fff6c4');
        g.addColorStop(0.5, '#ffd54f');
        g.addColorStop(1,   'rgba(255,213,79,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pj.x, pj.y, pj.r * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pj.x, pj.y, pj.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      if (hasSprite('bulletText')) {
        ctx.drawImage(assets.bulletText, pj.x - pj.r * 2, pj.y - pj.r, pj.r * 4, pj.r * 2);
      } else {
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeText(pj.text, pj.x, pj.y);
        ctx.fillStyle = '#8fe8ff';
        ctx.fillText(pj.text, pj.x, pj.y);
      }
    }
  }
}

function drawEffects() {
  for (const pt of particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
}

function drawCrosshair() {
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mouse.x - 10, mouse.y);
  ctx.lineTo(mouse.x - 3,  mouse.y);
  ctx.moveTo(mouse.x + 3,  mouse.y);
  ctx.lineTo(mouse.x + 10, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - 10);
  ctx.lineTo(mouse.x, mouse.y - 3);
  ctx.moveTo(mouse.x, mouse.y + 3);
  ctx.lineTo(mouse.x, mouse.y + 10);
  ctx.stroke();
}

function drawHpStar(cx, cy, starR, filled) {
  if (filled) {
    ctx.save();
    ctx.shadowColor = '#ffd54f';
    ctx.shadowBlur = 16;
    drawStar(cx, cy, starR, '#ffd54f');
    ctx.restore();
    drawStar(cx, cy, starR * 0.9, '#fff6c4');
    return;
  }

  drawStar(cx, cy, starR, '#1a1a1a');
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.save();
  ctx.beginPath();
  for (let j = 0; j < 10; j++) {
    const angle = -Math.PI / 2 + j * Math.PI / 5;
    const radius = j % 2 === 0 ? starR : starR * 0.45;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (j === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawUI() {
  const bw = W * 0.62, bh = 18;
  const bx = (W - bw) / 2;
  const by = H - 24;

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(bx - 4, by - 4, bw + 8, bh + 8, 6);
  ctx.fill();

  ctx.fillStyle = '#2a2f4a';
  ctx.fillRect(bx, by, bw, bh);

  let ratio = 0;
  if (suitBarnacle.phase === 1) ratio = suitBarnacle.hp / suitBarnacle.maxHp;
  else if (suitBarnacle.phase === 2 && barnacleHead) ratio = barnacleHead.hp / barnacleHead.maxHp;

  ctx.fillStyle = '#ff5c6c';
  ctx.fillRect(bx, by, bw * ratio, bh);

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const label = suitBarnacle.phase === 1
    ? '西装藤壶'
    : (suitBarnacle.phase === 'transition' ? '...' : '藤壶头');
  ctx.fillText(label, W / 2, by - 3);

  const starR = 18;
  const starY = 48;
  const startX = 40;
  const gap = 50;

  if (hasSprite('ironBasinFull') || hasSprite('ironBasinEmpty')) {
    // 生命值 = 铁盆：满盆是还活着的那一格，掉一格就变成空盆
    const baseY = starY + starR + 2;
    for (let i = 0; i < player.maxHp; i++) {
      const cx = startX + i * gap;
      const alive = i < player.hp;
      const img = alive ? assets.ironBasinFull : assets.ironBasinEmpty;
      if (!imgReady(img)) { drawHpStar(cx, starY, starR, alive); continue; }

      const bw = BASIN_HP_W;
      const bh = bw * (img.naturalHeight / img.naturalWidth);
      ctx.save();
      ctx.globalAlpha = alive ? 1 : 0.42;
      if (alive) {
        ctx.shadowColor = '#ffd54f';
        ctx.shadowBlur = 14;
      }
      ctx.drawImage(img, cx - bw / 2, baseY - bh, bw, bh);
      ctx.restore();
    }
  } else {
    for (let i = 0; i < player.maxHp; i++) {
      drawHpStar(startX + i * gap, starY, starR, i < player.hp);
    }
  }

  const next = player.comboIndex < 3 ? SHOT_WORDS[player.comboIndex] : '强化';
  ctx.fillStyle = player.comboIndex < 3 ? '#8fe8ff' : '#ffd54f';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('下一发：' + next, 28, 82);

  let uiY = 106;
  if (player.hasBasin) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('🛡 铁盆（可挡一次伤害）', 28, uiY);
    uiY += 24;
  }

  ctx.fillStyle = tokensCollected >= 3 ? '#8fe8ff' : 'rgba(143,232,255,0.75)';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    'Token: ' + tokensCollected + ' / 3' + (tokensCollected >= 3 ? '   （按 L 释放大招）' : ''),
    28, uiY
  );

  if ((typeof isMuted === 'function') && isMuted()) {
    uiY += 24;
    ctx.fillStyle = 'rgba(255,150,150,0.9)';
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('🔇 已静音（按 M 恢复）', 28, uiY);
  }

  if (suitBarnacle.phase === 2 && !(typeof touchActive !== 'undefined' && touchActive)) {
    ctx.fillStyle = 'rgba(255,213,79,0.9)';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('翻滚→跳   变红→蹲下躲   边缘红球→看清高度', W - 28, 28);
  }
}

function drawIntroUI() {
  const b = INTRO_BTN;
  const mb = INTRO_MUTE_BTN;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.font = 'bold 74px "Segoe UI", Arial, sans-serif';
  ctx.fillText('大肥鱼大战西装藤壶', W / 2 + 3, H / 2 - 180 + 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('大肥鱼大战西装藤壶', W / 2, H / 2 - 180);
  ctx.restore();

  const guideY = H / 2 - 90;
  const lineH = 32;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('— 操作说明 —', W / 2, guideY - 10);

  const panelW = 480;

  const guides = (typeof touchActive !== 'undefined' && touchActive) ? [
    ['◀ ▶',        '左右移动'],
    ['蹲 / 跳',     '蹲下 / 跳跃（空中再按 = 二段跳）'],
    ['攻击',        '按住持续射击（第 4 发是强化）'],
    ['大招',        '集满 3 个 Token 后释放'],
    ['暂停 / 静音',  '画面上的小圆钮'],
  ] : [
    ['A / D',  '左右移动'],
    ['S',      '蹲下'],
    ['K',      '跳跃 / 空中再按 = 二段跳'],
    ['J',      '攻击（按住持续射击）'],
    ['L',      '大招（集满 3 个 Token）'],
    ['空格',   '暂停 / 继续'],
    ['M',      '静音 / 恢复'],
    ['R',      '重新开始']
  ];
  const panelH = 40 + guides.length * 32 + 14;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect((W - panelW) / 2, guideY + 10, panelW, panelH, 12);
  ctx.fill();

  ctx.font = '15px "Segoe UI", Arial, sans-serif';
  for (let i = 0; i < guides.length; i++) {
    const y = guideY + 40 + i * lineH;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8fe8ff';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText(guides[i][0], W / 2 - 20, y);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '15px "Segoe UI", Arial, sans-serif';
    ctx.fillText(guides[i][1], W / 2 + 20, y);
  }
  ctx.restore();

  const ready = allAssetsReady();

  ctx.save();
  ctx.shadowColor = ready ? 'rgba(90,210,255,0.8)' : 'rgba(120,120,120,0.5)';
  ctx.shadowBlur = ready ? 24 : 10;
  ctx.fillStyle = ready ? 'rgba(90,210,255,0.95)' : 'rgba(150,160,180,0.85)';
  roundRect(b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  roundRect(b.x, b.y, b.w, b.h, 14);
  ctx.stroke();

  ctx.fillStyle = '#0b1020';
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    ready ? '开始游戏' : '素材加载中 ' + Math.round(assetProgress() * 100) + '%',
    b.x + b.w / 2, b.y + b.h / 2
  );

  // ---- 主菜单右上角：静音按钮 ----
  const muteOn = (typeof isMuted === 'function') && isMuted();
  ctx.save();
  ctx.shadowColor = muteOn ? 'rgba(255,120,120,0.7)' : 'rgba(90,210,255,0.6)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = muteOn ? 'rgba(60,30,40,0.85)' : 'rgba(18,40,70,0.75)';
  roundRect(mb.x, mb.y, mb.w, mb.h, 12);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = muteOn ? 'rgba(255,140,140,0.9)' : 'rgba(140,220,255,0.85)';
  ctx.lineWidth = 2;
  roundRect(mb.x, mb.y, mb.w, mb.h, 12);
  ctx.stroke();

  ctx.fillStyle = muteOn ? '#ffb3ba' : '#cfeaff';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(muteOn ? '🔇 已静音（M）' : '🔊 声音开（M）', mb.x + mb.w / 2, mb.y + mb.h / 2);
}

function drawPauseOverlay() {
  if (!paused) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd54f';
  ctx.font = 'bold 64px "Segoe UI", Arial, sans-serif';
  ctx.fillText('已暂停', W / 2, H / 2 - 20);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('按空格继续', W / 2, H / 2 + 50);
  ctx.restore();
}

function drawOverlay() {
  if (gameState !== 'win' && gameState !== 'lose') return;

  // 屏幕变暗
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, W, H);

  const isWin = (gameState === 'win');

  // ---- CG：有素材就用素材，没素材仍然是占位框 ----
  const cgImg = isWin ? assets.winCG : assets.loseCG;
  const cgReady = imgReady(cgImg);

  let cgW = W * 0.62;
  let cgH = H * 0.58;
  if (cgReady) {
    // 让画框贴合 CG 的长宽比
    const ar = cgImg.naturalWidth / cgImg.naturalHeight;
    cgH = H * 0.66;
    cgW = cgH * ar;
    if (cgW > W * 0.66) { cgW = W * 0.66; cgH = cgW / ar; }
  }
  const cgX = (W - cgW) / 2;
  const cgY = (H - cgH) / 2 - 30;

  // ---- 画框上方的结果文案 ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
  ctx.shadowColor = isWin ? 'rgba(255,213,79,0.9)' : 'rgba(255,92,108,0.9)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = isWin ? '#ffe9a8' : '#ffb3ba';
  ctx.fillText(isWin ? '恭喜通关！' : '再接再厉！', W / 2, cgY - 18);
  ctx.restore();

  // 外描边（金/红）
  ctx.save();
  ctx.shadowColor = isWin ? '#ffd54f' : '#ff5c6c';
  ctx.shadowBlur = 28;
  ctx.strokeStyle = isWin ? '#ffd54f' : '#ff5c6c';
  ctx.lineWidth = 4;
  roundRect(cgX, cgY, cgW, cgH, 16);
  ctx.stroke();
  ctx.restore();

  // 内部深色底
  const bg = ctx.createLinearGradient(cgX, cgY, cgX, cgY + cgH);
  bg.addColorStop(0, 'rgba(15,20,40,0.92)');
  bg.addColorStop(1, 'rgba(5,8,20,0.92)');
  ctx.fillStyle = bg;
  roundRect(cgX, cgY, cgW, cgH, 16);
  ctx.fill();

  // CG 底图 or 占位文字
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (cgReady) {
    const pad = 6;
    const iw = cgW - pad * 2, ih2 = cgH - pad * 2;
    const ar = cgImg.naturalWidth / cgImg.naturalHeight;
    let dw = iw, dh = iw / ar;
    if (dh > ih2) { dh = ih2; dw = ih2 * ar; }

    ctx.save();
    roundRect(cgX, cgY, cgW, cgH, 16);
    ctx.clip();
    ctx.drawImage(cgImg, cgX + (cgW - dw) / 2, cgY + (cgH - dh) / 2, dw, dh);
    ctx.restore();
  } else {
    ctx.fillStyle = isWin ? 'rgba(255,213,79,0.85)' : 'rgba(255,92,108,0.85)';
    ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
    ctx.fillText(isWin ? '胜利CG' : '失败CG', W / 2, cgY + cgH / 2);
  }

  // 四角装饰
  const corner = 26;
  ctx.strokeStyle = isWin ? 'rgba(255,213,79,0.85)' : 'rgba(255,92,108,0.85)';
  ctx.lineWidth = 4;
  const corners = [
    [cgX, cgY, 1, 1],
    [cgX + cgW, cgY, -1, 1],
    [cgX, cgY + cgH, 1, -1],
    [cgX + cgW, cgY + cgH, -1, -1]
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * corner, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * corner);
    ctx.stroke();
  }

  // 底部提示
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '22px "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    (typeof touchActive !== 'undefined' && touchActive) ? '点一下屏幕重新开始' : '按 R 重新开始',
    W / 2, cgY + cgH + 42
  );
}

function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';   // 大招/Token 图标是从 26x26 放大的，尽量平滑

  drawSky();

  ctx.save();
  if (shake > 0.5 && gameState === 'playing' && !paused) {
    ctx.translate(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake
    );
  }
  ctx.translate(0, cameraY);

  drawClouds();
  drawSun();
  drawSea();
  drawSuitBarnacle();
  drawSeaOverlay();
  drawSeaWaves();
  drawGround();
  drawSmashingBarnacles();
  drawPlayer();
  drawBarnacleHead();
  drawFallingBarnacles();
  drawBarnacleMonsters();
  drawProjectiles();
  drawGPT();
  drawIronBasins();
  drawTokens();
  drawEffects();

  ctx.restore();

  if (gameState === 'intro') {
    drawIntroUI();
  } else {
    drawCrosshair();
    drawUI();
    drawPauseOverlay();
    drawOverlay();
    drawUltimateFlash();
  }

  if (typeof drawTouchControls === 'function') drawTouchControls();
}