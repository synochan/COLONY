# Colony.io Learning Materials and PDC Defense Guide

This document is made for project defense, review, and study. It explains how Colony.io works, why the design choices were made, and how the system applies Parallel and Distributed Computing concepts in a real multiplayer game.

## 1. Project Summary

Colony.io is a real-time multiplayer browser game where players control a hive, grow workers, collect resources, choose card buffs, and fight other colonies in a shared arena.

The important technical challenge is that many players are moving, attacking, growing, splitting, merging, and receiving live updates at the same time. The system must keep the game fair, smooth, and synchronized even when players have different network conditions.

## 2. System Components

### Client

Files:

- `public/index.html`
- `public/client.js`
- `public/styles.css`

The client handles input, menus, rendering, audio, camera movement, interpolation, HUD, patch notes, and network telemetry. It does not decide final game outcomes. It sends player intent to the server, then renders the server-approved game state.

How it works:

- Keyboard and mouse input are captured in the browser.
- Inputs are sent through WebSocket messages.
- The client receives server snapshots.
- The client smooths movement visually through interpolation.
- The Canvas renderer draws hives, workers, food, HP bars, cards, effects, and HUD.

Why this works:

The client is fast at rendering and input collection, while the server remains the authority. This gives responsiveness without allowing the browser to cheat game rules.

Why use Canvas instead of DOM elements:

Canvas is better for many moving objects because the game can redraw the entire scene efficiently every frame. DOM elements are easier for forms and menus, but less ideal for hundreds of food dots, workers, circles, and moving effects.

How it improves gameplay:

Canvas gives smoother motion, camera control, and cleaner visual scaling. Players see a continuous arena instead of many separate HTML elements moving around.

### Server

File:

- `server.js`

The server handles accounts, rooms, simulation, combat, card buffs, scoring, worker behavior, WebSocket connections, snapshots, and persistence.

How it works:

- The server runs a fixed game loop.
- Each room has its own state.
- Players send input packets.
- The server updates positions, health, food, workers, attacks, cards, and round state.
- The server broadcasts compact snapshots back to clients.

Why this works:

All important gameplay logic is centralized. This prevents each player from having a different version of the truth.

Why use a server-authoritative model instead of client-authoritative:

Client-authoritative games are easier to build but easier to cheat. A modified browser could claim impossible movement, fake kills, or give itself score. Server-authoritative logic means the server validates and computes the real result.

How it improves gameplay:

Players experience fairer combat because everyone follows the same rules. Movement, damage, food, cards, and score are calculated consistently.

### Database

Files and services:

- Railway PostgreSQL
- `database/schema.sql`
- local fallback: `data/accounts.json`

The database stores accounts, bans, progression, skins, roles, and persistent profile information.

How it works:

- In production, the server uses `DATABASE_URL`.
- On startup, the server creates missing tables automatically.
- Account saves use safer upserts.
- Production fails fast if Postgres is missing or broken.

Why this works:

Railway redeploys containers. Files inside a redeployed container can disappear, but PostgreSQL is an external persistent service. Keeping accounts in Postgres prevents account resets after deploys.

Why use PostgreSQL instead of JSON in production:

JSON is simple for local testing, but it is not safe for live persistent deployment. PostgreSQL supports durable storage, concurrent access, queries, indexing, and safer updates.

How it improves gameplay:

Players keep their accounts, progression, skins, and stats after server redeploys. This makes the game feel permanent instead of temporary.

## 3. High-Level Architecture

```text
Player Browser
  |
  | HTTP
  v
Node.js Server
  |
  | Serves HTML, CSS, JS, icons
  v
Browser Loads Client
  |
  | WebSocket input packets
  v
Server Game Loop
  |
  | Updates room state, combat, workers, cards, score
  v
Snapshot Broadcast
  |
  | WebSocket state snapshots
  v
Browser Canvas Renderer

Node.js Server
  |
  | SQL through DATABASE_URL
  v
Railway PostgreSQL
```

Data flow:

- The browser sends player intent, not final results.
- The server simulates the match.
- The server sends snapshots.
- The browser interpolates and renders snapshots.
- Persistent account data goes to PostgreSQL.

