# Colony.io Demo Guide and PDC Explanation

This guide is made for a live project demo. It explains what to show, what to say, and how each feature connects to Parallel and Distributed Computing concepts.

## 1. Demo Goal

The goal of the demo is to show that Colony.io is not only a browser game, but a real-time distributed system.

During the demo, emphasize these points:

- Multiple browser clients connect to one authoritative server.
- Each client sends player intent, not final game results.
- The server computes the shared world state.
- The server broadcasts state snapshots to all connected players and spectators.
- Clients render the world independently using Canvas.
- Network conditions such as ping and backlog affect perceived smoothness.

## 2. Tech Stack and What Powers The Project

### Core Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | HTML, CSS, JavaScript | Main browser interface, menus, HUD, input handling, and rendering |
| Rendering | HTML5 Canvas | Fast real-time drawing of hives, workers, food, effects, map, and HUD |
| Backend | Node.js | Game server, HTTP routes, sessions, matchmaking, room state, and game simulation |
| Realtime networking | `ws` WebSocket library | Persistent low-latency connection for player input and server snapshots |
| Persistence | PostgreSQL on Railway or JSON fallback locally | Accounts, skins, roles, progression, and bans |
| Deployment | Docker / Railway-style hosting | Always-on server deployment with health checks |
| Local runtime | npm scripts | Start server and run smoke tests |

### What Powers The Game Generally

Colony.io is powered by a server-authoritative realtime loop.

The browser powers:

- Main menu and authentication UI.
- Canvas rendering.
- Keyboard and mouse input.
- Audio effects and music.
- Client-side interpolation and camera movement.
- Ping display and HUD.

The Node.js server powers:

- Account and guest sessions.
- Public arena matchmaking.
- Private room code creation and lookup.
- Spectator sessions.
- Authoritative movement and combat.
- Worker AI and resource collection.
- Card rewards and run-level buffs.
- Snapshot broadcasting.
- Network backpressure handling.

The database powers:

- Persistent accounts.
- Roles and admin status.
- XP and level progression.
- Owned skins.
- Selected skin.
- Banned guests/accounts.

## 3. Important Files

| File | Role |
| --- | --- |
| `server.js` | Main backend server, game simulation, rooms, WebSockets, authentication, admin actions, snapshots |
| `public/client.js` | Frontend game logic, input, rendering, HUD, WebSocket client, audio, menus |
| `public/index.html` | Browser UI structure |
| `public/styles.css` | Menu, HUD, admin, settings, and responsive styling |
| `scripts/smoke-test.js` | Automated smoke test for auth, join, spectate, custom room movement, and admin routes |
| `database/schema.sql` | Reference PostgreSQL schema |
| `railway.toml` | Railway deployment configuration |
| `Dockerfile` | Container deployment setup |
| `README.md` | General setup and project overview |
| `PDC-Learning-Materials.md` | Detailed PDC defense notes |
| `System-Security-Network-Gameplay.md` | Security, network, and gameplay architecture notes |

## 4. Key Features To Mention

- Real-time multiplayer arena.
- Server-authoritative gameplay.
- Guest and account play.
- Persistent account progression.
- Unlockable skins.
- Worker hatching, merging, splitting, harvesting, and raiding.
- Run-based card buffs.
- Public matchmaking.
- Private custom rooms with 5-character invite codes.
- Spectator mode.
- Admin dashboard and admin actions.
- Network ping display.
- Snapshot backpressure control.
- PostgreSQL production persistence.
- Local JSON fallback for development.

## 5. Network Settings and Configurations

These are the important networking/game-loop values to explain in a demo.

| Setting | Current Role |
| --- | --- |
| `TICK_RATE` | How often the server updates gameplay simulation |
| `BROADCAST_RATE` | How often the server attempts to send snapshots to clients |
| `MAX_WS_PAYLOAD_BYTES` | Maximum accepted WebSocket message size |
| `MAX_INPUT_MESSAGES_PER_WINDOW` | Input/message rate-limit protection |
| `INPUT_RATE_WINDOW_MS` | Time window used for WebSocket message rate limiting |
| `SOCKET_HEARTBEAT_INTERVAL_MS` | Server heartbeat interval used to detect dead sockets |
| `SOFT_SOCKET_BACKLOG_BYTES` | Soft queue limit; server skips snapshots when a client falls behind |
| `MAX_SOCKET_BACKLOG_BYTES` | Hard queue limit; server closes badly backed-up sockets |
| `RESOURCE_REFRESH_INTERVAL` | Controls how often resources are force-refreshed in snapshots |
| `LEADERBOARD_REFRESH_INTERVAL` | Controls leaderboard refresh frequency |
| `RECENT_EVENTS_INTERVAL` | Controls recent event delivery interval |

### Why These Settings Matter

Real-time games should prioritize fresh data.

