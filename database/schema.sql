CREATE TABLE IF NOT EXISTS colony_accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_algo TEXT NOT NULL DEFAULT 'scrypt',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  owned_skins JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_skin TEXT NOT NULL,
  total_matches INTEGER NOT NULL DEFAULT 0,
  total_kills INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'player',
  created_at BIGINT NOT NULL,
  last_seen_at BIGINT NOT NULL,
  banned_at BIGINT NULL,
  ban_reason TEXT NULL
);

CREATE INDEX IF NOT EXISTS colony_accounts_username_idx ON colony_accounts (lower(username));
CREATE INDEX IF NOT EXISTS colony_accounts_role_idx ON colony_accounts (role);
CREATE INDEX IF NOT EXISTS colony_accounts_banned_idx ON colony_accounts (banned_at);

CREATE TABLE IF NOT EXISTS colony_banned_guests (
  guest_name TEXT PRIMARY KEY,
  banned_at BIGINT NOT NULL DEFAULT 0
);
