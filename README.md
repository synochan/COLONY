# Colony.io

Colony.io is a 2D browser-based multiplayer game inspired by agar.io and slither.io, but built around colony growth instead of body size. Each player controls a queen colony in a top-down arena, collects spores, hatches workers, and raids rival colonies in a shared real-time battlefield.

## Requirements covered

- `Up to 30 concurrent players`: the server allows up to thirty live players in one room.
- `Real-time synchronization`: player movement, resource collection, hatching, raids, and event updates are synchronized live through WebSockets.
- `Server-authoritative architecture`: the Node.js server owns the game state and broadcasts snapshots to all clients.
- `Concurrency / parallelism concepts`: async network I/O, a fixed-timestep game loop, shared state mutation, and event processing run continuously.

## Run locally

1. Install dependencies:

```powershell
npm.cmd install
```

2. Start the server:

```powershell
npm.cmd start
```

3. Open `http://localhost:3000` in multiple browser tabs to test multiplayer, up to 30 concurrent players.

## Controls

- `WASD`: move the colony core
- `Shift`: boost movement speed by spending score
- `Space`: hatch one worker using a stored egg
- `Q`: merge 2 workers into 1 stronger worker
- `F`: split 1 large worker into 2 smaller faster workers
- `Left Click`: hold to send workers into raid mode and direct them

## Gameplay loop

- Collect golden spores to earn score and recover health.
- Stored score progress becomes eggs over time.
- Hatch more workers to expand your living colony.
- Switch to raid mode to destroy enemy workers and collapse weakened enemy colonies.

## Branch workflow

- `development`: daily feature work, balancing, and testing
- `production`: stable branch for live deploys only

Suggested flow:

1. Work and test on `development`
2. Push with a specific commit message for each batch of changes
3. Merge or fast-forward `production` only when the build feels stable

## Deployment prep

- `PORT` is already configurable through the environment
- `GET /healthz` is available for host health checks
- `Dockerfile` is included for container-based deployment

## Best host for smooth live play

This game uses a long-lived Node.js WebSocket server, so a host with persistent connections is the right fit.

- Best balance of ease and performance: `Railway`
- Also good: `Fly.io`, `Render`, or a small VPS on `Hetzner` / `DigitalOcean`
- Avoid serverless-first platforms for the game server itself, because WebSocket-heavy realtime gameplay is a poor fit there

For the smoothest live experience, deploy the server in the region closest to most of your players and keep the whole game on one always-on Node process or container.
