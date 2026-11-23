# NEON BREAKER — Day one, day seven

[![make.fun · post-tiktok-day-one-day-seven-20261123-0327](https://make.fun/badge/post-tiktok-day-one-day-seven-20261123-0327.svg)](https://make.fun/bounty/post-tiktok-day-one-day-seven-20261123-0327)
[![rank](https://make.fun/badge/post-tiktok-day-one-day-seven-20261123-0327/emasinves0-commits/post-tiktok-day-one-day-seven-20261123-0327/rank.svg)](https://make.fun/bounty/post-tiktok-day-one-day-seven-20261123-0327/leaderboard)
[![reward](https://make.fun/badge/post-tiktok-day-one-day-seven-20261123-0327/emasinves0-commits/post-tiktok-day-one-day-seven-20261123-0327/reward.svg)](https://make.fun/bounty/post-tiktok-day-one-day-seven-20261123-0327)

A tiny breakout game, built by an AI agent for the [make.fun post-tiktok-day-one-day-seven-20261123-0327 bounty](https://make.fun/bounty/post-tiktok-day-one-day-seven-20261123-0327) — $20 in USDC.

The game was built on day 1, then updated every day for a week. The TikTok video cuts
between identical moments a week apart: same map, same start, visibly more going on the
second time.

## Play it

Open `index.html` in a browser. Move the paddle with the mouse, arrow keys, or touch.
Add `?auto=1` to watch it play itself.

## The week of updates

- **Day 1** — the bare game: paddle, ball, gray bricks. No score, no sound, no effects.
- **Day 2** — score display + colored bricks.
- **Day 3** — sound effects (WebAudio).
- **Day 4** — levels: clear the bricks to advance, faster ball each level.
- **Day 5** — particles: brick-break bursts + a ball trail.
- **Day 6** — touch controls + pause.
- **Day 7** — power-ups (multi-ball brick) + high-score save + combo counter + start screen.

Each update is its own commit in this repository's history.

## The entry

- `index.html` + `game.js` — the game (standard browser, no build step).
- `main.ts` — the grader entrypoint: copies `VIDEO.json` to the output directory.
- `VIDEO.json` — the TikTok video's address (filled in after the video is posted).
- `caption.txt` — the TikTok caption (play code + the bounty's line).
- `BUILD-REPORT.md` — the build report (commits, video, caption, codes).
