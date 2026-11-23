// NEON BREAKER — day 7 (final). High-score save + combo counter + start screen.
// Day 7 final: the best score persists in localStorage, chained bricks build a combo,
// and the game opens on a title screen (auto-play skips it).

let audioCtx = null;
function beep(freq, dur, type, vol) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* audio unavailable (headless): play on silently */ }
}
const sfxPaddle = () => beep(220, 0.08, 'square', 0.06);
const sfxBrick = () => beep(660, 0.12, 'square', 0.08);
const sfxWall = () => beep(180, 0.05, 'triangle', 0.04);
const sfxLost = () => beep(110, 0.3, 'sawtooth', 0.07);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 1080, H = 1920;

const AUTO = new URLSearchParams(location.search).get('auto') === '1';

// --- fixed starting layout (identical on day 1 and day 7: same map, same start) ---
const ROWS = 5, COLS = 8;
const BRICK_W = 120, BRICK_H = 44, GAP = 8;
const BRICK_TOP = 220;
const BRICK_LEFT = (W - (COLS * BRICK_W + (COLS - 1) * GAP)) / 2;
const ROW_COLORS = ['#ff2d78', '#ff9f1c', '#ffee3a', '#2ec4b6', '#3a86ff'];

const PADDLE_W = 220, PADDLE_H = 24, PADDLE_Y = 1700;
const BALL_R = 18;
const BALL_START = { x: 540, y: 1200, vx: 5, vy: -7 };

let paddleX = (W - PADDLE_W) / 2;
let balls = [{ ...BALL_START }]; // day 7: many balls (multi-ball power-up)
let bricks = [];
let score = 0;
let level = 1;
let levelFlash = 0; // frames left to show "LEVEL N"
let particles = []; // {x, y, vx, vy, life, color, size}
let trail = []; // last ball positions, fading
let paused = false;
let combo = 0; // day 7 final: chained bricks without a paddle touch
let started = AUTO; // day 7 final: humans start on click; auto-play starts at once
let best = 0; // day 7 final: persisted high score
try { best = parseInt(localStorage.getItem('neon-breaker-best') || '0', 10) || 0; } catch (e) {}

function buildBricks() {
  bricks = [];
  // day 7: one random brick per level is a multi-ball power-up brick
  const powerIdx = Math.floor(Math.random() * ROWS * COLS);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: BRICK_LEFT + c * (BRICK_W + GAP),
        y: BRICK_TOP + r * (BRICK_H + GAP),
        w: BRICK_W, h: BRICK_H, alive: true, color: ROW_COLORS[r],
        power: (r * COLS + c) === powerIdx,
      });
    }
  }
}

function resetBall() {
  balls = [{ ...BALL_START }];
}

function burst(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 6;
    particles.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
      life: 30 + Math.random() * 20, color, size: 4 + Math.random() * 6,
    });
  }
}

function update() {
  // paddle: auto-play tracks the lowest ball; a human moves it with mouse / keys / touch
  if (AUTO && balls.length > 0) {
    const low = balls.reduce((a, b) => (b.y > a.y ? b : a), balls[0]);
    const target = low.x - PADDLE_W / 2;
    paddleX += (target - paddleX) * 0.25;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));
  }

  const spawned = [];
  for (const ball of balls) {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // walls
    if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); sfxWall(); }
    if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); sfxWall(); }
    if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); sfxWall(); }

    // paddle
    if (ball.vy > 0 &&
        ball.y + BALL_R >= PADDLE_Y && ball.y + BALL_R <= PADDLE_Y + PADDLE_H + 12 &&
        ball.x >= paddleX && ball.x <= paddleX + PADDLE_W) {
      const hit = (ball.x - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2); // -1..1
      const speed = Math.hypot(ball.vx, ball.vy);
      const angle = hit * (Math.PI / 3); // up to 60 degrees
      ball.vx = speed * Math.sin(angle);
      ball.vy = -speed * Math.cos(angle);
      ball.y = PADDLE_Y - BALL_R;
      sfxPaddle();
      combo = 0; // day 7 final: a paddle touch breaks the combo
    }

    // bricks
    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
          ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
        b.alive = false;
        combo++; // day 7 final: chained bricks build the combo
        score += 10 + combo;
        if (score > best) {
          best = score;
          try { localStorage.setItem('neon-breaker-best', String(best)); } catch (e) {}
        }
        sfxBrick();
        burst(b.x + b.w / 2, b.y + b.h / 2, b.color);
        // day 7: the power-up brick splits the ball in two
        if (b.power && balls.length + spawned.length < 4) {
          spawned.push({ x: ball.x, y: ball.y, vx: -ball.vx, vy: ball.vy });
          beep(990, 0.2, 'sine', 0.1);
        }
        // bounce: reverse the axis of least penetration
        const overlapX = Math.min(ball.x + BALL_R - b.x, b.x + b.w - (ball.x - BALL_R));
        const overlapY = Math.min(ball.y + BALL_R - b.y, b.y + b.h - (ball.y - BALL_R));
        if (overlapX < overlapY) ball.vx = -ball.vx; else ball.vy = -ball.vy;
        break;
      }
    }
  }
  balls.push(...spawned);

  // drop balls that fell; if none are left, relaunch
  balls = balls.filter(b => b.y - BALL_R <= H);
  if (balls.length === 0) { sfxLost(); combo = 0; resetBall(); }

  // all bricks cleared: next level (day 4) — rebuild, faster ball, flash the level
  if (bricks.every(b => !b.alive)) {
    level++;
    levelFlash = 120;
    buildBricks();
    resetBall();
    const boost = 1 + 0.15 * (level - 1);
    balls[0].vx = BALL_START.vx * boost;
    balls[0].vy = BALL_START.vy * boost;
  }
  if (levelFlash > 0) levelFlash--;

  // particles: gravity + fade (day 5)
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life--;
  }
  particles = particles.filter(p => p.life > 0);

  // ball trail (day 5): keep the last 12 positions of the first ball
  if (balls.length > 0) {
    trail.push({ x: balls[0].x, y: balls[0].y });
    if (trail.length > 12) trail.shift();
  }
}