## 4. PDC Concepts Applied

PDC means Parallel and Distributed Computing. Colony.io applies these concepts because it has many clients interacting with one live distributed system.

### Client-server architecture

Where it appears:

- Browser clients connect to the Node.js server.
- HTTP is used for login, registration, rooms, joins, spectate, and static files.
- WebSocket is used for live gameplay.

How it works:

The client handles presentation and input. The server handles game authority and synchronization.

Why this works:

The workload is separated. The browser does rendering, while the server coordinates shared state.

Why use this instead of peer-to-peer:

Peer-to-peer would require clients to trust each other and synchronize directly. That increases cheating risk and NAT/firewall complexity. Client-server is simpler, fairer, and easier to deploy on Railway.

How it improves gameplay:

Everyone plays in the same authoritative arena. The server can resolve collisions, attacks, score, and deaths consistently.

### Distributed clients

Where it appears:

- Every player browser is a separate distributed node.
- Spectators are also distributed clients.

How it works:

Each client sends input from a different machine and receives snapshots from the same server.

Why this works:

The game distributes rendering work to each player device. The server does not render graphics. It only computes shared state.

Why use this:

Rendering on the server would waste resources and add latency. Browsers already have graphics APIs and local hardware.

How it improves gameplay:

Players get local rendering speed while the server keeps the world synchronized.

### Persistent WebSocket communication

Where it appears:

- `ws` WebSocket server in `server.js`
- input messages from client to server
- state snapshots from server to client

How it works:

A WebSocket stays open. The client does not need to create a new HTTP request for every movement update.

Why this works:

Real-time games need frequent small messages. WebSockets reduce request overhead and allow two-way communication.

Why use WebSocket instead of polling:

Polling repeatedly asks the server for updates even when nothing changed. This increases latency and bandwidth. WebSocket allows immediate server-to-client updates.

How it improves gameplay:

Movement, combat, and worker control feel faster because updates can travel continuously instead of waiting for repeated HTTP requests.

How it improves network:

WebSocket reduces overhead by reusing one connection. It also lets the server send compact snapshots at a controlled broadcast rate.

### Event loop concurrency

Where it appears:

- Node.js server
- HTTP handling
- WebSocket messages
- timers for game ticks, broadcasts, cleanup, and saves

How it works:

Node.js uses an event loop. It can handle many I/O operations without creating one thread per player.

Why this works:

Most multiplayer server work here is I/O-heavy: sockets, HTTP requests, timers, database writes, and broadcasts. Node.js is efficient for this pattern.

Why use Node.js instead of manually creating threads:

Manual threading increases complexity, race conditions, and locking problems. Node.js keeps the model simpler while still supporting many simultaneous connections.

How it improves gameplay:

The server can react quickly to many connected players without blocking on each connection.

### Time-stepped simulation

Where it appears:

- Server game loop
- room updates
- worker movement
- combat
- resource spawning

How it works:

The server updates the game world using a tick rate. Movement and damage are multiplied by elapsed time so the game remains stable even if a tick is slightly delayed.

Why this works:

Time-based movement avoids depending on exact frame counts. A player should move similar distances over time even if the server tick timing changes slightly.

Why use server ticks instead of updating only when players send input:

Workers, food, health regeneration, cooldowns, combat, and round timers must continue even when a player is not pressing a key.

How it improves gameplay:

The world feels alive and consistent. Workers keep harvesting, combat keeps resolving, and round logic continues.

### Per-room simulation

Where it appears:

- public arena rooms
- custom rooms
- room-local state
- room-local tick timing
- room-local snapshot sequence

How it works:

Each room has its own players, resources, events, round state, broadcast sequence, and tick timing.

Why this works:

Rooms should not interfere with each other. A custom room should update smoothly even if a public arena exists.

Why use per-room state instead of one global world:

One global world is simpler at first, but it causes scaling and fairness problems. Room-based state allows multiple matches and custom settings.

How it improves gameplay:

Custom games can have different settings without breaking public arenas.

