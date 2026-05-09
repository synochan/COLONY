# Colony.io v1.1.0 Patch Notes

Colony.io v1.1.0 focuses on smoother combat, clearer HUD feedback, better custom games, and more reliable live multiplayer.

## Gameplay

- Added run-based card buff choices with Uncommon, Rare, Epic, and Legendary rarities.
- Added Legendary card choices at major run milestones.
- Worker merging now combines worker size, making merged workers visibly larger and stronger.
- Added HP bars below workers for clearer combat readability.
- Improved worker movement speed, growth pacing, splitting, hatch bounce, and food collision behavior.
- Workers now move faster than before and gain a stronger speed boost while the hive is Shift-boosting.
- Large workers still slow down from size so combat stays readable and every hive remains killable.
- Workers can now eat food more reliably while moving through it.
- Workers can eat large green growth circles once they are big enough.
- Hive eliminations now steal part of the defeated hive's score.
- Added kill sounds and kill streak support.
- Increased round target to 20,000 score.
- Expanded the map for larger matches and improved random spawn placement.

## Network & Multiplayer

- Improved live snapshot handling for smoother movement and lower perceived jitter.
- Fixed custom games where players could appear unable to move.
- Added per-room simulation timing so public and custom games update correctly.
- Reduced false packet-loss readings in custom rooms.
- Added network HUD stats for ping, jitter, snapshot rate, packet in/out, online players, and build version.
- Improved room cleanup when rooms are empty.

## Custom Games

- Added custom game support with configurable room settings.
- Custom rooms can tune player count, food amount, growth circles, score goal, map size, food value, growth value, hive damage, and worker damage.
- Public Arena now automatically joins an available arena and only creates a new public lobby when needed.
- Improved custom game dropdown styling and room selection consistency.

## UI & HUD

- Added a Patch Notes button and in-menu patch notes card.
- Added cleaner in-game enemy HP, level, and card display.
- Added active buff icons with hover descriptions.
- Improved active buff HUD layout so icons stay compact and readable.
- Moved network stats into the bottom-right HUD.
- Improved How To Play, leaderboard, logout, options, and general HUD layout.
- Improved UI behavior at default 100% browser zoom.
- Added Colony.io branding icons and favicon assets.

## Audio & Spectating

- Added music, sound effects, volume controls, mute, and low graphics options.
- Added spectate mode for watching matches while dead or without joining the arena.

## Deployment

- Added build versioning for development and production deployments.
- Added PostgreSQL-backed account persistence when `DATABASE_URL` is configured.
- Added local JSON fallback for development.
- Added automated smoke tests for auth, joining, spectating, custom room movement, and core routes.