function draw() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  // bricks (day 2: one neon color per row; day 7: the power-up brick glows white)
  for (const b of bricks) {
    if (!b.alive) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if (b.power) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', b.x + b.w / 2, b.y + b.h / 2 + 11);
      ctx.textAlign = 'left';
    }
  }

  // HUD (day 2: score + bricks; day 4: level; day 7 final: best + combo)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE ' + score, 32, 80);
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL ' + level, W / 2, 80);
  ctx.textAlign = 'right';
  ctx.fillText('BRICKS ' + bricks.filter(b => b.alive).length, W - 32, 80);
  ctx.textAlign = 'left';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#ffee3a';
  ctx.fillText('BEST ' + best, 32, 132);
  if (combo >= 2) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff2d78';
    ctx.fillText('COMBO x' + combo, W - 32, 132);
  }
  ctx.textAlign = 'left';

  // level-up flash (day 4)
  if (levelFlash > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, ' + Math.min(1, levelFlash / 60) + ')';
    ctx.font = 'bold 90px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL ' + level, W / 2, H / 2);
    ctx.textAlign = 'left';
  }

  // paddle
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H);

  // ball trail (day 5): fading circles behind the ball
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (i / trail.length * 0.35) + ')';
    ctx.beginPath();
    ctx.arc(t.x, t.y, BALL_R * (0.4 + 0.6 * i / trail.length), 0, Math.PI * 2);
    ctx.fill();
  }

  // balls (day 7: all of them)
  ctx.fillStyle = '#ffffff';
  for (const ball of balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
  }

  // particles (day 5)
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 50);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // pause overlay (day 6)
  if (paused) {
    ctx.fillStyle = 'rgba(10, 10, 18, 0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 90px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2);
    ctx.font = '40px sans-serif';
    ctx.fillText('Press P to resume', W / 2, H / 2 + 80);
    ctx.textAlign = 'left';
  }

  // start screen (day 7 final)
  if (!started) {
    ctx.fillStyle = 'rgba(10, 10, 18, 0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEON', W / 2, H / 2 - 60);
    ctx.fillStyle = '#ff2d78';
    ctx.fillText('BREAKER', W / 2, H / 2 + 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = '44px sans-serif';
    ctx.fillText('Click or tap to start', W / 2, H / 2 + 180);
    ctx.font = '36px sans-serif';
    ctx.fillStyle = '#ffee3a';
    ctx.fillText('BEST ' + best, W / 2, H / 2 + 260);
    ctx.textAlign = 'left';
  }
}

function loop() {
  if (!paused && started) update();
  draw();
  requestAnimationFrame(loop);
}

// start screen (day 7 final): any click / key / touch starts the game
function startGame() { started = true; }
canvas.addEventListener('click', startGame);
addEventListener('keydown', startGame);
canvas.addEventListener('touchstart', startGame, { passive: true });

// human controls (mouse / keys); auto-play overrides them when ?auto=1
canvas.addEventListener('mousemove', e => {
  if (AUTO) return;
  const rect = canvas.getBoundingClientRect();
  const scale = W / rect.width;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, (e.clientX - rect.left) * scale - PADDLE_W / 2));
});
const keys = {};
addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'p' || e.key === 'P') paused = !paused; // day 6: pause
});
addEventListener('keyup', e => { keys[e.key] = false; });

// touch controls (day 6): drag to move the paddle
canvas.addEventListener('touchmove', e => {
  if (AUTO) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scale = W / rect.width;
  const t = e.touches[0];
  paddleX = Math.max(0, Math.min(W - PADDLE_W, (t.clientX - rect.left) * scale - PADDLE_W / 2));
}, { passive: false });
setInterval(() => {
  if (AUTO) return;
  if (keys['ArrowLeft']) paddleX = Math.max(0, paddleX - 18);
  if (keys['ArrowRight']) paddleX = Math.min(W - PADDLE_W, paddleX + 18);
}, 16);

buildBricks();
loop();
