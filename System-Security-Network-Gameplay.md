# COLONY System, Security, Gameplay, and Network Notes

## Overview

COLONY is a real-time multiplayer browser game built with:

- `Node.js` on the server
- `ws` for WebSocket networking
- vanilla `HTML`, `CSS`, and `JavaScript` on the client
- `Canvas` rendering for the game view
- JSON file persistence for account storage

The system is split into three main layers:

1. `server.js`
   Handles accounts, sessions, gameplay simulation, moderation, round flow, and snapshot broadcasting.
2. `public/client.js`
   Handles input, rendering, interpolation, menus, settings, audio, and network telemetry.
3. `public/admin.html` + `public/admin.js`
   Provides the separate admin dashboard UI for moderation and live inspection.

---

## Security Measures

### 1. Account persistence is not pushed to Git

Live account data is stored in `data/accounts.json`, and that file is intentionally ignored by Git. This prevents publishing real account records, salts, hashes, bans, and progression data.

### 2. Admin access is environment-based

Admin seeding only happens when:

- `ADMIN_USERNAME` is set
- `ADMIN_PASSWORD` is set
- the admin password is strong enough

There is no public hardcoded default admin login in the repo.

### 3. Stronger password storage

The server now supports:

- legacy SHA-256 salted password verification for old accounts
- stronger `scrypt` hashing for newer accounts
- automatic hash upgrade on successful login for legacy accounts

This means existing users still work, while the system gradually migrates them to the stronger scheme.

### 4. HTTP hardening headers

The server applies security headers to JSON and static file responses, including:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: same-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `Permissions-Policy` restrictions

These reduce framing risks, content-type abuse, and cross-origin leakage.

### 5. Request body limits

The server rejects oversized POST bodies with a hard cap. This helps protect against:

- accidental payload abuse
- memory spikes
- basic body-flood attempts

### 6. Route rate limiting

In-memory rate limiting is enforced for:

- auth routes
- admin action routes
- join/spectate and other state-changing writes

This helps reduce brute-force attempts, spam joins, and admin action abuse.

### 7. WebSocket hardening

The WebSocket server now uses:

- `perMessageDeflate: false`
- explicit `maxPayload` limits
- heartbeat pings to terminate dead sockets
- per-socket message rate limiting
- stale socket cleanup on reconnect

This reduces both latency overhead and abuse surface.

### 8. Reconnect-safe socket cleanup

A stale socket bug could previously remove a live player if an older connection closed after a reconnect. The server now only removes players or spectators if the closing socket is still the active socket for that entity.

### 9. Session cleanup

Sessions are pruned on an interval using a TTL window. This keeps the in-memory session table from growing forever and removes stale spectator sessions safely.

### 10. Admin-only moderation is server-enforced

Admin actions are not just hidden in the UI. The server validates admin identity before allowing:

- kicks
- bans
- unbans
- resets
- freeze/heal/score actions
- round management

---

## Gameplay Model

### Core loop

Each match is built around:

- moving your hive with `WASD`
- spawning workers with `Space`
- merging workers with `Q`
- splitting workers with `F`
- directing raid behavior with `Left Click`
- boosting with `Shift`

Players gain score, eggs, growth, and match XP by:

- consuming food
- consuming growth nodes
- killing workers
- collapsing enemy hives

### Hive progression

There are two progression tracks:

1. Account progression
   Used for persistent unlocks such as skins.
2. Match progression
   Used for temporary in-run card buffs.

Card rewards are earned during the run and do not permanently stack on the account.

### Worker behavior

Workers operate in two broad modes:

- `harvest`
- `raid`

In harvest mode they seek food and valid growth nodes within command range.

In raid mode they:

- follow player intent
- attack enemies within command scope
- can still consume food or growth nodes they physically pass through when appropriate

### Range and command model

Workers are restricted by command range. This means:

- harvest targets are command-scoped
- raid movement is clamped back into command range
- worker control stays readable and fair

### Balance protections

The current design includes several anti-snowball protections:

- spawn grace after respawn
- capped score steal from hive collapse
- controlled worker kill rewards
- card progression limited to match runs
- admin powers isolated to admin-only flows

---

## Networking Model

### Server simulation

The game simulation runs on a fixed tick:

- `TICK_RATE = 30`

This controls:

