/* =========================================================
   07 主循环
   ========================================================= */

// ---------------- 重开 ----------------
function resetGame() {
  globalTime = 0;
  shake = 0;
  paused = false;
  actionQueue.length = 0;
  projectiles.length = 0;
  particles.length = 0;
  fallingBarnacles.length = 0;
  barnacleMonsters.length = 0;
  smashingBarnacles.length = 0;
  gptList.length = 0;
  ironBasins.length = 0;
  tokenList.length = 0;
  tokensCollected = 0;
  ultimateFlash = 0;
  barnacleHead = null;
  gptCooldown = 900 + Math.floor(Math.random() * 1800);
  lastAttackType = null;
  secondLastAttackType = null;
  resetPlayer();
  resetSuitBarnacle();

  if (!hasIntroPlayed) {
    hasIntroPlayed = true;
    gameState = 'intro';
    cameraY = H;
    introTransition = false;
  } else {
    gameState = 'playing';
    cameraY = 0;
    introTransition = false;
    startBGM();          // 重开时把 BGM 接回来（音频没初始化时是空操作）
  }
}

// =========================================================
//  更新
// =========================================================
function update() {
  if (gameState === 'intro') {
    for (const c of clouds) {
      c.x += c.speed;
      if (c.x > W + 200) c.x = -200;
    }
    if (introTransition) {
      cameraY -= 8;
      if (cameraY <= 0) {
        cameraY = 0;
        introTransition = false;
        gameState = 'playing';
      }
    }
    effectUpdate();
    globalTime++;
    return;
  }

  if (paused) return;

  if (gameState === 'playing') {
    playerUpdate();

    if (suitBarnacle.phase === 1) {
      suitBarnacleUpdate();
    } else if (suitBarnacle.phase === 'transition') {
      barnacleHeadTransitionUpdate();
    } else if (suitBarnacle.phase === 2) {
      barnacleHeadUpdate();
    } else if (suitBarnacle.phase === 'dying') {
      barnacleHeadDyingUpdate();
    }

    projectileUpdate();
    fallingBarnacleUpdate();
    barnacleMonsterUpdate();
    updateSmashingBarnacles();
    gptUpdate();
    ironBasinUpdate();
    tokenUpdate();
    if (ultimateFlash > 0) ultimateFlash--;
  } else {
    actionQueue.length = 0;
  }
  effectUpdate();
  globalTime++;
}

// =========================================================
//  主循环
// =========================================================
const STEP = 1000 / 60;
let lastTime = performance.now();
let accumulator = 0;

function loop(now) {
  let dt = now - lastTime;
  lastTime = now;
  if (dt > 200) dt = 200;

  accumulator += dt;
  let guard = 0;
  while (accumulator >= STEP && guard < 5) {
    update();
    accumulator -= STEP;
    guard++;
  }
  if (guard >= 5) accumulator = 0;

  render();
  requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);