If a client cannot receive snapshots fast enough, old snapshots become useless. Showing the player old positions creates lag. The server therefore skips snapshots when the socket queue grows too much. This keeps gameplay closer to the newest server state.

### Current Network Behavior

- Clients send player input through WebSocket.
- Server replies to small ping messages with pong messages.
- Server broadcasts snapshots at a fixed broadcast interval.
- Clients interpolate between snapshots for smoother rendering.
- Server skips snapshots if socket backlog grows.
- Server closes connections that become too backed up.

## 6. Backend Flow

### Join Flow

1. Browser sends `/join` HTTP request.
2. Server validates session and CSRF token.
3. Server resolves target room.
4. If public mode, server joins an available public arena.
5. If private custom mode, server either creates a room with a 5-character code or joins by code.
6. Server creates a player entity.
7. Server returns `playerId`, room info, profile info, and CSRF token.
8. Browser opens a WebSocket using `playerId`.
9. Server attaches the socket to that player.
10. Server starts sending state snapshots.

### Input Flow

1. Player presses keys or moves/clicks mouse.
2. Browser creates an input packet.
3. Browser sends intent through WebSocket.
4. Server validates and stores the input.
5. Game loop applies movement/combat/resource rules.
6. Snapshot loop broadcasts updated state.
7. Browser renders the new state.

### Snapshot Flow

1. Server builds a room snapshot.
2. Snapshot includes relevant players, workers, resources, leaderboard, round state, and profile data when needed.
3. Server checks socket backlog before sending.
4. If the socket is healthy, server sends the snapshot.
5. If the socket is behind, server skips the snapshot.
6. Client receives snapshot and merges it into local render state.
7. Client interpolates movement to look smooth.

### Spectator Flow

1. Browser sends `/spectate`.
2. Server creates a spectator session.
3. Browser opens WebSocket using `spectatorId`.
4. Server sends snapshots without accepting gameplay input.
5. Client focuses camera on an active player.

### Private Room Code Flow

1. Player selects Private Custom.
2. If no code is entered, server creates a new custom room.
3. Server generates a unique 5-character room code.
4. Player can share that code.
5. Another player enters the code.
6. Server resolves the code to the existing room.
7. Both clients join the same room state.

## 7. Frontend Flow

The frontend does four major jobs:

1. Collect input.
2. Communicate with the server.
3. Render the game.
4. Present UI and HUD information.

Important frontend systems:

- `joinGame()` handles player join requests.
- `startSpectating()` handles spectator mode.
- `connectSocket()` opens the WebSocket.
- `sendInput()` sends gameplay intent.
- `sendPing()` and `handlePong()` measure app-level WebSocket latency.
- `mergeIncomingSnapshot()` merges partial snapshots.
- `reconcileRenderSnapshot()` smooths render state.
- `drawFrame()` runs the client render loop.
- `renderOverlay()` draws game HUD overlays.

## 8. Database and Persistence

Production uses PostgreSQL when `DATABASE_URL` is configured.

Persistence stores:

- Username.
- Password hash and salt.
- XP and level.
- Owned skins.
- Selected skin.
- Role/admin flag.
- Banned guests.

Why PostgreSQL:

- Persistent after redeploys.
- More reliable than temporary in-memory state.
- Better for accounts and moderation.
- Fits deployment platforms like Railway.

Why local JSON fallback exists:

- Easier local development.
- Does not require a database just to test gameplay.

In production, PostgreSQL is required by default so account progress does not silently reset.

## 9. Security and Fairness Key Points

- Server-authoritative gameplay prevents client-side cheating.
- CSRF tokens protect state-changing HTTP requests.
- Passwords are hashed and salted.
- Sessions identify players and spectators.
- Admin actions require admin role validation.
- WebSocket messages are rate-limited.
- Socket payload size is capped.
- Banned accounts and guests are blocked.
- Stale reconnecting sockets are safely replaced.

## 10. Performance Key Points

- Canvas is used instead of DOM objects for arena rendering.
- Server snapshots are compact and filtered.
- Resources are not always fully resent every frame.
- Leaderboard and recent events refresh on intervals.
- Clients interpolate state for smooth visuals.
- Backpressure handling prevents stale snapshot queues.
- Broadcast rate is tuned to balance smoothness and bandwidth.
- Each room has separate state to avoid one global overloaded arena.

## 11. Quick Demo Flow

### Step 1: Open The Game

Show the main menu.

What to say:

Colony.io starts in the browser. The browser is the client node. It handles UI, input, rendering, audio, and camera movement, but it does not own the real game state.

PDC concept:

This shows a distributed client-server architecture. Each browser is a distributed endpoint, while the server coordinates the shared arena.

### Step 2: Continue As Guest Or Log In

Use a guest profile for a fast demo, or log in if you want to show persistent progression.

What to say:

