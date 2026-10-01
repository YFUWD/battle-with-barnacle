/* =========================================================
   01b 素材加载
   ---------------------------------------------------------
   把 素材/ 里的美术挂到 config.js 的 assets 槽位上。
   加载是异步的：没就绪之前 hasSprite() 返回 false，
   所有绘制函数会自动退回程序绘制的占位图形，不会报错。

   路径约定：
     素材/抠好的/       —— 我处理过的成品（去底 / 抽帧）
     素材/               —— 本来就带透明通道的原图（二阶段、大招图标、两张 CG）
   ========================================================= */

const ASSET_FILES = {
  suitBarnacleBody: '素材/抠好的/suit_body.png',    // 西装藤壶·身体
  suitBarnacleHead: '素材/抠好的/suit_head.png',    // 西装藤壶·脑袋
  barnacleHead:     '素材/二阶段.png',              // 二阶段·圆形藤壶（原本就是透明底）
  fallingBarnacle:  '素材/抠好的/falling_barnacle.png',  // 下落藤壶
  barnacleBullet:   '素材/抠好的/barnacle_bullet.png',   // 二阶段子弹
  ironBasinFull:    '素材/抠好的/basin_full.png',   // 铁盆·满
  ironBasinEmpty:   '素材/抠好的/basin_empty.png',  // 铁盆·空
  basinHatBack:     '素材/抠好的/basin_hat_back.png',   // 倒扣铁盆·后半（在头后面）
  basinHatFront:    '素材/抠好的/basin_hat_front.png',  // 倒扣铁盆·前半（盖住头）
  gpt:              '素材/抠好的/gpt_moe.png',      // GPT = 萌化小人
  bulletOrb:        '素材/抠好的/whale_bullet.png', // 第 4 发强化子弹 = 萌鲸鱼
  // 深度思考图标只用于"大招释放"那一下的特效，Token 硬币仍是程序画的蓝圆+T
  ultimate:         '素材/大招（深度思考图标）.png',
};

// 两张 CG 各 2MB，不占首屏：点"开始游戏"之后再偷偷加载（见 loadLateAssets）
const LATE_ASSET_FILES = {
  winCG:  '素材/胜利CG.png',
  loseCG: '素材/战败CG.png',
};

// 移动动画：由 素材/鲸鱼娘移动.mp4 抽帧（ffmpeg）→ 抠白底 → 按内容中心逐帧对齐 → 统一裁切缩放
// 逐帧对齐很关键：视频里角色横向漂移了 177px（前进位移），不对齐的话动画会一顿一顿地滑
const PLAYER_MOVE_FRAMES = 47;
const playerMovePath = (i) => '素材/抠好的/player/run_' + String(i).padStart(2, '0') + '.png';

// 小怪：从 素材/各种藤壶.png 切出来的 3 只小藤壶
const MONSTER_SPRITE_FILES = [
  '素材/抠好的/monster_0.png',
  '素材/抠好的/monster_1.png',
  '素材/抠好的/monster_2.png',
];

// 砸藤壶：2 只（竖长 / 横躺），每次攻击随机挑一只
const SMASH_SPRITE_FILES = [
  '素材/抠好的/smash_0.png',
  '素材/抠好的/smash_1.png',
];

const assetLoad = { total: 0, done: 0, failed: [] };

function allAssetsReady() {
  return assetLoad.done >= assetLoad.total;
}

function assetProgress() {
  return assetLoad.total === 0 ? 1 : assetLoad.done / assetLoad.total;
}

function loadImageFile(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => { assetLoad.failed.push(src); resolve(null); };
    img.src = src;
  });
}

(function loadAssets() {
  const jobs = [];

  for (const key of Object.keys(ASSET_FILES)) {
    assetLoad.total++;
    jobs.push(loadImageFile(ASSET_FILES[key]).then((img) => {
      assets[key] = img;          // 加载失败是 null，hasSprite 自然为 false
      assetLoad.done++;
    }));
  }

  for (let i = 0; i < PLAYER_MOVE_FRAMES; i++) {
    assetLoad.total++;
    jobs.push(loadImageFile(playerMovePath(i)).then((img) => {
      if (img) assets.playerMove[i] = img;
      assetLoad.done++;
    }));
  }

  for (let i = 0; i < MONSTER_SPRITE_FILES.length; i++) {
    assetLoad.total++;
    jobs.push(loadImageFile(MONSTER_SPRITE_FILES[i]).then((img) => {
      if (img) assets.barnacleMonster[i] = img;
      assetLoad.done++;
    }));
  }

  for (let i = 0; i < SMASH_SPRITE_FILES.length; i++) {
    assetLoad.total++;
    jobs.push(loadImageFile(SMASH_SPRITE_FILES[i]).then((img) => {
      if (img) assets.smashingBarnacle[i] = img;
      assetLoad.done++;
    }));
  }

  Promise.all(jobs).then(() => {
    assetLoad.done = assetLoad.total;
    if (assetLoad.failed.length > 0) {
      console.warn('[素材] 以下文件没加载成功，将使用占位图形：\n' + assetLoad.failed.join('\n'));
    }
  });
})();

// 开局后后台加载大图（两张 CG 各 2MB）：不计入加载进度，没就绪时 CG 用占位框
let lateAssetsStarted = false;
function loadLateAssets() {
  if (lateAssetsStarted) return;
  lateAssetsStarted = true;
  for (const key of Object.keys(LATE_ASSET_FILES)) {
    loadImageFile(LATE_ASSET_FILES[key]).then((img) => { assets[key] = img; });
  }
}