- player movement
- worker behavior
- combat
- harvesting
- growth
- round-state transitions

### Broadcast layer

The server broadcasts state separately from the simulation:

- `BROADCAST_RATE = 24`

This keeps the game responsive without sending the full world at simulation frequency.

### Snapshot design

Each outbound state packet includes:

- a snapshot `sequence`
- `serverTime`
- round/config metadata
- visible players
- viewer-scoped resources when needed
- partial profile/leaderboard data when needed
- input acknowledgements for the controlling player

The server avoids sending every resource on every tick. Instead, resources are:

- filtered to what the viewer should see
- refreshed on version changes or movement/interval conditions

### Client smoothing

The client does not render raw snapshots directly. It keeps:

- a live snapshot
- a smoothed render snapshot

It then interpolates between values like:

- hive position
- worker position
- health
- radius
- command target

This reduces visible jitter and makes movement feel steadier online.

### Input flow

Client input is:

- throttled
- deduplicated
- sequence-numbered
- acknowledged by the server

The server sends back `ackInputSeq`, which the client uses to estimate outbound trouble and smooth network telemetry.

### Ping and telemetry

The client tracks:

- `Ping`
- `Jitter`
- snapshot rate
- inbound loss estimate
- outbound pressure/loss estimate
- online player count

This is useful both for live debugging and for understanding whether lag is caused by:

- physical latency
- packet timing instability
- local backlog pressure

---

## Admin and Moderation Model

### In-game admin panel

When an admin account joins the arena, an in-game admin HUD becomes available for quick testing and live controls.

### Standalone admin dashboard

The separate `/admin` page provides:

- server/network metrics
- live player management
- account management
- banned guest management

### Moderation actions currently supported

- kick player
- ban player
- ban account
- ban guest name
- unban account
- unban guest
- kick account sessions
- kick guest sessions
- freeze/unfreeze player
- respawn/collapse player
- test/build actions for admin testing

All of these are validated on the server side.

---

## Data Flow

### Login/register flow

1. Client sends auth request.
2. Server validates payload and rate limits.
3. Server verifies or creates the account.
4. Server issues a session token.
5. Client stores the auth token locally.

### Join flow

1. Client calls `/join`.
2. Server validates session, bans, room size, and duplicate-join rules.
3. Server creates a live player state.
4. Client opens a WebSocket with `playerId`.
5. Server starts sending snapshots.

### Spectate flow

1. Client calls `/spectate`.
2. Server creates a spectator session.
3. Client opens a WebSocket with `spectatorId`.
4. Server streams viewer-safe state.

### Card flow

1. Player gains match XP.
2. Server unlocks pending card choices at reward levels.
3. Client shows the card overlay.
4. Player picks one card.
5. Server validates the choice and applies the buff to the live run.

---

## Current Reliability Improvements Already Applied

The latest stabilization pass specifically added:

- stronger password hashing with legacy migration
- HTTP security headers
- POST body size limits
- request rate limiting for auth/admin/write flows
- WebSocket payload limits
- WebSocket per-socket message rate limiting
- reconnect-safe player/spectator socket cleanup
- session pruning
- safer snapshot-rate telemetry smoothing on the client

---

## Operational Recommendations

### Deployment

For live deployment, use:

- Railway for the main Node/WebSocket server
- a persistent volume for account storage

Set:

- `DATA_DIR=/data`

and mount a volume at:

- `/data`

### Admin safety

Always configure:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

in environment variables, never in source control.

### Hosting region

To reduce real ping, deploy the server as close as possible to the player base. Client smoothing helps with perceived smoothness, but physical distance still matters.

---

## Remaining Practical Limits

The system is much safer and smoother now, but some constraints still exist:

- account storage is still JSON-file based, not a full database
- in-memory rate limiting resets on server restart
- WebSocket multiplayer still depends on host region for true latency
- very large scale would eventually benefit from PostgreSQL/Redis and a more formal auth/session store

---

## Suggested Next Steps

If you want to keep hardening the project further, the highest-value next upgrades would be:

1. Move accounts and bans from JSON to PostgreSQL.
2. Add structured server logging and security audit logs.
3. Add CSRF-style protections if a broader browser-admin surface is introduced.
4. Add matchmaking or region-aware room hosting if you expand beyond one live arena.
5. Add automated smoke tests for auth, join, spectate, and admin routes.
