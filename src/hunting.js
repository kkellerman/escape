const FRAME_W     = 32;
const FRAME_H     = 32;
const WALK_FRAMES = 5;
const RUN_ROW     = 2;   // 0-indexed: user's row 3
const IDLE_ROW    = 0;   // 0-indexed: user's row 1
const SCALE       = 2;
const DEER_W      = FRAME_W * SCALE;
const DEER_H      = FRAME_H * SCALE;

let animHandle = null;
let spawnTimer = null;

// ─── Sound helper ──────────────────────────────────────────────────────────
function fireSound(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // Clone the node so playback starts instantly with no seek delay
  const clone = el.cloneNode();
  clone.play().catch(() => {});
}

// ─── Background ────────────────────────────────────────────────────────────
let meadowImg = null;

function loadMeadow() {
  if (meadowImg) return meadowImg;
  meadowImg = new Image();
  meadowImg.src = 'img/scenes/meadow.png';
  return meadowImg;
}

function drawBackground(ctx, W, H) {
  if (meadowImg && meadowImg.complete) {
    // Cover-scale: fit width, centre vertically
    const scale  = W / meadowImg.width;
    const drawH  = meadowImg.height * scale;
    const offsetY = (H - drawH) / 2;
    ctx.drawImage(meadowImg, 0, offsetY, W, drawH);
    // Fill any exposed strips above/below with edge colour
    if (offsetY > 0) {
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(0, 0, W, offsetY);
      ctx.fillRect(0, H - offsetY, W, offsetY);
    }
  } else {
    // Fallback gradient while image loads
    ctx.fillStyle = '#5d8a3c';
    ctx.fillRect(0, 0, W, H);
  }
}

// ─── Deer drawing ──────────────────────────────────────────────────────────
function drawDeer(ctx, sprite, d) {
  const row = d.isIdle ? IDLE_ROW : RUN_ROW;
  const sx  = d.frame * FRAME_W;
  const sy  = row * FRAME_H;

  ctx.save();
  // Pivot at ground-centre — used for fall rotation
  ctx.translate(d.x + DEER_W / 2, d.y + DEER_H);

  if (d.hit) {
    ctx.rotate(Math.min(d.fallAngle, Math.PI / 2));
  }

  // Flip so deer walks left
  ctx.scale(-1, 1);
  ctx.drawImage(sprite, sx, sy, FRAME_W, FRAME_H, -DEER_W / 2, -DEER_H, DEER_W, DEER_H);
  ctx.restore();
}

// ─── HUD ───────────────────────────────────────────────────────────────────
function drawHUD(ctx, bulletsLeft, foodGained, maxBullets, W) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, 38);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px monospace';
  const filled  = Array(bulletsLeft).fill('●').join(' ');
  const empty   = Array(maxBullets - bulletsLeft).fill('○').join(' ');
  const sep     = filled && empty ? ' ' : '';
  ctx.fillText('🔫 ' + filled + sep + empty, 12, 25);
  if (foodGained > 0) {
    ctx.fillStyle = '#5dbb5d';
    ctx.fillText(`+${foodGained} lbs`, W / 2 - 30, 25);
  }
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.fillText('ESC — retreat', W - 100, 25);
}

// ─── Hit detection ─────────────────────────────────────────────────────────
function isHit(mx, my, d) {
  return mx >= d.x && mx <= d.x + DEER_W && my >= d.y && my <= d.y + DEER_H;
}

// ─── Public API ────────────────────────────────────────────────────────────
export function startHunting(vehicle, onComplete) {
  const screen = document.getElementById('hunting-screen');
  const canvas = document.getElementById('hunting-canvas');
  const ctx    = canvas.getContext('2d');

  const W = canvas.width  = 705;
  const H = canvas.height = 300;
  screen.style.display = 'block';

  const sprite     = new Image();
  sprite.src       = 'img/game-objects/deer-male.png';
  loadMeadow();

  const maxBullets = Math.min(vehicle.bullets, 3);
  let bulletsLeft  = maxBullets;
  let foodGained   = 0;
  const deer       = [];

  function spawnDeer() {
    const active = deer.filter(d => !d.hit).length;
    if (active >= 2) return;
    const speeds = [0.8, 1.2, 1.8, 2.4, 3.0];
    deer.push({
      x:          W + 20,
      y:          H * 0.6 + Math.random() * (H * 0.4 - DEER_H),
      speed:      speeds[Math.floor(Math.random() * speeds.length)],
      frame:      0,
      frameTimer: 0,
      isIdle:     false,
      idleTimer:  0,
      hit:        false,
      fallAngle:  0,
    });
  }

  function end() {
    cancelAnimationFrame(animHandle);
    clearInterval(spawnTimer);
    screen.style.display = 'none';
    document.removeEventListener('keydown', onEsc);
    canvas.removeEventListener('click', onShoot);
    onComplete(foodGained, maxBullets - bulletsLeft);
  }

  function gameLoop() {
    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx, W, H);

    for (let i = deer.length - 1; i >= 0; i--) {
      const d = deer[i];

      if (d.hit) {
        if (d.fallAngle < Math.PI / 2) d.fallAngle += 0.1;
        // fallen deer stay on screen — no removal
      } else {
        if (d.isIdle) {
          // Idle: slow frame cycle, count down
          d.idleTimer--;
          d.frameTimer++;
          if (d.frameTimer >= 18) { d.frame = (d.frame + 1) % WALK_FRAMES; d.frameTimer = 0; }
          if (d.idleTimer <= 0) { d.isIdle = false; d.frame = 0; }
        } else {
          // Running
          d.x -= d.speed;
          d.frameTimer++;
          if (d.frameTimer >= 4) { d.frame = (d.frame + 1) % WALK_FRAMES; d.frameTimer = 0; }
          // Random chance to go idle briefly
          if (Math.random() < 0.003) {
            d.isIdle    = true;
            d.idleTimer = 80 + Math.floor(Math.random() * 60); // ~1.3–2.3 s
            d.frame     = 0;
          }
          if (d.x < -DEER_W - 10) { deer.splice(i, 1); continue; }
        }
      }

      drawDeer(ctx, sprite, d);
    }

    drawHUD(ctx, bulletsLeft, foodGained, maxBullets, W);

    if (bulletsLeft > 0) {
      animHandle = requestAnimationFrame(gameLoop);
    } else {
      setTimeout(end, 1000);
    }
  }

  function onShoot(e) {
    if (bulletsLeft <= 0) return;
    bulletsLeft--;

    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    let hit    = false;

    deer.forEach(d => {
      if (!d.hit && isHit(mx, my, d)) {
        d.hit      = true;
        d.isIdle   = false;
        hit        = true;
        foodGained += Math.floor(Math.random() * 30) + 20;
      }
    });

    fireSound(hit ? 'shotgun-fire' : 'shotgun-dry');
  }

  function onEsc(e) { if (e.key === 'Escape') end(); }

  document.addEventListener('keydown', onEsc);
  canvas.addEventListener('click', onShoot);
  document.getElementById('hunting-retreat').addEventListener('click', end, { once: true });

  sprite.onload = () => {
    spawnDeer();
    spawnTimer = setInterval(spawnDeer, 2800);
    gameLoop();
  };
}
