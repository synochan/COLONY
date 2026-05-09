# Colony.io

Colony.io is a fast-paced browser multiplayer game where each player controls a hive, grows a worker swarm, gathers resources, and battles rival colonies in a shared live arena.

It blends:

- real-time movement
- worker micro-management
- run-based upgrade choices
- competitive map control

## What The Game Includes

- Live multiplayer matches with up to **30 players**
- Hive movement and worker control
- Splitting, merging, hatching, and raiding
- Match-based card buffs and progression
- Account and guest play
- Spectator mode
- Network diagnostics for live testing

## Tech Stack

- **Backend:** Node.js
- **Realtime networking:** `ws` WebSockets
- **Frontend:** HTML, CSS, JavaScript
- **Rendering:** HTML5 Canvas
- **Persistence:** PostgreSQL on Railway through `DATABASE_URL`, with local JSON fallback

## Run Locally

```powershell
npm.cmd install
npm.cmd start
```

Then open:

- `http://localhost:3000`

## Core Controls

- `WASD` move the hive
- `Shift` boost movement
- `Space` hatch a worker
- `Q` merge workers
- `F` split a large worker
- `Left Click` direct workers into raid mode

## Project Notes

- The game is server-authoritative
- The system is tuned for persistent WebSocket connections
- The recommended deployment target is Railway or another always-on host

## Deployment

This project supports:

- Docker-based deployment
- Railway-style health checks through `/healthz`
- PostgreSQL persistence through Railway Postgres and `DATABASE_URL`
- local fallback persistence through `DATA_DIR`

For Railway, add a PostgreSQL database to the project and expose `DATABASE_URL` to the game service. The server creates the required account and ban tables automatically on startup; the reference schema is in [database/schema.sql](./database/schema.sql).

## Versioning

The server exposes build metadata through `/version`, `/healthz`, `/rooms`, and the in-game network HUD.

- Local development defaults to `1.0.0-development`.
- Docker/Railway defaults to `1.0.0-production` because `NODE_ENV=production` is set in the Dockerfile.
- Set `APP_VERSION` to override the release number for a deployment.
- Set `DEPLOY_CHANNEL=development` or `DEPLOY_CHANNEL=production` when you want explicit branch-based labels.
- Railway commit hashes are appended automatically when `RAILWAY_GIT_COMMIT_SHA` is available.

If you want the full system write-up covering architecture, PDC concepts, performance evidence, and design rationale, see [Details.md](./Details.md).