Accounts and guests create sessions. The server uses the session to identify who is joining, spectating, or selecting skins/cards.

PDC concept:

This demonstrates session management in a distributed system. The browser and server need a shared identity token so requests and WebSocket connections belong to the correct user.

### Step 3: Join The Public Arena

Click Play Public Arena.

What to show:

- The player spawns.
- Workers appear.
- Food and growth nodes are visible.
- The HUD updates with score, health, run level, workers, eggs, cooldowns, and round target.

What to say:

When the player joins, the server creates a player entity in a room. The client opens a WebSocket. The player sends inputs like movement direction, boost, hatch, merge, split, and attack. The server updates the authoritative world and broadcasts snapshots back.

PDC concept:

This demonstrates real-time synchronization. The server is the single source of truth, and clients continuously receive synchronized state snapshots.

### Step 4: Demonstrate Movement And Workers

Use:

- `WASD` to move.
- `Space` to hatch workers.
- `Q` to merge workers.
- `F` to split workers.
- Left click to raid/direct workers.

What to say:

The client sends intent packets. It does not directly decide where the hive or workers end up. The server calculates movement, worker behavior, food collection, damage, cooldowns, and score.

PDC concept:

This is server-authoritative simulation. It prevents cheating and keeps all clients consistent even though each browser renders locally.

### Step 5: Show Custom Private Room Codes

Switch to Private Custom, create a room, and show the 5-character room code.

What to say:

Private rooms are separate room states on the server. A short code points other players to that room. This allows isolated simulations with different settings.

PDC concept:

This demonstrates room-based partitioning. Instead of one global state for everyone, the server separates work into independent room states. That improves organization, scalability, and fairness.

### Step 6: Join By Private Code

Open another browser tab or another device, enter the private room code, and join.

What to say:

Both clients are now connected to the same room state. Each browser renders independently, but both are receiving updates from the same authoritative server simulation.

PDC concept:

This demonstrates distributed clients observing a shared state. The server coordinates consistency across different devices.

### Step 7: Spectate

Click Spectate or use another client as a spectator.

What to say:

Spectators receive snapshots too, but they do not send gameplay input. They are read-only clients watching the same server state.

PDC concept:

This demonstrates different roles in a distributed system. Player clients produce input and consume state; spectator clients mainly consume state.

## 12. Architecture Explanation

### Client Side

Main files:

- `public/index.html`
- `public/styles.css`
- `public/client.js`

Responsibilities:

- Display menus and settings.
- Capture keyboard and mouse input.
- Send input packets through WebSocket.
- Receive state snapshots.
- Smooth movement visually.
- Render the game using Canvas.
- Show HUD information such as score, health, ping, buffs, and room code.

Why this matters:

The client is optimized for responsiveness and rendering. It performs local visual work, but it does not make final gameplay decisions.

### Server Side

Main file:

- `server.js`

Responsibilities:

- Manage sessions, accounts, guests, rooms, and spectators.
- Run the authoritative game loop.
- Update players, workers, food, growth nodes, combat, cards, score, and rounds.
- Validate and apply player input.
- Broadcast snapshots to connected clients.
- Control network backpressure so slow clients do not build up too much stale data.

Why this matters:

The server keeps the game fair and consistent. If two players collide or fight, the server decides the result once and sends that result to everyone.

## 13. PDC Concepts Used

### Distributed System

Colony.io is distributed because the game runs across multiple machines or processes:

- Browser client 1
- Browser client 2
- Spectator browser
- Node.js game server
- Database service

Each part has a role and communicates through network messages.

### Client-Server Architecture

The browser is the client. The Node.js app is the server. Clients request sessions and rooms through HTTP, then use WebSockets for live gameplay.

This is useful because:

- The server has authority.
- Clients stay lightweight.
- Multiple clients can share the same world.
- The server can reject invalid inputs.

### Server-Authoritative Simulation

The server computes:

- Movement
- Worker behavior
- Food pickup
- Combat
- Health
- Score
- Card rewards
- Round state

The client only sends intent. For example, pressing `W` means "I want to move up." It does not mean "my final position is here."

This prevents cheating and avoids inconsistent world states.

### Parallel Work

Several tasks happen at the same time:

- Clients render their own screens.
- The server updates game state on a tick loop.
- The server broadcasts snapshots on a broadcast loop.
- Browsers send input packets.
- Admin dashboards and spectators may receive updates.
- Database operations save account/progression data.

This is not parallel CPU computation in the traditional matrix-processing sense, but it is concurrent distributed work across clients, server loops, sockets, and persistence.

### Room-Based Partitioning

Each room has its own:

- Players
- Spectators
- Food
- Growth nodes
- Round state
- Custom configuration

This partitions the workload. A private room can run separately from the public arena.

### State Synchronization

The server sends snapshots to clients. A snapshot is a compact representation of the current room state.

