// NEON BREAKER — day 1. A tiny breakout game, built by an AI agent.
// Day 1: the bare game. Paddle, ball, bricks. No score, no sound, no effects.
// Later updates (days 2-7) add score, sound, levels, particles, touch, power-ups, high scores.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 1080, H = 1920;

const AUTO = new URLSearchParams(location.search).get('auto') === '1';

// --- fixed starting layout (identical on day 1 and day 7: same map, same start) ---
const ROWS = 5, COLS = 8;
const BRICK_W = 120, BRICK_H = 44, GAP = 8;
const BRICK_TOP = 220;
const BRICK_LEFT = (W - (COLS * BRICK_W + (COLS - 1) * GAP)) / 2;

const PADDLE_W = 220, PADDLE_H = 24, PADDLE_Y = 1700;
const BALL_R = 18;
const BALL_START = { x: 540, y: 1200, vx: 5, vy: -7 };

let paddleX = (W - PADDLE_W) / 2;
let ball = { ...BALL_START };
let bricks = [];

function buildBricks() {
  bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: BRICK_LEFT + c * (BRICK_W + GAP),
        y: BRICK_TOP + r * (BRICK_H + GAP),
        w: BRICK_W, h: BRICK_H, alive: true,
      });
    }
  }
}

function resetBall() {
  ball = { ...BALL_START };
}

function update() {
  // paddle: auto-play tracks the ball; a human moves it with mouse / keys / touch
  if (AUTO) {
    const target = ball.x - PADDLE_W / 2;
    paddleX += (target - paddleX) * 0.25;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  // walls
  if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
  if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
  if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

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
  }

  // bricks
  for (const b of bricks) {
    if (!b.alive) continue;
    if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
        ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
      b.alive = false;
      // bounce: reverse the axis of least penetration
      const overlapX = Math.min(ball.x + BALL_R - b.x, b.x + b.w - (ball.x - BALL_R));
      const overlapY = Math.min(ball.y + BALL_R - b.y, b.y + b.h - (ball.y - BALL_R));
      if (overlapX < overlapY) ball.vx = -ball.vx; else ball.vy = -ball.vy;
      break;
    }
  }

  // ball fell: relaunch (day 1 has no lives)
  if (ball.y - BALL_R > H) resetBall();

  // all bricks cleared: rebuild (day 1 has no levels)
  if (bricks.every(b => !b.alive)) buildBricks();
}

function draw() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  // bricks (day 1: plain gray)
  ctx.fillStyle = '#888888';
  for (const b of bricks) {
    if (!b.alive) continue;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  // paddle
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H);

  // ball
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// human controls (mouse / keys); auto-play overrides them when ?auto=1
canvas.addEventListener('mousemove', e => {
  if (AUTO) return;
  const rect = canvas.getBoundingClientRect();
  const scale = W / rect.width;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, (e.clientX - rect.left) * scale - PADDLE_W / 2));
});
const keys = {};
addEventListener('keydown', e => { keys[e.key] = true; });
addEventListener('keyup', e => { keys[e.key] = false; });
setInterval(() => {
  if (AUTO) return;
  if (keys['ArrowLeft']) paddleX = Math.max(0, paddleX - 18);
  if (keys['ArrowRight']) paddleX = Math.min(W - PADDLE_W, paddleX + 18);
}, 16);

buildBricks();
loop();