How it improves network:

Players only receive snapshots for their room. This avoids sending irrelevant data from other rooms.

### Snapshot broadcasting

Where it appears:

- server snapshot creation
- WebSocket broadcast loop
- client snapshot merge and smoothing

How it works:

The server periodically sends a snapshot of relevant game state to each client.

Why this works:

Snapshots keep clients synchronized without requiring them to simulate every detail perfectly.

Why use snapshots instead of sending every individual event only:

Event-only networking can drift if a packet is missed or processed differently. Snapshots provide a known current truth.

How it improves gameplay:

If the client becomes slightly out of sync, the next snapshot corrects it.

How it improves network:

Snapshots can be filtered and throttled. The server can avoid sending all resources every tick.

### Interest management

Where it appears:

- visible resource filtering
- viewer bounds
- player snapshot filtering
- leaderboard/resource refresh intervals

How it works:

The server sends each player only the most relevant objects around their view and command range.

Why this works:

A player does not need every far-away food pellet or enemy every tick.

Why use this instead of broadcasting the full world:

Full-world broadcasts grow expensive as the map and player count increase. Interest management reduces bandwidth and client rendering work.

How it improves gameplay:

Lower bandwidth means smoother movement and fewer lag spikes.

How it improves network:

It reduces packet size and prevents unnecessary updates.

### Rate limiting and backpressure

Where it appears:

- HTTP route rate limits
- WebSocket message rate limits
- client socket buffered amount checks
- server socket backlog checks

How it works:

The system limits how many requests/messages a client can send and avoids sending too much data to overloaded sockets.

Why this works:

It prevents one client or bad connection from overwhelming the server.

Why use this instead of accepting all messages:

Accepting unlimited messages can cause memory growth, lag, abuse, or server crashes.

How it improves gameplay:

The game remains playable for everyone even if one client has a poor network or sends too much input.

How it improves network:

It reduces congestion and avoids sending snapshots faster than a client can receive them.

### Persistence and fault tolerance

Where it appears:

- PostgreSQL persistence
- JSON local fallback
- production fail-fast behavior
- safe account upserts

How it works:

The production server uses external PostgreSQL. If Postgres is missing in production, the server refuses to start.

Why this works:

It prevents accidental temporary storage. A broken database configuration is detected immediately.

Why use fail-fast instead of silent fallback:

Silent fallback makes the game appear online but accounts look reset. Fail-fast makes the deployment visibly broken so it can be fixed before players lose trust.

How it improves gameplay:

Players keep their progress after redeploys.

## 5. Gameplay Systems Explained

### Hive movement

How:

The player sends directional input. The server calculates movement based on speed, radius, boost state, and delta time.

Why this works:

The player only sends intent. The server controls actual movement.

Why use this:

It prevents speed hacks and keeps movement fair.

Gameplay improvement:

Boosting gives players an escape/chase tool while still costing score.

### Worker behavior

How:

Workers follow either harvest logic or raid logic. In harvest mode they collect nearby food/growth nodes. In raid mode they move toward commanded targets and attack enemies.

Why this works:

Workers are semi-autonomous but still guided by the player. This creates strategy without requiring the player to micromanage every worker.

Why use semi-autonomous workers:

Fully manual workers would be too hard to control. Fully automatic workers would remove player skill. Semi-autonomous control balances accessibility and strategy.

Gameplay improvement:

Players can focus on positioning, timing, splitting, merging, and attacking.

### Worker speed balance

How:

Workers now have a higher base speed than before. Their speed decreases as they grow larger. Shift-boosting the hive also boosts worker speed.

Why this works:

Small workers feel lively and responsive, while huge workers remain powerful but catchable.

Why use size-based speed:

Without speed penalty, huge workers would dominate. With too much penalty, growth would feel bad. The current curve rewards growth but keeps counterplay.

Gameplay improvement:

Worker movement feels smoother and more fun, while enemy players still have ways to escape or fight back.

### Worker merge and split

How:

Merging combines two workers into one larger worker. Splitting divides one larger worker into smaller, faster workers with bounce movement.

