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
- `E`: switch workers into raid mode and attack nearby colonies

## Gameplay loop

- Collect golden spores to earn score and recover health.
- Stored score progress becomes eggs over time.
- Hatch more workers to expand your living colony.
- Switch to raid mode to destroy enemy workers and collapse weakened enemy colonies.