Clients use snapshots to render:

- Hive positions
- Worker positions
- Food and growth nodes
- Health bars
- Leaderboard
- Round status
- Spectator focus

The client smooths movement between snapshots to make motion look less jumpy.

### Backpressure Handling

If the server sends data faster than a client can receive it, the socket queue grows. That means the client may receive old snapshots late.

To reduce this, the server skips snapshots when a socket backlog becomes too large. This is better than sending stale data because real-time games need the newest state, not every old state.

## 14. Why Ping Goes Up And Down

Ping is the time it takes for a message to go from the client to the server and back.

In Colony.io, ping is measured using WebSocket ping-style messages:

1. The browser sends a small ping message.
2. The server immediately replies with a pong message.
3. The browser calculates the round-trip time.

Ping can go up and down for several reasons.

### 1. Real Network Distance

If the server is far away from the player, packets take longer to travel.

Example:

- Player near the server: lower ping.
- Player far from the server: higher ping.

### 2. Wi-Fi Or ISP Conditions

Wireless networks can be unstable. Ping may jump when:

- Wi-Fi signal is weak.
- Other people are using the same network.
- The router is busy.
- The ISP route changes.

### 3. Server Load

If the server is updating many players, workers, food, combat events, and rooms, it may take longer to process messages.

Even if the network path is fine, app-level ping can rise when the server event loop is busy.

### 4. Browser Main Thread Load

The browser has to:

- Render Canvas frames.
- Process WebSocket messages.
- Run UI code.
- Play audio.
- Handle input.

If the browser is busy, the pong may arrive but not be processed immediately. This makes the measured ping look higher.

### 5. Snapshot Backlog

In real-time games, the server sends frequent state snapshots. If the connection or browser cannot keep up, snapshots can queue.

When this happens:

- The client receives older data late.
- Ping/pong messages may wait behind snapshot messages.
- Movement feels delayed.
- The displayed ping can climb to 300ms or more.

This is why the server now skips snapshots when a socket has too much queued data. A real-time game should prefer fresh state over old state.

### 6. Refresh And Reconnect Effects

After refreshing the page, the browser is busy loading assets, creating the canvas, starting audio state, opening WebSocket, receiving the first snapshot, and rendering the menu/game.

During that moment, the first ping sample can be higher than normal. The client smooths ping using recent samples so one bad startup sample does not permanently poison the display.

## 15. How To Explain Ping During The Demo

Simple explanation:

Ping is not a fixed number. It changes because the game is distributed over a network. Packets must travel from the browser to the server and back, and both the browser and server must be ready to process them.

Better defense answer:

Ping variation comes from network latency, browser scheduling, server event-loop pressure, and WebSocket backpressure. In a real-time multiplayer system, high ping is not only a network issue; it can also mean that the client or server is temporarily overloaded or that snapshots are queued. The project handles this by smoothing ping display and by limiting socket backlog so stale snapshots do not create long delays.

## 16. What To Emphasize In A PDC Defense

If asked why this project is related to PDC, answer with:

Colony.io is a real-time distributed multiplayer system. It has multiple client nodes connected to a central authoritative server. The server runs concurrent room simulations and broadcasts synchronized state over WebSockets. The clients render in parallel on separate machines, while the server coordinates consistency, fairness, and network backpressure.

Key terms to mention:

- Distributed clients
- Server-authoritative simulation
- WebSocket communication
- Concurrent event loop
- State synchronization
- Room partitioning
- Snapshot broadcasting
- Backpressure handling
- Latency and ping variability

## 17. Demo Checklist

Before presenting:

- Start the server.
- Open at least two browser tabs or devices.
- Prepare one guest/player account.
- Test public arena join.
- Test private room creation and room code join.
- Test spectate.
- Move, hatch, split, merge, and attack.
- Watch ping and explain that it may fluctuate.

During the demo:

- Show that two clients see the same arena.
- Explain that the server owns the true state.
- Show that private rooms are separate room states.
- Show spectator mode as a read-only distributed client.
- Mention why old snapshots are skipped when the network backs up.

## 18. Short Presentation Script

Colony.io is a browser-based real-time multiplayer game. Each browser acts as a client in a distributed system. The client sends input intent through WebSockets, and the Node.js server runs the authoritative simulation. The server updates players, workers, resources, combat, and score, then broadcasts snapshots back to all players and spectators.

This project applies PDC concepts because many clients operate at the same time while sharing one synchronized world. The server uses room-based partitioning so public and private games can run separately. It also handles backpressure by avoiding stale snapshot queues, which is important because real-time games need fresh state more than old messages.

Ping goes up and down because this is a live networked system. The value depends on network distance, Wi-Fi quality, browser workload, server workload, and whether messages are queued. If snapshots build up, gameplay can feel delayed, so the server limits backlog and skips old snapshots to keep the game responsive.