Why this works:

It gives players tactical choices: one strong worker or multiple fast workers.

Why use both merge and split:

Merge supports power and durability. Split supports mobility, coverage, and recovery.

Gameplay improvement:

The player can adapt to harvesting, escaping, chasing, or combat.

### Card buff system

How:

At certain run levels, players choose one of three card buffs. Buffs have rarity tiers.

Why this works:

Choice creates replayability. Players can build different strategies in different runs.

Why use in-match card levels instead of permanent account-only buffs:

Permanent buffs can make new players feel hopeless. In-match buffs reset the competitive power curve while still making each match interesting.

Gameplay improvement:

Matches feel different and players have meaningful progression during play.

### Custom rooms

How:

Players can create custom rooms with adjustable settings like max players, food target, map size, score goal, and damage multipliers.

Why this works:

Custom rooms reuse the same server simulation but with room-specific configuration.

Why use room settings instead of hardcoding one arena:

Different groups may want faster, slower, smaller, or larger matches.

Gameplay improvement:

Players can test balance, host private/custom matches, and experiment.

## 6. Network Systems Explained

### Input packets

How:

The client sends compact input packets: movement direction, boost, hatch, merge, split, attack, pointer position, and input sequence.

Why this works:

Input packets are smaller than sending complete client state.

Why send input instead of position:

Sending position would allow cheating. Sending input lets the server decide the real position.

Network improvement:

Smaller packets reduce bandwidth and make frequent updates cheaper.

### Snapshot sequence and packet loss display

How:

The server includes snapshot sequence numbers. The client compares sequence gaps to estimate incoming loss.

Why this works:

Sequence numbers reveal whether expected snapshots were skipped.

Why use per-room sequence numbers:

Global sequence numbers caused custom rooms to look like they had packet loss when other rooms updated. Per-room sequences make the metric accurate.

Network improvement:

The diagnostics now reflect the player's actual room instead of unrelated server activity.

### Ping and jitter

How:

The client sends ping messages and measures round-trip time. Jitter is estimated from timing variation.

Why this works:

Ping measures latency. Jitter measures stability.

Why show both:

Low ping with high jitter can still feel bad. Players and testers need both values to understand network feel.

Network improvement:

The HUD helps identify whether lag is from distance, instability, packet loss, or server update rate.

### Interpolation

How:

The client smooths received positions instead of snapping instantly to each server snapshot.

Why this works:

Network updates arrive at discrete times, but rendering happens every animation frame. Interpolation bridges the gaps.

Why use interpolation instead of raw snapshot positions:

Raw snapshots can look jittery, especially with latency variation.

Gameplay improvement:

Movement appears smoother even when snapshots arrive slightly unevenly.

## 7. Why These Technologies Were Chosen

### Node.js

Chosen because:

- It handles many socket connections well.
- It has simple HTTP and WebSocket support.
- The project can keep server and client logic in JavaScript.
- Railway deployment is straightforward.

Not chosen:

- Java or C++ could be faster for heavy simulation, but would increase complexity.
- PHP is not ideal for persistent WebSocket game loops.

### WebSocket `ws`

Chosen because:

- It is lightweight.
- It gives direct control over messages.
- It supports persistent low-overhead communication.

Not chosen:

- Socket.IO has more features but adds protocol overhead.
- HTTP polling is simpler but less responsive for live gameplay.

### PostgreSQL

Chosen because:

- It is durable.
- It works well on Railway.
- It supports structured account and ban data.
- It survives redeploys.

Not chosen:

- JSON files are not reliable for production redeploys.
- In-memory storage disappears on restart.

### Vanilla HTML/CSS/JS

Chosen because:

- It keeps the project simple and inspectable.
- It avoids framework build complexity.
- It is enough for this style of Canvas-based game.

Not chosen:

- React/Vue would help with complex UI, but the main game is Canvas-rendered.
- A large frontend framework would add weight without solving the core game-loop problem.

## 8. Performance Evidence to Discuss

Use these metrics in defense:

- Ping in milliseconds
- Jitter in milliseconds
- Snapshot rate
- Packet in percentage
- Packet out percentage
- Online player count
- Room count
- Server heap and RSS memory from admin/network diagnostics
- Smoke test results

What to say:

The system was tested through automated smoke tests covering authentication, join, spectate, custom room movement, and admin routes. Runtime telemetry is displayed in the HUD, allowing live observation of ping, jitter, snapshots, packet loss, and online players.

Before improvements:

- Custom rooms could appear frozen because room timing used shared timing.
- Packet loss could look high because sequence numbers were global across rooms.
- Browser zoom could affect perceived game zoom.
- JSON persistence could reset accounts after redeploys.

After improvements:

- Rooms use per-room timing.
- Packet telemetry uses room-local snapshot sequence.
- Browser zoom is handled more safely.
- Production requires PostgreSQL and fails fast if it is not connected.

## 9. Defense Questions and Answers

### How does the game stay fair?

The server is authoritative. Clients send input, not final positions or damage. The server computes movement, combat, score, health, cards, and deaths.

### Why does the game use WebSockets?

WebSockets keep a persistent two-way connection, which is better for real-time movement than repeated HTTP requests.

### Why not just use HTTP requests?

HTTP requests add overhead and are not ideal for frequent real-time updates. Polling would increase delay and bandwidth.

### How does the system improve network smoothness?

It uses compact input packets, server snapshots, interpolation, interest management, WebSocket backpressure checks, and room-local sequencing.

### How does the system avoid account reset after deployment?

Production uses Railway PostgreSQL through `DATABASE_URL`. If Postgres is missing, the server stops instead of using temporary JSON storage.

### Why are custom rooms useful?

They allow different game settings without changing the core code. This supports testing, private games, and different player preferences.

### Why use run-based buffs?

Run-based buffs keep matches fresh without making permanent account power unfair. Players still make strategic choices each match.

### How does worker speed balance improve gameplay?

Small workers feel responsive and fun. Big workers are stronger but slower, creating counterplay. Shift boosting now also helps workers, making swarm movement more satisfying.

### What is the distributed part of the system?

Each browser is a separate client node. The server coordinates all clients and stores persistent data in a separate PostgreSQL service.

### What is the parallel part of the system?

The server handles many clients concurrently through the Node.js event loop. Multiple clients render independently while the server updates shared room states.

## 10. Suggested Defense Script

Start with:

Colony.io is a real-time multiplayer browser game. The main challenge is synchronizing many players, workers, resources, and combat actions while keeping the game fair and smooth.

Then explain:

The system uses a client-server architecture. The client handles input and rendering, while the server is authoritative. Clients send inputs through WebSockets, and the server broadcasts snapshots back to them.

Then connect to PDC:

This applies distributed computing because many browser clients connect to one server and share a live arena. It applies parallel/concurrent computing because the server handles many simultaneous socket events through Node.js, while each client independently renders the game.

Then justify:

WebSockets were chosen because the game needs frequent low-latency updates. PostgreSQL was chosen because production account data must survive Railway redeploys. Canvas was chosen because the game has many moving visual objects.

Then conclude:

These choices improve gameplay by making movement smoother, combat fairer, custom rooms reliable, and account progress persistent.

## 11. Files to Mention During Defense

- `server.js`: server simulation, WebSocket handling, rooms, persistence, security, snapshots
- `public/client.js`: input, rendering, interpolation, HUD, audio, network display
- `public/index.html`: UI structure and menus
- `public/styles.css`: visual design and responsive layout
- `database/schema.sql`: PostgreSQL account and ban schema
- `scripts/smoke-test.js`: automated smoke testing
- `railway.toml`: Railway health check and deployment settings
- `Dockerfile`: production container setup

## 12. Key Takeaways

- The server is authoritative for fairness.
- WebSockets are used for real-time communication.
- Room-local simulation prevents custom rooms from freezing.
- Snapshot filtering reduces bandwidth.
- Interpolation improves visual smoothness.
- PostgreSQL prevents production account resets.
- Runtime network telemetry helps debug live gameplay.
- The system is designed to be playable, explainable, and deployable.
