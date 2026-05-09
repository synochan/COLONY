const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");
const packageInfo = require("./package.json");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const SERVER_REGION = String(process.env.SERVER_REGION || "singapore").trim().toLowerCase() || "singapore";
const DEPLOY_CHANNEL = String(process.env.DEPLOY_CHANNEL || (process.env.NODE_ENV === "production" ? "production" : "development"))
  .trim()
  .toLowerCase();
const APP_VERSION = String(process.env.APP_VERSION || packageInfo.version || "0.0.0").trim();
const BUILD_SHA = String(process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "").trim().slice(0, 12);
const RELEASE_LABEL = `${APP_VERSION}-${DEPLOY_CHANNEL}${BUILD_SHA ? `+${BUILD_SHA}` : ""}`;
const REQUIRE_POSTGRES =
  process.env.REQUIRE_POSTGRES === "1" ||
  (process.env.NODE_ENV === "production" && process.env.ALLOW_JSON_FALLBACK !== "1");
const IMPORT_JSON_TO_POSTGRES = process.env.IMPORT_JSON_TO_POSTGRES === "1";
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_SEED_ENABLED = Boolean(ADMIN_USERNAME && ADMIN_PASSWORD);
let isShuttingDown = false;

const MAP_WIDTH = 8200;
const MAP_HEIGHT = 5200;
const FOOD_TARGET = 720;
const GROWTH_NODE_TARGET = 42;
const TICK_RATE = 30;
const BROADCAST_RATE = 24;
const MAX_PLAYERS = 30;
const MIN_PLAYERS = 2;
const INPUT_TIMEOUT_MS = 5000;
const ROUND_SCORE_TARGET = 20000;
const LEADERBOARD_SIZE = 15;
const ROUND_END_DELAY_MS = 6500;
const SPAWN_GRACE_MS = 2500;

const PLAYER_BASE_RADIUS = 24;
const PLAYER_MAX_RADIUS_BONUS = 22;
const PLAYER_BASE_SPEED = 240;
const PLAYER_MIN_SPEED = 152;
const BOOST_BONUS = 88;
const BOOST_SCORE_COST_PER_SECOND = 19;
const PLAYER_BASE_HEALTH = 120;
const PLAYER_MAX_HEALTH_BONUS = 70;
const PLAYER_HEALTH_REGEN = 5;
const COMMAND_RANGE_BASE = 220;
const COMMAND_RANGE_BONUS = 320;
const EGG_COST = 1;
const EGG_SCORE_STEP = 80;
const MAX_EGGS = 5;
const MAX_WORKERS = 10;
const MERGE_COOLDOWN_MS = 4200;
const SPLIT_COOLDOWN_MS = 2600;
const MERGE_BONUS_FOOD = 8;
const ACCOUNT_XP_PER_LEVEL = 140;
const MATCH_XP_PER_LEVEL = 320;
const MAX_LEVEL = 50;
const HIVE_ATTACK_KNOCKBACK = 16;
const HIVE_ATTACK_KNOCKBACK_LIMIT = 34;

const WORKER_BASE_RADIUS = 8;
const WORKER_MAX_RADIUS_BONUS = 14;
const WORKER_BASE_SPEED = 214;
const WORKER_MIN_SPEED = 104;
const WORKER_AGGRO_RADIUS = 200;
const WORKER_HARVEST_RADIUS = 190;
const WORKER_HEALTH_REGEN = 3;
const GROWTH_NODE_HEAL_FACTOR = 0.42;
const WORKER_GROWTH_GAIN_MULTIPLIER = 1.16;
const WORKER_SPLIT_MIN_FOOD = 14;
const WORKER_SPLIT_FOOD_LOSS = 2;
const WORKER_HATCH_SPAWN_DISTANCE = 84;
const WORKER_HATCH_BOUNCE_SPEED = 148;
const WORKER_SPLIT_BOUNCE_SPEED = 176;
const WORKER_BOOST_SPEED_BONUS_PCT = 0.12;
const WORKER_SOLIDITY_PADDING = 3;
const WORKER_SOLIDITY_STRENGTH = 0.72;
const WORKER_SOLIDITY_ITERATIONS = 3;
const WORKER_PICKOFF_SCORE_REWARD = 12;
const COLONY_KILL_SCORE_REWARD = 58;
const HIVE_SCORE_STEAL_PCT = 0.42;
const HIVE_SCORE_STEAL_MIN = 30;
const HIVE_SCORE_STEAL_CAP = 780;
const MAX_SOCKET_BACKLOG_BYTES = 256 * 1024;
const MAX_HTTP_BODY_BYTES = 16 * 1024;
const MAX_WS_PAYLOAD_BYTES = 8 * 1024;
const MAX_INPUT_MESSAGES_PER_WINDOW = 240;
const INPUT_RATE_WINDOW_MS = 1000;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const SESSION_CLEANUP_INTERVAL_MS = 1000 * 60 * 10;
const AUTH_RATE_LIMIT_WINDOW_MS = 1000 * 60 * 5;
const AUTH_RATE_LIMIT_MAX = 30;
const ADMIN_RATE_LIMIT_WINDOW_MS = 1000 * 60;
const ADMIN_RATE_LIMIT_MAX = 80;
const WRITE_RATE_LIMIT_WINDOW_MS = 1000 * 60;
const WRITE_RATE_LIMIT_MAX = 45;
const LOGS_DIR = path.join(DATA_DIR, "logs");
const SERVER_LOG_FILE = path.join(LOGS_DIR, "server.log");
const AUDIT_LOG_FILE = path.join(LOGS_DIR, "audit.log");
const ENABLE_STRUCTURED_LOGS = process.env.ENABLE_STRUCTURED_LOGS !== "0";
const ROOM_IDLE_TTL_MS = 1000 * 60;
const RESOURCE_VIEW_PADDING = 1150;
const RECENT_EVENTS_INTERVAL = 4;
const RESOURCE_REFRESH_INTERVAL = 18;
const LEADERBOARD_REFRESH_INTERVAL = 6;
const SOCKET_HEARTBEAT_INTERVAL_MS = 25000;
const ADMIN_STARTING_SCORE = 12000;
const ADMIN_MIN_WORKERS = 8;

const STARTER_SKINS = ["ember", "tide", "moss"];
const LEVEL_SKIN_UNLOCKS = [
  { level: 5, skinId: "royal" },
  { level: 10, skinId: "frost" },
  { level: 20, skinId: "obsidian" },
  { level: 30, skinId: "rose" },
  { level: 40, skinId: "solar" },
  { level: 50, skinId: "void" }
];
const CARD_REWARD_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const CARD_REWARD_RARITIES = {
  5: "uncommon",
  10: "rare",
  15: "epic",
  20: "legendary",
  25: "rare",
  30: "epic",
  35: "legendary",
  40: "rare",
  45: "epic",
  50: "legendary"
};

const CARD_LIBRARY = {
  "trailblazer-legs": {
    id: "trailblazer-legs",
    title: "Trailblazer Legs",
    rarity: "uncommon",
    description: "Workers move 10% faster while harvesting and raiding.",
    modifiers: {
      workerSpeedBonusPct: 0.1
    }
  },
  "tempered-stingers": {
    id: "tempered-stingers",
    title: "Tempered Stingers",
    rarity: "uncommon",
    description: "Workers deal 10% more damage.",
    modifiers: {
      workerDamageBonusPct: 0.1
    }
  },
  "resin-shell": {
    id: "resin-shell",
    title: "Resin Shell",
    rarity: "uncommon",
    description: "Your hive gains 10% more max health.",
    modifiers: {
      playerHealthBonusPct: 0.1
    }
  },
  "forager-instinct": {
    id: "forager-instinct",
    title: "Forager Instinct",
    rarity: "uncommon",
    description: "Gain 8% more score and XP from every source.",
    modifiers: {
      scoreGainBonusPct: 0.08
    }
  },
  "quick-brood": {
    id: "quick-brood",
    title: "Quick Brood",
    rarity: "uncommon",
    description: "Eggs fill 10% faster and your hive stores 1 extra egg.",
    modifiers: {
      eggStepReductionPct: 0.1,
      maxEggsBonus: 1
    }
  },
  "queen-plate": {
    id: "queen-plate",
    title: "Queen Plate",
    rarity: "rare",
    description: "Your hive gains 12% max health, 30% more regen, and less knockback.",
    modifiers: {
      playerHealthBonusPct: 0.12,
      playerRegenBonusPct: 0.3,
      knockbackTakenReductionPct: 0.2
    }
  },
  "rally-pheromones": {
    id: "rally-pheromones",
    title: "Rally Pheromones",
    rarity: "rare",
    description: "Command range grows 12% and raiding workers move 10% faster.",
    modifiers: {
      commandRangeBonusPct: 0.12,
      raidSpeedBonusPct: 0.1
    }
  },
  "rich-spore-vault": {
    id: "rich-spore-vault",
    title: "Rich Spore Vault",
    rarity: "rare",
    description: "Gain 12% more score and XP, and eggs fill 10% faster.",
    modifiers: {
      scoreGainBonusPct: 0.12,
      eggStepReductionPct: 0.1
    }
  },
  "nurse-lineage": {
    id: "nurse-lineage",
    title: "Nurse Lineage",
    rarity: "rare",
    description: "Workers gain 14% more health and hatch with bonus nourishment.",
    modifiers: {
      workerHealthBonusPct: 0.14,
      newWorkerFoodBonus: 8
    }
  },
  "spearhead-drill": {
    id: "spearhead-drill",
    title: "Spearhead Drill",
    rarity: "rare",
    description: "Workers deal 16% more hive damage and reach 8% farther.",
    modifiers: {
      coreDamageBonusPct: 0.16,
      workerReachBonusPct: 0.08
    }
  },
  "swarm-foundry": {
    id: "swarm-foundry",
    title: "Swarm Foundry",
    rarity: "epic",
    description: "Your hive commands 1 extra worker and workers gain 10% more health.",
    modifiers: {
      maxWorkersBonus: 1,
      workerHealthBonusPct: 0.1
    }
  },
  "war-hymn": {
    id: "war-hymn",
    title: "War Hymn",
    rarity: "epic",
    description: "Workers deal 15% more damage and raid 12% faster.",
    modifiers: {
      workerDamageBonusPct: 0.15,
      raidSpeedBonusPct: 0.12
    }
  },
  "overcharged-glands": {
    id: "overcharged-glands",
    title: "Overcharged Glands",
    rarity: "epic",
    description: "Your hive moves 6% faster, gains 10% more score and XP, and commands farther.",
    modifiers: {
      playerSpeedBonusPct: 0.06,
      scoreGainBonusPct: 0.1,
      commandRangeBonusPct: 0.15
    }
  },
  "royal-jelly-reserve": {
    id: "royal-jelly-reserve",
    title: "Royal Jelly Reserve",
    rarity: "epic",
    description: "Your hive stores 1 extra egg, fills eggs 15% faster, and new workers hatch stronger.",
    modifiers: {
      maxEggsBonus: 1,
      eggStepReductionPct: 0.15,
      newWorkerFoodBonus: 12
    }
  },
  "shockframe-carapace": {
    id: "shockframe-carapace",
    title: "Shockframe Carapace",
    rarity: "epic",
    description: "Your hive gains 18% health, 25% regen, and heavy knockback resistance.",
    modifiers: {
      playerHealthBonusPct: 0.18,
      playerRegenBonusPct: 0.25,
      knockbackTakenReductionPct: 0.35
    }
  },
  "monarchs-decree": {
    id: "monarchs-decree",
    title: "Monarch's Decree",
    rarity: "legendary",
    description: "Your hive commands 2 extra workers, stores 1 extra egg, and extends its command reach.",
    modifiers: {
      maxWorkersBonus: 2,
      maxEggsBonus: 1,
      commandRangeBonusPct: 0.1
    }
  },
  "worldroot-heart": {
    id: "worldroot-heart",
    title: "Worldroot Heart",
    rarity: "legendary",
    description: "Your hive gains 24% health, 50% regen, and shrugs off most knockback.",
    modifiers: {
      playerHealthBonusPct: 0.24,
      playerRegenBonusPct: 0.5,
      knockbackTakenReductionPct: 0.55
    }
  },
  "cataclysm-brood": {
    id: "cataclysm-brood",
    title: "Cataclysm Brood",
    rarity: "legendary",
    description: "Workers deal 22% more damage, 22% more hive damage, and reach farther.",
    modifiers: {
      workerDamageBonusPct: 0.22,
      coreDamageBonusPct: 0.22,
      workerReachBonusPct: 0.12
    }
  },
  "golden-symphony": {
    id: "golden-symphony",
    title: "Golden Symphony",
    rarity: "legendary",
    description: "Gain 18% more score and XP, fill eggs 18% faster, and move your hive faster.",
    modifiers: {
      scoreGainBonusPct: 0.18,
      eggStepReductionPct: 0.18,
      playerSpeedBonusPct: 0.08
    }
  },
  "apex-signal": {
    id: "apex-signal",
    title: "Apex Signal",
    rarity: "legendary",
    description: "Workers gain all-around combat speed, health, and command support.",
    modifiers: {
      workerSpeedBonusPct: 0.14,
      raidSpeedBonusPct: 0.14,
      workerHealthBonusPct: 0.14,
      commandRangeBonusPct: 0.12
    }
  }
};

const CARD_IDS_BY_RARITY = Object.values(CARD_LIBRARY).reduce((groups, card) => {
  groups[card.rarity] = groups[card.rarity] || [];
  groups[card.rarity].push(card.id);
  return groups;
}, {});

const SKIN_LIBRARY = {
  ember: { id: "ember", name: "Ember Scout", primary: "#ff9f43" },
  tide: { id: "tide", name: "Tide Runner", primary: "#54a0ff" },
  moss: { id: "moss", name: "Moss Crown", primary: "#1dd1a1" },
  royal: { id: "royal", name: "Royal Bloom", primary: "#8d7dff" },
  frost: { id: "frost", name: "Frost Veil", primary: "#98e7ff" },
  obsidian: { id: "obsidian", name: "Obsidian Maw", primary: "#5d6175" },
  rose: { id: "rose", name: "Rose Thorn", primary: "#ff6ea8" },
  solar: { id: "solar", name: "Solar Flare", primary: "#ffd166" },
  void: { id: "void", name: "Void Monarch", primary: "#9a6bff" }
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const securityResponseHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'"
};

const ROOM_REGIONS = [SERVER_REGION];

function roomConfigDefaults() {
  return {
    mapWidth: MAP_WIDTH,
    mapHeight: MAP_HEIGHT,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    foodTarget: FOOD_TARGET,
    growthNodeTarget: GROWTH_NODE_TARGET,
    roundScoreTarget: ROUND_SCORE_TARGET,
    foodValueMultiplier: 1,
    growthValueMultiplier: 1,
    hiveDamageMultiplier: 1,
    workerDamageMultiplier: 1
  };
}

function createRoomState(roomId, roomName, region, mode = "public", config = roomConfigDefaults()) {
  return {
    id: roomId,
    name: roomName,
    code: roomId,
    region,
    mode,
    config: { ...roomConfigDefaults(), ...config },
    players: new Map(),
    spectators: new Map(),
    foods: [],
    growthNodes: [],
    resourcesVersion: 1,
    leaderboardVersion: 1,
    profileVersion: 1,
    events: [],
    nextEventId: 1,
    broadcastSequence: 0,
    lastTickAt: Date.now(),
    lastActiveAt: Date.now(),
    round: {
      number: 1,
      status: "running",
      winnerPlayerId: null,
      winnerName: "",
      reason: "",
      countdownEndsAt: 0
    }
  };
}

let state = null;
const rooms = new Map();
const playerRoomIndex = new Map();
const spectatorRoomIndex = new Map();

const sessions = new Map();
const requestRateLimits = new Map();
let saveTimer = null;
let broadcastSequence = 0;
let accountStore = { accounts: [], bannedGuests: [] };
let persistence = null;

function currentRoomConfig() {
  return state?.config || roomConfigDefaults();
}

function currentMapWidth() {
  return currentRoomConfig().mapWidth;
}

function currentMapHeight() {
  return currentRoomConfig().mapHeight;
}

function withRoomState(room, callback) {
  const previousState = state;
  state = room?.state || room || null;
  try {
    return callback();
  } finally {
    state = previousState;
  }
}

function roomDisplayName(roomState) {
  if (!roomState) {
    return "Unknown Room";
  }
  return roomState.mode === "custom" ? roomState.name || "Custom Room" : "Public Arena";
}

function normalizeRoomRegion(region) {
  const normalized = String(region || SERVER_REGION).trim().toLowerCase();
  return ROOM_REGIONS.includes(normalized) ? normalized : SERVER_REGION;
}

function clampRoomSetting(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return clamp(Math.round(numeric), min, max);
}

function clampRoomFactor(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return clamp(numeric, min, max);
}

function normalizeRoomConfig(rawConfig = {}, custom = false) {
  const defaults = roomConfigDefaults();
  const config = {
    mapWidth: clampRoomSetting(rawConfig.mapWidth, 2800, 12000, defaults.mapWidth),
    mapHeight: clampRoomSetting(rawConfig.mapHeight, 1800, 7200, defaults.mapHeight),
    minPlayers: defaults.minPlayers,
    maxPlayers: clampRoomSetting(rawConfig.maxPlayers, 2, 50, custom ? 16 : defaults.maxPlayers),
    foodTarget: clampRoomSetting(rawConfig.foodTarget, 80, 1600, custom ? 480 : defaults.foodTarget),
    growthNodeTarget: clampRoomSetting(rawConfig.growthNodeTarget, 4, 120, custom ? 24 : defaults.growthNodeTarget),
    roundScoreTarget: clampRoomSetting(rawConfig.roundScoreTarget, 3000, 50000, custom ? 12000 : defaults.roundScoreTarget),
    foodValueMultiplier: clampRoomFactor(rawConfig.foodValueMultiplier, 0.5, 3, 1),
    growthValueMultiplier: clampRoomFactor(rawConfig.growthValueMultiplier, 0.5, 3, 1),
    hiveDamageMultiplier: clampRoomFactor(rawConfig.hiveDamageMultiplier, 0.5, 3, 1),
    workerDamageMultiplier: clampRoomFactor(rawConfig.workerDamageMultiplier, 0.5, 3, 1)
  };
  return config;
}

function generateRoomId(prefix = "room") {
  return `${prefix}_${crypto.randomBytes(4).toString("hex")}`;
}

function createRoom({
  roomId = generateRoomId("room"),
  name = "",
  region = SERVER_REGION,
  mode = "public",
  config = roomConfigDefaults()
} = {}) {
  const normalizedRegion = normalizeRoomRegion(region);
  const normalizedConfig = normalizeRoomConfig(config, mode === "custom");
  const roomName = mode === "custom" ? String(name || "Custom Colony").slice(0, 28) : "Public Arena";
  const roomState = createRoomState(roomId, roomName, normalizedRegion, mode, normalizedConfig);
  const room = {
    id: roomId,
    state: roomState,
    createdAt: Date.now()
  };
  rooms.set(roomId, room);
  return room;
}

function getRoomById(roomId) {
  return roomId ? rooms.get(String(roomId).trim()) || null : null;
}

function ensurePublicArenaRoom(region = SERVER_REGION) {
  const normalizedRegion = normalizeRoomRegion(region);
  const candidates = Array.from(rooms.values())
    .filter((room) => room.state.mode === "public" && room.state.region === normalizedRegion)
    .sort((left, right) => left.state.players.size - right.state.players.size);
  const room = candidates.find((entry) => entry.state.players.size < entry.state.config.maxPlayers);
  if (room) {
    return room;
  }
  return createRoom({
    roomId: generateRoomId(`arena_${normalizedRegion}`),
    region: normalizedRegion,
    mode: "public",
    config: roomConfigDefaults()
  });
}

function ensureMatchmakingRoom(region = SERVER_REGION) {
  return ensurePublicArenaRoom(region);
}

function allRoomStates() {
  return Array.from(rooms.values()).map((room) => room.state);
}

function findPlayerRoom(playerId) {
  const roomId = playerRoomIndex.get(playerId);
  if (!roomId) {
    return null;
  }
  const room = rooms.get(roomId);
  if (!room) {
    playerRoomIndex.delete(playerId);
    return null;
  }
  const player = room.state.players.get(playerId);
  if (!player) {
    playerRoomIndex.delete(playerId);
    return null;
  }
  return { room, player };
}

function findSpectatorRoom(spectatorId) {
  const roomId = spectatorRoomIndex.get(spectatorId);
  if (!roomId) {
    return null;
  }
  const room = rooms.get(roomId);
  if (!room) {
    spectatorRoomIndex.delete(spectatorId);
    return null;
  }
  const spectator = room.state.spectators.get(spectatorId);
  if (!spectator) {
    spectatorRoomIndex.delete(spectatorId);
    return null;
  }
  return { room, spectator };
}

function findPlayerBySessionToken(sessionToken) {
  for (const room of rooms.values()) {
    for (const player of room.state.players.values()) {
      if (player.sessionToken === sessionToken) {
        return { room, player };
      }
    }
  }
  return null;
}

function allLivePlayers() {
  const players = [];
  for (const room of rooms.values()) {
    for (const player of room.state.players.values()) {
      players.push({ room, player });
    }
  }
  return players;
}

function roomSummary(roomState) {
  return {
    id: roomState.id,
    name: roomDisplayName(roomState),
    region: roomState.region,
    mode: roomState.mode,
    players: roomState.players.size,
    spectators: roomState.spectators.size,
    config: { ...roomState.config },
    round: {
      number: roomState.round.number,
      status: roomState.round.status
    }
  };
}

function versionPayload() {
  return {
    name: packageInfo.name || "colony-io",
    version: APP_VERSION,
    channel: DEPLOY_CHANNEL,
    label: RELEASE_LABEL,
    commit: BUILD_SHA,
    nodeEnv: process.env.NODE_ENV || "development",
    region: SERVER_REGION
  };
}

function pruneIdleRooms() {
  for (const [roomId, room] of rooms.entries()) {
    const empty = room.state.players.size === 0 && room.state.spectators.size === 0;
    if (!empty) {
      room.state.lastActiveAt = Date.now();
      continue;
    }
    if (Date.now() - (room.state.lastActiveAt || 0) >= ROOM_IDLE_TTL_MS) {
      rooms.delete(roomId);
    }
  }
  ensurePublicArenaRoom(SERVER_REGION);
}

function ensureAccountStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(LOGS_DIR, { recursive: true });

  if (!fs.existsSync(ACCOUNTS_FILE)) {
    fs.writeFileSync(
      ACCOUNTS_FILE,
      JSON.stringify(
        {
          accounts: [],
          bannedGuests: []
        },
        null,
        2
      )
    );
  }
}

function writeStructuredLog(filePath, entry) {
  if (!ENABLE_STRUCTURED_LOGS) {
    return;
  }

  try {
    fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`);
  } catch {}
}

function logStructured(level, event, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...meta
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
  writeStructuredLog(SERVER_LOG_FILE, entry);
}

function auditLog(action, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    action,
    ...meta
  };
  writeStructuredLog(AUDIT_LOG_FILE, entry);
  if (ENABLE_STRUCTURED_LOGS) {
    console.log(JSON.stringify({ level: "audit", event: action, ...entry }));
  }
}

function loadJsonAccountStore() {
  ensureAccountStore();

  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.accounts)) {
      return { accounts: [], bannedGuests: [] };
    }
    parsed.bannedGuests = Array.isArray(parsed.bannedGuests) ? parsed.bannedGuests : [];
    return parsed;
  } catch (error) {
    return { accounts: [], bannedGuests: [] };
  }
}

function createJsonPersistence() {
  return {
    mode: "json",
    async init() {
      ensureAccountStore();
    },
    async load() {
      return loadJsonAccountStore();
    },
    async save(store) {
      ensureAccountStore();
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(store, null, 2));
    }
  };
}

function createPostgresPersistence() {
  return {
    mode: "postgres",
    client: null,
    async init() {
      const { Client } = require("pg");
      this.client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSL === "1" ? { rejectUnauthorized: false } : undefined
      });
      await this.client.connect();
      await this.client.query(`
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
      `);
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS colony_banned_guests (
          guest_name TEXT PRIMARY KEY,
          banned_at BIGINT NOT NULL DEFAULT 0
        );
      `);
      await this.client.query(`CREATE INDEX IF NOT EXISTS colony_accounts_username_idx ON colony_accounts (lower(username));`);
      await this.client.query(`CREATE INDEX IF NOT EXISTS colony_accounts_role_idx ON colony_accounts (role);`);
      await this.client.query(`CREATE INDEX IF NOT EXISTS colony_accounts_banned_idx ON colony_accounts (banned_at);`);
    },
    async load() {
      const accountRows = await this.client.query(`
        SELECT id, username, salt, password_hash, password_algo, xp, level, owned_skins, selected_skin, total_matches, total_kills, role, created_at, last_seen_at, banned_at, ban_reason
        FROM colony_accounts
        ORDER BY created_at ASC
      `);
      const guestRows = await this.client.query(`
        SELECT guest_name FROM colony_banned_guests ORDER BY guest_name ASC
      `);
      return {
        accounts: accountRows.rows.map((row) => ({
          id: row.id,
          username: row.username,
          salt: row.salt,
          passwordHash: row.password_hash,
          passwordAlgo: row.password_algo || "scrypt",
          xp: Number(row.xp || 0),
          level: Number(row.level || 1),
          ownedSkins: Array.isArray(row.owned_skins) ? row.owned_skins : [],
          selectedSkin: row.selected_skin,
          totalMatches: Number(row.total_matches || 0),
          totalKills: Number(row.total_kills || 0),
          role: row.role || "player",
          createdAt: Number(row.created_at || Date.now()),
          lastSeenAt: Number(row.last_seen_at || Date.now()),
          bannedAt: row.banned_at ? Number(row.banned_at) : undefined,
          banReason: row.ban_reason || undefined
        })),
        bannedGuests: guestRows.rows.map((row) => String(row.guest_name || "").toLowerCase())
      };
    },
    async save(store) {
      const accounts = Array.isArray(store.accounts) ? store.accounts : [];
      const bannedGuests = Array.isArray(store.bannedGuests) ? store.bannedGuests : [];
      await this.client.query("BEGIN");
      try {
        if (!accounts.length) {
          const existingAccounts = await this.client.query("SELECT COUNT(*)::int AS count FROM colony_accounts");
          if (Number(existingAccounts.rows[0]?.count || 0) > 0 && process.env.ALLOW_EMPTY_POSTGRES_SAVE !== "1") {
            throw new Error("Refusing to replace existing Postgres accounts with an empty account store.");
          }
        }

        const accountIds = accounts.map((account) => account.id).filter(Boolean);
        const bannedGuestNames = bannedGuests.map((guestName) => String(guestName || "").toLowerCase()).filter(Boolean);

        for (const account of accounts) {
          await this.client.query(
            `
              INSERT INTO colony_accounts (
                id, username, salt, password_hash, password_algo, xp, level, owned_skins, selected_skin, total_matches, total_kills, role, created_at, last_seen_at, banned_at, ban_reason
              ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16
              )
              ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                salt = EXCLUDED.salt,
                password_hash = EXCLUDED.password_hash,
                password_algo = EXCLUDED.password_algo,
                xp = EXCLUDED.xp,
                level = EXCLUDED.level,
                owned_skins = EXCLUDED.owned_skins,
                selected_skin = EXCLUDED.selected_skin,
                total_matches = EXCLUDED.total_matches,
                total_kills = EXCLUDED.total_kills,
                role = EXCLUDED.role,
                created_at = EXCLUDED.created_at,
                last_seen_at = EXCLUDED.last_seen_at,
                banned_at = EXCLUDED.banned_at,
                ban_reason = EXCLUDED.ban_reason
            `,
            [
              account.id,
              account.username,
              account.salt,
              account.passwordHash,
              account.passwordAlgo || "scrypt",
              Number(account.xp || 0),
              Number(account.level || 1),
              JSON.stringify(account.ownedSkins || []),
              account.selectedSkin || STARTER_SKINS[0],
              Number(account.totalMatches || 0),
              Number(account.totalKills || 0),
              account.role || "player",
              Number(account.createdAt || Date.now()),
              Number(account.lastSeenAt || Date.now()),
              account.bannedAt ? Number(account.bannedAt) : null,
              account.banReason || null
            ]
          );
        }
        await this.client.query("DELETE FROM colony_accounts WHERE NOT (id = ANY($1::text[]))", [accountIds]);

        for (const guestName of bannedGuestNames) {
          await this.client.query(
            `
              INSERT INTO colony_banned_guests (guest_name, banned_at)
              VALUES ($1, $2)
              ON CONFLICT (guest_name) DO UPDATE SET banned_at = EXCLUDED.banned_at
            `,
            [guestName, Date.now()]
          );
        }
        await this.client.query("DELETE FROM colony_banned_guests WHERE NOT (guest_name = ANY($1::text[]))", [bannedGuestNames]);
        await this.client.query("COMMIT");
      } catch (error) {
        await this.client.query("ROLLBACK");
        throw error;
      }
    }
  };
}

async function initializePersistence() {
  ensureAccountStore();
  persistence = createJsonPersistence();
  if (process.env.DATABASE_URL) {
    try {
      const postgresPersistence = createPostgresPersistence();
      await postgresPersistence.init();
      persistence = postgresPersistence;
      logStructured("info", "persistence.postgres.ready");
    } catch (error) {
      logStructured("error", "persistence.postgres.failed", { message: error.message, requirePostgres: REQUIRE_POSTGRES });
      if (REQUIRE_POSTGRES) {
        throw error;
      }
      persistence = createJsonPersistence();
      await persistence.init();
    }
  } else if (REQUIRE_POSTGRES) {
    throw new Error("DATABASE_URL is required for this deployment, but it is not set.");
  } else {
    await persistence.init();
  }

  accountStore = await persistence.load();
  accountStore.accounts = Array.isArray(accountStore.accounts) ? accountStore.accounts : [];
  accountStore.bannedGuests = Array.isArray(accountStore.bannedGuests) ? accountStore.bannedGuests : [];
  if (persistence.mode === "postgres" && IMPORT_JSON_TO_POSTGRES && accountStore.accounts.length === 0) {
    const jsonStore = loadJsonAccountStore();
    const hasJsonData = Array.isArray(jsonStore.accounts) && jsonStore.accounts.length > 0;
    if (hasJsonData) {
      accountStore = jsonStore;
      accountStore.accounts = Array.isArray(accountStore.accounts) ? accountStore.accounts : [];
      accountStore.bannedGuests = Array.isArray(accountStore.bannedGuests) ? accountStore.bannedGuests : [];
      await persistence.save(accountStore);
      logStructured("info", "persistence.postgres.imported_json", { accounts: accountStore.accounts.length });
    }
  }
}

function scheduleAccountSave() {
  if (saveTimer) {
    return;
  }

  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try {
      await persistence.save(accountStore);
    } catch (error) {
      logStructured("error", "persistence.save.failed", { message: error.message });
    }
  }, 300);
}

async function flushAccountSaveNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  ensureAccountStore();
  await persistence.save(accountStore);
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString("hex")}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function bumpResourcesVersion() {
  state.resourcesVersion += 1;
}

function bumpLeaderboardVersion() {
  state.leaderboardVersion += 1;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(vectorX, vectorY) {
  const magnitude = Math.hypot(vectorX, vectorY) || 1;
  return { x: vectorX / magnitude, y: vectorY / magnitude };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function sampleUnique(list, count) {
  return shuffle(list).slice(0, Math.min(count, list.length));
}

function scoreFactor(score) {
  return Math.sqrt(Math.max(0, score));
}

function levelFromXp(xp) {
  return clamp(Math.floor((xp || 0) / ACCOUNT_XP_PER_LEVEL) + 1, 1, MAX_LEVEL);
}

function xpFloorForLevel(level) {
  return Math.max(0, (level - 1) * ACCOUNT_XP_PER_LEVEL);
}

function xpNeededForNextLevel(level) {
  if (level >= MAX_LEVEL) {
    return null;
  }
  return level * ACCOUNT_XP_PER_LEVEL;
}

function matchLevelFromXp(xp) {
  return clamp(Math.floor((xp || 0) / MATCH_XP_PER_LEVEL) + 1, 1, MAX_LEVEL);
}

function matchXpFloorForLevel(level) {
  return Math.max(0, (level - 1) * MATCH_XP_PER_LEVEL);
}

function matchXpNeededForNextLevel(level) {
  if (level >= MAX_LEVEL) {
    return null;
  }
  return level * MATCH_XP_PER_LEVEL;
}

function cardRewardRarityForLevel(level) {
  return CARD_REWARD_RARITIES[level] || "uncommon";
}

function summarizeCard(cardId) {
  const card = CARD_LIBRARY[cardId];
  if (!card) {
    return null;
  }

  return {
    id: card.id,
    title: card.title,
    rarity: card.rarity,
    description: card.description
  };
}

function createBuffState(cardIds) {
  const buffs = {
    activeCardIds: [],
    scoreGainBonusPct: 0,
    playerHealthBonusPct: 0,
    playerRegenBonusPct: 0,
    playerSpeedBonusPct: 0,
    commandRangeBonusPct: 0,
    eggStepReductionPct: 0,
    maxEggsBonus: 0,
    maxWorkersBonus: 0,
    workerHealthBonusPct: 0,
    workerDamageBonusPct: 0,
    workerSpeedBonusPct: 0,
    workerReachBonusPct: 0,
    coreDamageBonusPct: 0,
    raidSpeedBonusPct: 0,
    knockbackTakenReductionPct: 0,
    newWorkerFoodBonus: 0
  };

  for (const cardId of cardIds || []) {
    const card = CARD_LIBRARY[cardId];
    if (!card) {
      continue;
    }

    buffs.activeCardIds.push(cardId);
    for (const [key, value] of Object.entries(card.modifiers || {})) {
      buffs[key] = (buffs[key] || 0) + value;
    }
  }

  buffs.scoreGainBonusPct = Math.min(buffs.scoreGainBonusPct, 0.2);
  buffs.playerHealthBonusPct = Math.min(buffs.playerHealthBonusPct, 0.35);
  buffs.playerRegenBonusPct = Math.min(buffs.playerRegenBonusPct, 0.6);
  buffs.playerSpeedBonusPct = Math.min(buffs.playerSpeedBonusPct, 0.12);
  buffs.commandRangeBonusPct = Math.min(buffs.commandRangeBonusPct, 0.22);
  buffs.eggStepReductionPct = Math.min(buffs.eggStepReductionPct, 0.22);
  buffs.maxEggsBonus = Math.min(buffs.maxEggsBonus, 2);
  buffs.maxWorkersBonus = Math.min(buffs.maxWorkersBonus, 2);
  buffs.workerHealthBonusPct = Math.min(buffs.workerHealthBonusPct, 0.25);
  buffs.workerDamageBonusPct = Math.min(buffs.workerDamageBonusPct, 0.25);
  buffs.workerSpeedBonusPct = Math.min(buffs.workerSpeedBonusPct, 0.16);
  buffs.workerReachBonusPct = Math.min(buffs.workerReachBonusPct, 0.14);
  buffs.coreDamageBonusPct = Math.min(buffs.coreDamageBonusPct, 0.25);
  buffs.raidSpeedBonusPct = Math.min(buffs.raidSpeedBonusPct, 0.16);
  buffs.knockbackTakenReductionPct = Math.min(buffs.knockbackTakenReductionPct, 0.6);
  buffs.newWorkerFoodBonus = Math.min(buffs.newWorkerFoodBonus, 16);

  return buffs;
}

function playerRadiusForScore(score) {
  return PLAYER_BASE_RADIUS + Math.min(PLAYER_MAX_RADIUS_BONUS, scoreFactor(score) * 0.9);
}

function playerHealthCap(score, player) {
  const base = PLAYER_BASE_HEALTH + Math.min(PLAYER_MAX_HEALTH_BONUS, scoreFactor(score) * 3.2);
  return base * (1 + (player?.buffState?.playerHealthBonusPct || 0));
}

function playerCommandRange(score, player) {
  const base = COMMAND_RANGE_BASE + Math.min(COMMAND_RANGE_BONUS, scoreFactor(score) * 14);
  return base * (1 + (player?.buffState?.commandRangeBonusPct || 0));
}

function playerSpeedForRadius(radius, player) {
  const base = clamp(PLAYER_BASE_SPEED - (radius - PLAYER_BASE_RADIUS) * 3.8, PLAYER_MIN_SPEED, PLAYER_BASE_SPEED);
  return base * (1 + (player?.buffState?.playerSpeedBonusPct || 0));
}

function workerRadiusForFood(food) {
  return WORKER_BASE_RADIUS + Math.min(WORKER_MAX_RADIUS_BONUS, Math.sqrt(Math.max(0, food)) * 0.92);
}

function workerFoodForRadius(radius) {
  const growthRadius = clamp(radius - WORKER_BASE_RADIUS, 0, WORKER_MAX_RADIUS_BONUS);
  return Math.pow(growthRadius / 0.92, 2);
}

function workerSpeed(worker, owner) {
  const sizePenalty = Math.pow(Math.max(0, worker.radius - WORKER_BASE_RADIUS), 1.08) * 5.15;
  const base = clamp(WORKER_BASE_SPEED - sizePenalty, WORKER_MIN_SPEED, WORKER_BASE_SPEED);
  const workerSpeedBonus = owner?.buffState?.workerSpeedBonusPct || 0;
  const raidSpeedBonus = worker.mode === "raid" ? owner?.buffState?.raidSpeedBonusPct || 0 : 0;
  const boostSpeedBonus = owner?.isBoosting ? WORKER_BOOST_SPEED_BONUS_PCT : 0;
  return base * (1 + workerSpeedBonus + raidSpeedBonus + boostSpeedBonus);
}

function workerMaxHealth(worker, owner) {
  const base = 20 + worker.food * 1.35 + worker.radius * 1.8;
  return base * (1 + (owner?.buffState?.workerHealthBonusPct || 0));
}

function workerDamage(worker, owner) {
  const base = 9 + worker.radius * 0.6;
  return base * (1 + (owner?.buffState?.workerDamageBonusPct || 0)) * currentRoomConfig().workerDamageMultiplier;
}

function workerReach(worker, owner) {
  const base = 10 + worker.radius * 0.85;
  return base * (1 + (owner?.buffState?.workerReachBonusPct || 0));
}

function playerCoreDamage(worker, owner) {
  const base = 7 + worker.radius * 0.36 + scoreFactor(owner.score) * 0.12;
  return base * (1 + (owner?.buffState?.coreDamageBonusPct || 0)) * currentRoomConfig().hiveDamageMultiplier;
}

function attackReachForPlayer(player) {
  return 8 + Math.min(34, scoreFactor(player.score) * 1.2);
}

function eggScoreStepForPlayer(player) {
  return Math.max(40, EGG_SCORE_STEP * (1 - (player?.buffState?.eggStepReductionPct || 0)));
}

function maxEggsForPlayer(player) {
  return MAX_EGGS + (player?.buffState?.maxEggsBonus || 0);
}

function maxWorkersForPlayer(player) {
  return MAX_WORKERS + (player?.buffState?.maxWorkersBonus || 0);
}

function playerHealthRegen(player) {
  return PLAYER_HEALTH_REGEN * (1 + (player?.buffState?.playerRegenBonusPct || 0));
}

function scoreGainMultiplier(player) {
  return 1 + (player?.buffState?.scoreGainBonusPct || 0);
}

function workerAggroRadiusForPlayer(player) {
  return WORKER_AGGRO_RADIUS + Math.max(0, player.commandRange - COMMAND_RANGE_BASE) * 0.12;
}

function workerGrowthNodeRequirement(node) {
  return Math.max(15, node.requiredRadius * 0.5);
}

function spawnFood() {
  const config = currentRoomConfig();
  return {
    id: createId("food"),
    x: randomBetween(40, config.mapWidth - 40),
    y: randomBetween(40, config.mapHeight - 40),
    size: randomBetween(5, 11),
    value: randomBetween(6, 12) * config.foodValueMultiplier
  };
}

function spawnGrowthNode() {
  const coreRadius = randomBetween(11, 18);
  const ringRadius = coreRadius + randomBetween(12, 22);
  const config = currentRoomConfig();
  return {
    id: createId("growth"),
    x: randomBetween(ringRadius + 30, config.mapWidth - ringRadius - 30),
    y: randomBetween(ringRadius + 30, config.mapHeight - ringRadius - 30),
    coreRadius,
    ringRadius,
    value: randomBetween(110, 180) * config.growthValueMultiplier,
    requiredRadius: randomBetween(35, 43)
  };
}

function ensureFoodTarget() {
  if (state.round.status !== "running") {
    return;
  }
  let changed = false;
  while (state.foods.length < currentRoomConfig().foodTarget) {
    state.foods.push(spawnFood());
    changed = true;
  }
  if (changed) {
    bumpResourcesVersion();
  }
}

function ensureGrowthNodeTarget() {
  if (state.round.status !== "running") {
    return;
  }
  let changed = false;
  while (state.growthNodes.length < currentRoomConfig().growthNodeTarget) {
    state.growthNodes.push(spawnGrowthNode());
    changed = true;
  }
  if (changed) {
    bumpResourcesVersion();
  }
}

function pushEvent(type, payload) {
  state.events.push({
    id: state.nextEventId++,
    type,
    payload,
    at: Date.now()
  });

  if (state.events.length > 50) {
    state.events.shift();
  }
}

function hashLegacyPassword(password, salt) {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password || ""), String(salt || ""), 64).toString("hex");
}

function verifyPassword(password, account) {
  if (!account) {
    return false;
  }

  if (account.passwordAlgo === "scrypt") {
    return account.passwordHash === hashPassword(password, account.salt);
  }

  return account.passwordHash === hashLegacyPassword(password, account.salt);
}

function upgradePasswordHashIfNeeded(account, password) {
  if (!account || account.passwordAlgo === "scrypt") {
    return false;
  }

  account.passwordHash = hashPassword(password, account.salt);
  account.passwordAlgo = "scrypt";
  scheduleAccountSave();
  return true;
}

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 16);
}

function sanitizeGuestName(name) {
  const trimmed = String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 16);
  return trimmed || `Guest ${Math.floor(Math.random() * 900 + 100)}`;
}

function normalizeGuestName(name) {
  return sanitizeGuestName(name).toLowerCase();
}

function isAdminAccount(account) {
  return Boolean(account?.role === "admin");
}

function isAdminPlayer(player) {
  return Boolean(player?.isAdmin);
}

function isAdminGodMode(player) {
  return Boolean(isAdminPlayer(player) && player?.adminState?.godMode);
}

function isBannedAccount(account) {
  return Boolean(account?.bannedAt);
}

function isBannedGuestName(name) {
  return (accountStore.bannedGuests || []).includes(normalizeGuestName(name));
}

function isStarterSkin(skinId) {
  return STARTER_SKINS.includes(skinId);
}

function findAccountByUsername(username) {
  const lowered = normalizeUsername(username).toLowerCase();
  return accountStore.accounts.find((account) => account.username.toLowerCase() === lowered) || null;
}

function isStrongAdminPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

function ensureAdminAccount() {
  if (!ADMIN_SEED_ENABLED) {
    return;
  }

  const username = normalizeUsername(ADMIN_USERNAME);
  if (!username) {
    console.warn("[admin] ADMIN_USERNAME is set but invalid. Admin seeding skipped.");
    return;
  }

  if (!isStrongAdminPassword(ADMIN_PASSWORD)) {
    console.warn("[admin] ADMIN_PASSWORD must be at least 12 chars and include upper, lower, and number. Admin seeding skipped.");
    return;
  }

  let account = findAccountByUsername(username);
  if (!account) {
    const salt = crypto.randomBytes(8).toString("hex");
    account = {
      id: createId("acct"),
      username,
      salt,
      passwordHash: hashPassword(ADMIN_PASSWORD, salt),
      passwordAlgo: "scrypt",
      xp: xpFloorForLevel(MAX_LEVEL),
      level: MAX_LEVEL,
      ownedSkins: Object.keys(SKIN_LIBRARY),
      selectedSkin: "void",
      totalMatches: 0,
      totalKills: 0,
      role: "admin",
      createdAt: Date.now(),
      lastSeenAt: Date.now()
    };
    accountStore.accounts.push(account);
    console.log(`[admin] Created admin account "${username}" from environment configuration.`);
  } else {
    account.role = "admin";
  }

  applyLevelUnlocks(account);
  scheduleAccountSave();
}

function buildCardChoice(selectedCardIds, rewardLevel) {
  const rarity = cardRewardRarityForLevel(rewardLevel);
  const pool = CARD_IDS_BY_RARITY[rarity] || [];
  const reserved = new Set(selectedCardIds || []);
  const available = pool.filter((cardId) => !reserved.has(cardId));
  let options = sampleUnique(available, 3);

  if (options.length < 3) {
    const refill = pool.filter((cardId) => !options.includes(cardId));
    options = options.concat(sampleUnique(refill, 3 - options.length));
  }

  return {
    rewardLevel,
    rarity,
    options
  };
}

function applyLevelUnlocks(account) {
  const owned = new Set(Array.isArray(account.ownedSkins) ? account.ownedSkins : []);

  for (const skinId of STARTER_SKINS) {
    owned.add(skinId);
  }

  let level = levelFromXp(account.xp || 0);
  for (const unlock of LEVEL_SKIN_UNLOCKS) {
    if (level >= unlock.level) {
      owned.add(unlock.skinId);
    }
  }

  if (isAdminAccount(account)) {
    for (const skinId of Object.keys(SKIN_LIBRARY)) {
      owned.add(skinId);
    }
    account.xp = Math.max(account.xp || 0, xpFloorForLevel(MAX_LEVEL));
    level = levelFromXp(account.xp || 0);
  }

  account.level = level;
  account.ownedSkins = Array.from(owned);

  if (!account.selectedSkin || !account.ownedSkins.includes(account.selectedSkin)) {
    account.selectedSkin = STARTER_SKINS[0];
  }
}

function summarizeAccount(account) {
  applyLevelUnlocks(account);
  const level = account.level;
  const nextLevelXp = xpNeededForNextLevel(level);
  return {
    mode: "account",
    username: account.username,
    displayName: account.username,
    level,
    xp: Math.floor(account.xp || 0),
    xpIntoLevel: Math.floor((account.xp || 0) - xpFloorForLevel(level)),
    xpForNextLevel: nextLevelXp === null ? null : nextLevelXp - xpFloorForLevel(level),
    selectedSkin: account.selectedSkin,
    ownedSkins: account.ownedSkins,
    totalMatches: account.totalMatches || 0,
    totalKills: account.totalKills || 0,
    isAdmin: isAdminAccount(account),
    banned: isBannedAccount(account),
    activeCards: [],
    pendingCardChoices: [],
    nextCardRewardLevel: null,
    temporary: false
  };
}

function summarizeGuestSession(session) {
  return {
    mode: "guest",
    username: session.guestName,
    displayName: session.guestName,
    level: 1,
    xp: 0,
    xpIntoLevel: 0,
    xpForNextLevel: ACCOUNT_XP_PER_LEVEL,
    selectedSkin: session.selectedSkin,
    ownedSkins: STARTER_SKINS,
    totalMatches: 0,
    totalKills: 0,
    isAdmin: false,
    banned: isBannedGuestName(session.guestName),
    activeCards: [],
    pendingCardChoices: [],
    nextCardRewardLevel: 5,
    temporary: true
  };
}

function createSessionForAccount(account) {
  const token = createId("auth");
  sessions.set(token, {
    token,
    csrfToken: createId("csrf"),
    mode: "account",
    accountId: account.id,
    createdAt: Date.now()
  });
  return token;
}

function createGuestSession(guestName, selectedSkin) {
  const token = createId("guest");
  sessions.set(token, {
    token,
    csrfToken: createId("csrf"),
    mode: "guest",
    guestName,
    selectedSkin: isStarterSkin(selectedSkin) ? selectedSkin : STARTER_SKINS[0],
    createdAt: Date.now()
  });
  return token;
}

function pruneExpiredSessions() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [token, session] of sessions.entries()) {
    if ((session.createdAt || 0) < cutoff) {
      sessions.delete(token);
    }
  }

  for (const roomState of allRoomStates()) {
    for (const [spectatorId, spectator] of roomState.spectators.entries()) {
      if (!sessions.has(spectator.sessionToken)) {
        try {
          spectator.socket?.close(4003, "Session expired");
        } catch {}
        roomState.spectators.delete(spectatorId);
        spectatorRoomIndex.delete(spectatorId);
      }
    }
  }

  pruneIdleRooms();
}

function createSpectatorSession(session, roomId) {
  const room = getRoomById(roomId) || ensurePublicArenaRoom(SERVER_REGION);
  const spectator = {
    id: createId("spectator"),
    roomId: room.id,
    sessionToken: session.token,
    socket: null,
    createdAt: Date.now()
  };
  room.state.spectators.set(spectator.id, spectator);
  spectatorRoomIndex.set(spectator.id, room.id);
  return spectator;
}

function summarizePlayerPendingChoices(player) {
  return (player.pendingCardChoices || [])
    .map((choice) => ({
      rewardLevel: choice.rewardLevel,
      rarity: choice.rarity,
      options: choice.options.map(summarizeCard).filter(Boolean)
    }))
    .filter((choice) => choice.options.length === 3);
}

function nextPlayerCardRewardLevel(player) {
  return CARD_REWARD_LEVELS.find((rewardLevel) => rewardLevel > player.matchLevel && !player.claimedCardRewardLevels.includes(rewardLevel)) || null;
}

function syncPendingCardRewardsForPlayer(player) {
  const claimedLevels = new Set(player.claimedCardRewardLevels || []);
  const pendingLevels = new Set((player.pendingCardChoices || []).map((choice) => choice.rewardLevel));

  for (const rewardLevel of CARD_REWARD_LEVELS) {
    if (rewardLevel > player.matchLevel || claimedLevels.has(rewardLevel) || pendingLevels.has(rewardLevel)) {
      continue;
    }

    player.pendingCardChoices.push(buildCardChoice(player.activeCardIds, rewardLevel));
  }

  player.pendingCardChoices.sort((left, right) => left.rewardLevel - right.rewardLevel);
}

function grantMatchXp(player, amount) {
  if (amount <= 0) {
    return;
  }

  player.matchXp += amount;
  const nextLevel = matchLevelFromXp(player.matchXp);
  if (nextLevel > player.matchLevel) {
    player.matchLevel = nextLevel;
    syncPendingCardRewardsForPlayer(player);
  }
}

function getSessionByToken(token) {
  if (!token) {
    return null;
  }
  return sessions.get(token) || null;
}

function getAccountById(accountId) {
  return accountStore.accounts.find((account) => account.id === accountId) || null;
}

function buildProfileForSession(session) {
  if (!session) {
    return null;
  }

  if (session.mode === "guest") {
    return summarizeGuestSession(session);
  }

  const account = getAccountById(session.accountId);
  if (!account) {
    return null;
  }

  return summarizeAccount(account);
}

function sessionResponse(session) {
  return {
    csrfToken: session?.csrfToken || ""
  };
}

function adminAccountFromSession(session) {
  if (!session || session.mode !== "account") {
    return null;
  }

  const account = getAccountById(session.accountId);
  return isAdminAccount(account) ? account : null;
}

function requireAdminSession(request, response, payload) {
  const session = resolveSession(request, payload);
  const account = adminAccountFromSession(session);
  if (!session || !account) {
    sendJson(response, 403, { error: "Admin access required." });
    return null;
  }

  return { session, account };
}

function redactedAccountsPreview() {
  return accountStore.accounts.map((account) => ({
    id: account.id,
    username: account.username,
    role: account.role || "player",
    banned: isBannedAccount(account),
    bannedAt: account.bannedAt || 0,
    banReason: account.banReason || "",
    level: account.level || levelFromXp(account.xp || 0),
    xp: Math.floor(account.xp || 0),
    selectedSkin: account.selectedSkin || STARTER_SKINS[0],
    ownedSkins: Array.isArray(account.ownedSkins) ? account.ownedSkins.length : 0,
    totalMatches: account.totalMatches || 0,
    totalKills: account.totalKills || 0,
    createdAt: account.createdAt || 0,
    lastSeenAt: account.lastSeenAt || 0
  }));
}

function adminDashboardPayload() {
  const roomStates = allRoomStates();
  const players = [];
  for (const roomState of roomStates) {
    for (const player of roomState.players.values()) {
      players.push({
        id: player.id,
        name: player.name,
        accountId: player.accountId || null,
        mode: player.accountId ? "account" : "guest",
        roomId: roomState.id,
        roomName: roomDisplayName(roomState),
        region: roomState.region,
        isAdmin: Boolean(player.isAdmin),
        frozen: Boolean(player.adminFrozen),
        alive: player.alive,
        score: Math.round(player.score),
        level: player.matchLevel,
        workers: player.workers.length,
        health: Math.round(player.health),
        healthMax: Math.round(player.healthMax),
        socketBufferedBytes: player.socket?.bufferedAmount || 0,
        sessionToken: player.sessionToken
      });
    }
  }
  const totalPlayers = roomStates.reduce((sum, roomState) => sum + roomState.players.size, 0);
  const totalSpectators = roomStates.reduce((sum, roomState) => sum + roomState.spectators.size, 0);
  const totalFoods = roomStates.reduce((sum, roomState) => sum + roomState.foods.length, 0);
  const totalGrowth = roomStates.reduce((sum, roomState) => sum + roomState.growthNodes.length, 0);
  const totalEvents = roomStates.reduce((sum, roomState) => sum + roomState.events.length, 0);
  return {
    players: players.sort((left, right) => right.score - left.score),
    accounts: redactedAccountsPreview(),
    bannedGuests: [...(accountStore.bannedGuests || [])].sort(),
    rooms: roomStates.map(roomSummary).sort((left, right) => right.players - left.players),
    network: {
      version: versionPayload(),
      tickRate: TICK_RATE,
      broadcastRate: BROADCAST_RATE,
      onlinePlayers: totalPlayers,
      spectators: totalSpectators,
      sessions: sessions.size,
      rooms: roomStates.length,
      foods: totalFoods,
      growthNodes: totalGrowth,
      recentEvents: totalEvents,
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      uptimeSec: Math.round(process.uptime())
    }
  };
}

function parseAuthToken(request, payload) {
  const header = request.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  if (request.headers["x-auth-token"]) {
    return String(request.headers["x-auth-token"]).trim();
  }
  if (payload?.authToken) {
    return String(payload.authToken).trim();
  }
  return "";
}

function parseCsrfToken(request, payload) {
  const header = request.headers["x-csrf-token"];
  if (header) {
    return String(header).trim();
  }
  if (payload?.csrfToken) {
    return String(payload.csrfToken).trim();
  }
  return "";
}

function originAllowed(request) {
  const origin = String(request.headers.origin || "");
  if (!origin) {
    return true;
  }
  const host = String(request.headers.host || "");
  return origin === `http://${host}` || origin === `https://${host}`;
}

function requireCsrf(request, response, session, payload) {
  if (!session) {
    sendJson(response, 401, { error: "Session is no longer valid." });
    return false;
  }
  if (!originAllowed(request)) {
    sendJson(response, 403, { error: "Origin not allowed." });
    return false;
  }
  const token = parseCsrfToken(request, payload);
  if (!token || token !== session.csrfToken) {
    sendJson(response, 403, { error: "CSRF check failed." });
    return false;
  }
  return true;
}

function parseJsonSafe(rawBody) {
  try {
    return JSON.parse(rawBody);
  } catch (error) {
    return null;
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;
    request.on("data", (chunk) => {
      totalLength += chunk.length;
      if (totalLength > MAX_HTTP_BODY_BYTES) {
        reject(new Error("BODY_TOO_LARGE"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function applySecurityHeaders(headers = {}) {
  return {
    ...securityResponseHeaders,
    ...headers
  };
}

function publicRoomsPayload() {
  return allRoomStates()
    .map((roomState) => ({
      id: roomState.id,
      name: roomDisplayName(roomState),
      region: roomState.region,
      mode: roomState.mode === "matchmaking" ? "public" : roomState.mode,
      players: roomState.players.size,
      spectators: roomState.spectators.size,
      roundStatus: roomState.round.status,
      config: {
        maxPlayers: roomState.config.maxPlayers,
        roundScoreTarget: roomState.config.roundScoreTarget,
        foodTarget: roomState.config.foodTarget,
        growthNodeTarget: roomState.config.growthNodeTarget
      }
    }))
    .sort((left, right) => {
      if (left.mode !== right.mode) {
        return left.mode === "public" ? -1 : 1;
      }
      return right.players - left.players;
    });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(
    statusCode,
    applySecurityHeaders({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    })
  );
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  response.writeHead(
    statusCode,
    applySecurityHeaders({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    })
  );
  response.end(text);
}

function clientIpForRequest(request) {
  const forwarded = String(request.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwarded || request.socket?.remoteAddress || "unknown";
}

function consumeRateLimit(scope, identifier, windowMs, maxRequests) {
  const key = `${scope}:${identifier}`;
  const now = Date.now();
  const current = requestRateLimits.get(key);
  if (!current || current.resetAt <= now) {
    requestRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count += 1;
  return true;
}

function requireRateLimit(response, scope, identifier, windowMs, maxRequests, message = "Too many requests.") {
  if (consumeRateLimit(scope, identifier, windowMs, maxRequests)) {
    return true;
  }
  sendJson(response, 429, { error: message });
  return false;
}

function finiteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function refreshPlayerDerivedStats(player) {
  player.radius = playerRadiusForScore(player.score);
  player.healthMax = playerHealthCap(player.score, player);
  player.commandRange = playerCommandRange(player.score, player);
  player.maxEggs = maxEggsForPlayer(player);
  player.maxWorkers = maxWorkersForPlayer(player);
  player.eggScoreStep = eggScoreStepForPlayer(player);

  if (isAdminPlayer(player)) {
    player.healthMax = Math.max(player.healthMax, 2400);
    player.commandRange = Math.max(player.commandRange, 1400);
    player.maxEggs = Math.max(player.maxEggs, 20);
    player.maxWorkers = Math.max(player.maxWorkers, 30);
    player.eggScoreStep = Math.min(player.eggScoreStep, 24);
  }

  player.eggs = clamp(player.eggs, 0, player.maxEggs);
  player.health = clamp(player.health, 0, player.healthMax);
}

function applyAdminLoadout(player, options = {}) {
  if (!isAdminPlayer(player)) {
    return;
  }

  if (!player.adminState) {
    player.adminState = {
      godMode: true
    };
  }

  player.score = Math.max(player.score, options.score ?? ADMIN_STARTING_SCORE);
  player.matchLevel = MAX_LEVEL;
  player.matchXp = matchXpFloorForLevel(MAX_LEVEL);
  player.claimedCardRewardLevels = [...CARD_REWARD_LEVELS];
  player.pendingCardChoices = [];
  player.activeCardIds = [...Object.keys(CARD_LIBRARY)];
  player.buffState = createBuffState(player.activeCardIds);
  refreshPlayerDerivedStats(player);
  player.health = player.healthMax;
  player.eggs = player.maxEggs;

  while (player.workers.length < ADMIN_MIN_WORKERS) {
    player.workers.push(createWorker(player));
  }

  for (const worker of player.workers) {
    worker.food = Math.max(worker.food, 26);
    refreshWorkerDerivedStats(worker, player);
    worker.health = worker.healthMax;
  }

  bumpLeaderboardVersion();
}

function resetArenaState() {
  state.foods = [];
  state.growthNodes = [];
  state.events = [];
  state.nextEventId = 1;
  bumpResourcesVersion();
  bumpLeaderboardVersion();
  ensureFoodTarget();
  ensureGrowthNodeTarget();
}

function startNextRound() {
  state.round = {
    number: state.round.number + 1,
    status: "running",
    winnerPlayerId: null,
    winnerName: "",
    reason: "",
    countdownEndsAt: 0
  };

  resetArenaState();

  for (const player of state.players.values()) {
    resetPlayer(player);
  }

  pushEvent("round_start", { round: state.round.number });
}

function endRound(winner, reason) {
  if (state.round.status !== "running") {
    return;
  }

  state.round.status = "ended";
  state.round.winnerPlayerId = winner?.id || null;
  state.round.winnerName = winner?.name || "No Winner";
  state.round.reason = reason;
  state.round.countdownEndsAt = Date.now() + ROUND_END_DELAY_MS;
  pushEvent("round_end", {
    round: state.round.number,
    winner: state.round.winnerName,
    reason
  });
}

function refreshWorkerDerivedStats(worker, owner) {
  worker.radius = workerRadiusForFood(worker.food);
  worker.healthMax = workerMaxHealth(worker, owner);
  worker.health = clamp(worker.health, 0, worker.healthMax);
}

function getSkinPrimaryColor(skinId) {
  return SKIN_LIBRARY[skinId]?.primary || SKIN_LIBRARY.ember.primary;
}

function applyWorkerBounce(worker, angle, speed) {
  const finalSpeed = Math.max(0, speed || 0);
  worker.bounceX = Math.cos(angle) * finalSpeed;
  worker.bounceY = Math.sin(angle) * finalSpeed;
}

function createWorker(owner, options = {}) {
  const angle = Number.isFinite(options.angle) ? options.angle : Math.random() * Math.PI * 2;
  const spawnDistance = Math.max(0, options.spawnDistance ?? WORKER_HATCH_SPAWN_DISTANCE);
  const starterFood = owner?.buffState?.newWorkerFoodBonus || 0;
  const worker = {
    id: createId("worker"),
    x: owner.x + Math.cos(angle) * spawnDistance,
    y: owner.y + Math.sin(angle) * spawnDistance,
    food: starterFood,
    radius: WORKER_BASE_RADIUS,
    health: 20,
    healthMax: 20,
    mode: "harvest",
    bounceX: 0,
    bounceY: 0
  };
  refreshWorkerDerivedStats(worker, owner);
  worker.health = worker.healthMax;
  if ((options.bounceSpeed || 0) > 0) {
    applyWorkerBounce(worker, angle, options.bounceSpeed);
  }
  return worker;
}

function randomSpawnPoint(radius) {
  let bestPoint = null;
  let bestDistance = -1;
  const padding = Math.max(140, radius + 40);

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const point = {
      x: randomBetween(padding, currentMapWidth() - padding),
      y: randomBetween(padding, currentMapHeight() - padding)
    };

    let nearestDistance = Infinity;
    for (const player of state.players.values()) {
      if (!player.alive) {
        continue;
      }
      nearestDistance = Math.min(nearestDistance, Math.hypot(point.x - player.x, point.y - player.y));
    }

    if (nearestDistance > bestDistance) {
      bestDistance = nearestDistance;
      bestPoint = point;
    }
  }

  return bestPoint || { x: currentMapWidth() / 2, y: currentMapHeight() / 2 };
}

function createPlayer(identity) {
  const spawnPoint = randomSpawnPoint(PLAYER_BASE_RADIUS);
  const name = identity.displayName.slice(0, 16);
  const skinId = SKIN_LIBRARY[identity.selectedSkin] ? identity.selectedSkin : STARTER_SKINS[0];
  const player = {
    id: createId("player"),
    name,
    color: getSkinPrimaryColor(skinId),
    skinId,
    profileMode: identity.mode,
    sessionToken: identity.sessionToken,
    accountId: identity.accountId || null,
    isAdmin: Boolean(identity.isAdmin),
    x: spawnPoint.x,
    y: spawnPoint.y,
    radius: PLAYER_BASE_RADIUS,
    health: PLAYER_BASE_HEALTH,
    healthMax: PLAYER_BASE_HEALTH,
    score: 0,
    killStreak: 0,
    eggs: 1,
    eggProgress: 0,
    commandRange: COMMAND_RANGE_BASE,
    maxEggs: MAX_EGGS,
    maxWorkers: MAX_WORKERS,
    eggScoreStep: EGG_SCORE_STEP,
    matchXp: 0,
    matchLevel: 1,
    activeCardIds: identity.activeCardIds || [],
    claimedCardRewardLevels: [],
    pendingCardChoices: [],
    workers: [],
    input: {
      x: 0,
      y: 0,
      boost: false,
      hatch: false,
      merge: false,
      split: false,
      attack: false,
      pointerX: spawnPoint.x,
      pointerY: spawnPoint.y
    },
    isAttacking: false,
    isBoosting: false,
    adminState: identity.isAdmin
      ? {
          godMode: true
        }
      : null,
    mergeCooldownUntil: 0,
    splitCooldownUntil: 0,
    commandPoint: { x: spawnPoint.x, y: spawnPoint.y },
    lastInputAt: Date.now(),
    socket: null,
    buffState: createBuffState(identity.activeCardIds || []),
    knockbackX: 0,
    knockbackY: 0,
    spawnGraceUntil: Date.now() + SPAWN_GRACE_MS,
    respawnTimer: 0,
    alive: true
  };

  refreshPlayerDerivedStats(player);
  player.commandPoint = { x: player.x, y: player.y };

  for (let index = 0; index < 2; index += 1) {
    player.workers.push(createWorker(player));
  }

  applyAdminLoadout(player);

  return player;
}

function playerHiveLevel(player) {
  return player.matchLevel || 1;
}

function playerActiveCards(player) {
  return (player?.activeCardIds || []).map(summarizeCard).filter(Boolean);
}

function serializePublicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    isAdmin: Boolean(player.isAdmin),
    adminGodMode: Boolean(player.adminState?.godMode),
    level: playerHiveLevel(player),
    activeCards: playerActiveCards(player),
    color: player.color,
    skinId: player.skinId,
    x: Math.round(player.x),
    y: Math.round(player.y),
    radius: Math.round(player.radius),
    health: Math.round(player.health),
    healthMax: Math.round(player.healthMax),
    score: Math.round(player.score),
    killStreak: Math.floor(player.killStreak || 0),
    alive: player.alive,
    spawnProtectedMs: Math.max(0, (player.spawnGraceUntil || 0) - Date.now()),
    workers: player.workers.map((worker) => ({
      id: worker.id,
      x: Math.round(worker.x),
      y: Math.round(worker.y),
      radius: Math.round(worker.radius * 10) / 10,
      food: Math.round(worker.food),
      health: Math.round(worker.health),
      healthMax: Math.round(worker.healthMax),
      mode: worker.mode
    })),
    respawnTimer: Math.max(0, player.respawnTimer)
  };
}

function serializePlayerForSelf(player) {
  return {
    ...serializePublicPlayer(player),
    matchXp: Math.round(player.matchXp),
    matchXpIntoLevel: Math.round(player.matchXp - matchXpFloorForLevel(player.matchLevel)),
    matchXpForNextLevel:
      matchXpNeededForNextLevel(player.matchLevel) === null
        ? null
        : matchXpNeededForNextLevel(player.matchLevel) - matchXpFloorForLevel(player.matchLevel),
    eggs: player.eggs,
    maxEggs: player.maxEggs,
    mergeCooldownMs: Math.max(0, player.mergeCooldownUntil - Date.now()),
    splitCooldownMs: Math.max(0, player.splitCooldownUntil - Date.now()),
    commandRange: Math.round(player.commandRange),
    maxWorkers: player.maxWorkers,
    pendingCardChoices: summarizePlayerPendingChoices(player),
    nextCardRewardLevel: nextPlayerCardRewardLevel(player),
    commandX: Math.round(player.commandPoint.x),
    commandY: Math.round(player.commandPoint.y)
  };
}

function clampPointToMap(point) {
  return {
    x: clamp(point.x, 0, currentMapWidth()),
    y: clamp(point.y, 0, currentMapHeight())
  };
}

function clampedCommandPoint(player, pointerX, pointerY) {
  const pointer = {
    x: Number.isFinite(pointerX) ? pointerX : player.x,
    y: Number.isFinite(pointerY) ? pointerY : player.y
  };
  const offsetX = pointer.x - player.x;
  const offsetY = pointer.y - player.y;
  const length = Math.hypot(offsetX, offsetY);

  if (length <= player.commandRange) {
    return clampPointToMap(pointer);
  }

  const direction = normalize(offsetX, offsetY);
  return clampPointToMap({
    x: player.x + direction.x * player.commandRange,
    y: player.y + direction.y * player.commandRange
  });
}

function removeFood(foodId) {
  const index = state.foods.findIndex((food) => food.id === foodId);
  if (index >= 0) {
    state.foods.splice(index, 1);
    bumpResourcesVersion();
  }
}

function removeGrowthNode(nodeId) {
  const index = state.growthNodes.findIndex((node) => node.id === nodeId);
  if (index >= 0) {
    state.growthNodes.splice(index, 1);
    bumpResourcesVersion();
  }
}

function awardAccountXp(player, amount) {
  if (!player.accountId || amount <= 0) {
    return;
  }

  const account = getAccountById(player.accountId);
  if (!account) {
    return;
  }

  account.xp = (account.xp || 0) + amount;
  applyLevelUnlocks(account);
  scheduleAccountSave();
}

function syncPlayerBuffsFromAccount(player) {
  const activeCardIds = player.activeCardIds || [];
  const previousHealthRatio = player.healthMax > 0 ? player.health / player.healthMax : 1;
  player.buffState = createBuffState(activeCardIds);
  refreshPlayerDerivedStats(player);
  player.health = clamp(player.healthMax * previousHealthRatio, 0, player.healthMax);

  for (const worker of player.workers) {
    const workerHealthRatio = worker.healthMax > 0 ? worker.health / worker.healthMax : 1;
    refreshWorkerDerivedStats(worker, player);
    worker.health = clamp(worker.healthMax * workerHealthRatio, 0, worker.healthMax);
  }
}

function syncAllPlayersForAccount(accountId) {
  for (const player of state.players.values()) {
    if (player.accountId === accountId) {
      syncPlayerBuffsFromAccount(player);
    }
  }
}

function applyHiveKnockback(player, direction, magnitude) {
  const knockbackScale = 1 - Math.min(0.85, player?.buffState?.knockbackTakenReductionPct || 0);
  const nextX = player.knockbackX + direction.x * magnitude * knockbackScale;
  const nextY = player.knockbackY + direction.y * magnitude * knockbackScale;
  const nextMagnitude = Math.hypot(nextX, nextY);

  if (nextMagnitude > HIVE_ATTACK_KNOCKBACK_LIMIT) {
    const capped = normalize(nextX, nextY);
    player.knockbackX = capped.x * HIVE_ATTACK_KNOCKBACK_LIMIT;
    player.knockbackY = capped.y * HIVE_ATTACK_KNOCKBACK_LIMIT;
    return;
  }

  player.knockbackX = nextX;
  player.knockbackY = nextY;
}

function incrementAccountStat(player, key, amount = 1) {
  if (!player.accountId) {
    return;
  }

  const account = getAccountById(player.accountId);
  if (!account) {
    return;
  }

  account[key] = (account[key] || 0) + amount;
  scheduleAccountSave();
}

function grantScore(player, amount) {
  const finalAmount = amount * scoreGainMultiplier(player);
  if (finalAmount <= 0) {
    return;
  }

  const previousHealthMax = player.healthMax;
  const previousHealth = player.health;
  player.score += finalAmount;
  player.eggProgress += finalAmount;

  while (player.eggProgress >= player.eggScoreStep && player.eggs < player.maxEggs) {
    player.eggProgress -= player.eggScoreStep;
    player.eggs += 1;
  }

  refreshPlayerDerivedStats(player);
  const healthCapGain = Math.max(0, player.healthMax - previousHealthMax);
  const bonusHealth = finalAmount * 0.18;
  player.health = clamp(previousHealth + healthCapGain + bonusHealth, 0, player.healthMax);
  bumpLeaderboardVersion();
  awardAccountXp(player, finalAmount);
  grantMatchXp(player, finalAmount);
}

function spendScore(player, amount) {
  player.score = Math.max(0, player.score - amount);
  refreshPlayerDerivedStats(player);
  bumpLeaderboardVersion();
}

function resetPlayer(player) {
  const replacement = createPlayer({
    displayName: player.name,
    selectedSkin: player.skinId,
    mode: player.profileMode,
    sessionToken: player.sessionToken,
    accountId: player.accountId,
    isAdmin: player.isAdmin
  });

  player.x = replacement.x;
  player.y = replacement.y;
  player.radius = replacement.radius;
  player.health = replacement.health;
  player.healthMax = replacement.healthMax;
  player.score = 0;
  player.killStreak = 0;
  player.eggs = 1;
  player.eggProgress = 0;
  player.commandRange = replacement.commandRange;
  player.workers = replacement.workers;
  player.input.pointerX = player.x;
  player.input.pointerY = player.y;
  player.commandPoint = { x: player.x, y: player.y };
  player.knockbackX = 0;
  player.knockbackY = 0;
  player.spawnGraceUntil = Date.now() + SPAWN_GRACE_MS;
  player.respawnTimer = 0;
  player.isBoosting = false;
  player.mergeCooldownUntil = 0;
  player.splitCooldownUntil = 0;
  player.alive = true;
  bumpLeaderboardVersion();
  pushEvent("respawn", { playerId: player.id, name: player.name });
}

function collapsePlayer(attacker, victim) {
  victim.alive = false;
  victim.respawnTimer = 3;
  victim.workers = [];
  victim.health = 0;
  victim.killStreak = 0;
  attacker.killStreak = (attacker.killStreak || 0) + 1;
  const stolenScore = clamp(victim.score * HIVE_SCORE_STEAL_PCT, HIVE_SCORE_STEAL_MIN, HIVE_SCORE_STEAL_CAP);
  attacker.health = clamp(attacker.health + 20, 0, attacker.healthMax);
  grantScore(attacker, COLONY_KILL_SCORE_REWARD);
  grantScore(attacker, stolenScore);
  incrementAccountStat(attacker, "totalKills");
  bumpLeaderboardVersion();
  pushEvent("colony_down", {
    attacker: attacker.name,
    victim: victim.name,
    stolenScore: Math.round(stolenScore),
    streak: attacker.killStreak
  });
}

function isSpawnProtected(player) {
  return Date.now() < (player.spawnGraceUntil || 0);
}

function findClosestFoodAround(origin, radius) {
  let bestFood = null;
  let bestDistance = Infinity;

  for (const food of state.foods) {
    const nextDistance = Math.hypot(food.x - origin.x, food.y - origin.y);
    if (nextDistance <= radius && nextDistance < bestDistance) {
      bestDistance = nextDistance;
      bestFood = food;
    }
  }

  return bestFood;
}

function formationPoint(player, index, total) {
  const spread = 28 + total * 3;
  const angle = ((Math.PI * 2) / Math.max(total, 1)) * index + (Date.now() / 380) % (Math.PI * 2);
  return {
    x: player.commandPoint.x + Math.cos(angle) * spread,
    y: player.commandPoint.y + Math.sin(angle) * spread
  };
}

function clampWorkerToCommandRange(player, worker) {
  const offsetX = worker.x - player.commandPoint.x;
  const offsetY = worker.y - player.commandPoint.y;
  const distanceFromCommand = Math.hypot(offsetX, offsetY);
  const maxDistance = Math.max(24, player.commandRange);

  if (distanceFromCommand <= maxDistance) {
    return;
  }

  const direction = normalize(offsetX, offsetY);
  worker.x = player.commandPoint.x + direction.x * maxDistance;
  worker.y = player.commandPoint.y + direction.y * maxDistance;
  worker.x = clamp(worker.x, worker.radius + 2, currentMapWidth() - worker.radius - 2);
  worker.y = clamp(worker.y, worker.radius + 2, currentMapHeight() - worker.radius - 2);
}

function resolveWorkerSolidity(player, deltaSeconds) {
  if (player.workers.length < 2) {
    return;
  }

  const maxCorrection = Math.max(2.2, 150 * deltaSeconds);
  for (let iteration = 0; iteration < WORKER_SOLIDITY_ITERATIONS; iteration += 1) {
    for (let leftIndex = 0; leftIndex < player.workers.length - 1; leftIndex += 1) {
      const first = player.workers[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < player.workers.length; rightIndex += 1) {
        const second = player.workers[rightIndex];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const currentDistance = Math.hypot(dx, dy);
        const minimumDistance = first.radius + second.radius + WORKER_SOLIDITY_PADDING;

        if (currentDistance >= minimumDistance) {
          continue;
        }

        const fallbackAngle = ((leftIndex + 1) * 2.399963 + (rightIndex + 1) * 0.917) % (Math.PI * 2);
        const direction = currentDistance > 0.001
          ? { x: dx / currentDistance, y: dy / currentDistance }
          : { x: Math.cos(fallbackAngle), y: Math.sin(fallbackAngle) };
        const overlap = minimumDistance - Math.max(currentDistance, 0.001);
        const correction = Math.min(maxCorrection, overlap * WORKER_SOLIDITY_STRENGTH);
        const totalRadius = Math.max(1, first.radius + second.radius);
        const firstShare = second.radius / totalRadius;
        const secondShare = first.radius / totalRadius;

        first.x -= direction.x * correction * firstShare;
        first.y -= direction.y * correction * firstShare;
        second.x += direction.x * correction * secondShare;
        second.y += direction.y * correction * secondShare;

        clampWorkerToCommandRange(player, first);
        clampWorkerToCommandRange(player, second);
      }
    }
  }
}

function findClosestCommandScopedFood(player, origin, radius) {
  let bestFood = null;
  let bestDistance = Infinity;

  for (const food of state.foods) {
    const distanceToOrigin = Math.hypot(food.x - origin.x, food.y - origin.y);
    const distanceToCommand = Math.hypot(food.x - player.commandPoint.x, food.y - player.commandPoint.y);
    if (distanceToOrigin <= radius && distanceToCommand <= player.commandRange && distanceToOrigin < bestDistance) {
      bestDistance = distanceToOrigin;
      bestFood = food;
    }
  }

  return bestFood;
}

function mergeWorkers(player) {
  if (player.workers.length < 2) {
    return false;
  }

  let bestPair = null;
  let bestScore = Infinity;

  for (let leftIndex = 0; leftIndex < player.workers.length - 1; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < player.workers.length; rightIndex += 1) {
      const first = player.workers[leftIndex];
      const second = player.workers[rightIndex];
      const centerX = (first.x + second.x) / 2;
      const centerY = (first.y + second.y) / 2;
      const clusterDistance = Math.hypot(first.x - second.x, first.y - second.y);
      const commandDistance = Math.hypot(centerX - player.commandPoint.x, centerY - player.commandPoint.y);
      const score = clusterDistance + commandDistance * 0.65;

      if (score < bestScore) {
        bestScore = score;
        bestPair = { leftIndex, rightIndex, first, second, centerX, centerY };
      }
    }
  }

  if (!bestPair) {
    return false;
  }

  const merged = createWorker(player);
  merged.x = bestPair.centerX;
  merged.y = bestPair.centerY;
  const mergedBodyRadius = Math.min(
    WORKER_BASE_RADIUS + WORKER_MAX_RADIUS_BONUS,
    Math.sqrt(bestPair.first.radius * bestPair.first.radius + bestPair.second.radius * bestPair.second.radius)
  );
  const mergedSizeFood = workerFoodForRadius(mergedBodyRadius);
  merged.food = Math.max(
    bestPair.first.food + bestPair.second.food + MERGE_BONUS_FOOD,
    mergedSizeFood + MERGE_BONUS_FOOD * 0.5
  );
  merged.mode = player.isAttacking ? "raid" : "harvest";
  refreshWorkerDerivedStats(merged, player);
  merged.health = clamp(bestPair.first.health + bestPair.second.health, 0, merged.healthMax);

  player.workers = player.workers.filter(
    (_, index) => index !== bestPair.leftIndex && index !== bestPair.rightIndex
  );
  player.workers.push(merged);
  player.mergeCooldownUntil = Date.now() + MERGE_COOLDOWN_MS;
  return true;
}

function splitWorker(player) {
  if (player.workers.length >= player.maxWorkers) {
    return false;
  }

  let bestWorker = null;
  let bestScore = -1;
  for (const worker of player.workers) {
    if (worker.food < WORKER_SPLIT_MIN_FOOD) {
      continue;
    }

    const score = worker.food + worker.radius * 2;
    if (score > bestScore) {
      bestScore = score;
      bestWorker = worker;
    }
  }

  if (!bestWorker) {
    return false;
  }

  const totalFood = Math.max(0, bestWorker.food - WORKER_SPLIT_FOOD_LOSS);
  const firstFood = Math.floor(totalFood / 2);
  const secondFood = Math.ceil(totalFood / 2);
  const baseAngle = Math.atan2(bestWorker.y - player.y, bestWorker.x - player.x) || Math.random() * Math.PI * 2;
  const splitDistance = clamp(31 - (bestWorker.radius - WORKER_BASE_RADIUS) * 0.92, 13, 28);
  const leftAngle = baseAngle + Math.PI / 2;
  const rightAngle = baseAngle - Math.PI / 2;

  const leftWorker = createWorker(player, { spawnDistance: 0, angle: leftAngle, bounceSpeed: WORKER_SPLIT_BOUNCE_SPEED });
  const rightWorker = createWorker(player, { spawnDistance: 0, angle: rightAngle, bounceSpeed: WORKER_SPLIT_BOUNCE_SPEED });
  leftWorker.mode = player.isAttacking ? "raid" : "harvest";
  rightWorker.mode = leftWorker.mode;
  leftWorker.food = firstFood;
  rightWorker.food = secondFood;
  leftWorker.x = bestWorker.x + Math.cos(leftAngle) * splitDistance;
  leftWorker.y = bestWorker.y + Math.sin(leftAngle) * splitDistance;
  rightWorker.x = bestWorker.x + Math.cos(rightAngle) * splitDistance;
  rightWorker.y = bestWorker.y + Math.sin(rightAngle) * splitDistance;
  refreshWorkerDerivedStats(leftWorker, player);
  refreshWorkerDerivedStats(rightWorker, player);
  leftWorker.health = Math.min(leftWorker.healthMax, Math.max(10, bestWorker.health * (firstFood / Math.max(1, totalFood))));
  rightWorker.health = Math.min(rightWorker.healthMax, Math.max(10, bestWorker.health * (secondFood / Math.max(1, totalFood))));
  clampWorkerToCommandRange(player, leftWorker);
  clampWorkerToCommandRange(player, rightWorker);

  player.workers = player.workers.filter((worker) => worker.id !== bestWorker.id);
  player.workers.push(leftWorker, rightWorker);
  player.splitCooldownUntil = Date.now() + SPLIT_COOLDOWN_MS;
  pushEvent("worker_split", { playerId: player.id, name: player.name, workers: player.workers.length });
  return true;
}

function findWorkerTarget(attacker, worker) {
  let bestTarget = null;
  let bestDistance = Infinity;
  const aggroRadius = workerAggroRadiusForPlayer(attacker);

  for (const player of state.players.values()) {
    if (player.id === attacker.id || !player.alive) {
      continue;
    }

    if (isSpawnProtected(player)) {
      continue;
    }

    const commandDistanceToPlayer = Math.hypot(player.x - attacker.commandPoint.x, player.y - attacker.commandPoint.y);
    if (commandDistanceToPlayer <= aggroRadius) {
      const nextDistance = distance(worker, player);
      if (nextDistance < bestDistance) {
        bestDistance = nextDistance;
        bestTarget = { kind: "player", player };
      }
    }

    for (const enemyWorker of player.workers) {
      const commandDistance = Math.hypot(enemyWorker.x - attacker.commandPoint.x, enemyWorker.y - attacker.commandPoint.y);
      const nextDistance = distance(worker, enemyWorker);
      if (commandDistance <= aggroRadius && nextDistance < bestDistance) {
        bestDistance = nextDistance;
        bestTarget = { kind: "worker", player, worker: enemyWorker };
      }
    }
  }

  return bestTarget;
}

function moveEntity(entity, targetX, targetY, speed, deltaSeconds, padding) {
  const vector = normalize(targetX - entity.x, targetY - entity.y);
  entity.x += vector.x * speed * deltaSeconds + (entity.bounceX || 0) * deltaSeconds;
  entity.y += vector.y * speed * deltaSeconds + (entity.bounceY || 0) * deltaSeconds;
  entity.bounceX = (entity.bounceX || 0) * 0.72;
  entity.bounceY = (entity.bounceY || 0) * 0.72;
  entity.x = clamp(entity.x, padding, currentMapWidth() - padding);
  entity.y = clamp(entity.y, padding, currentMapHeight() - padding);
}

function distancePointToSegment(pointX, pointY, startX, startY, endX, endY) {
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const segmentLengthSq = segmentX * segmentX + segmentY * segmentY;
  if (segmentLengthSq <= 0.0001) {
    return Math.hypot(pointX - startX, pointY - startY);
  }

  const projection =
    ((pointX - startX) * segmentX + (pointY - startY) * segmentY) / segmentLengthSq;
  const t = clamp(projection, 0, 1);
  const closestX = startX + segmentX * t;
  const closestY = startY + segmentY * t;
  return Math.hypot(pointX - closestX, pointY - closestY);
}

function findClosestGrowthNodeAround(origin, radius) {
  let bestNode = null;
  let bestDistance = Infinity;

  for (const node of state.growthNodes) {
    const nextDistance = Math.hypot(node.x - origin.x, node.y - origin.y);
    if (nextDistance <= radius && nextDistance < bestDistance) {
      bestDistance = nextDistance;
      bestNode = node;
    }
  }

  return bestNode;
}

function findClosestCommandScopedGrowthNode(player, origin, radius) {
  let bestNode = null;
  let bestDistance = Infinity;

  for (const node of state.growthNodes) {
    const distanceToOrigin = Math.hypot(node.x - origin.x, node.y - origin.y);
    const distanceToCommand = Math.hypot(node.x - player.commandPoint.x, node.y - player.commandPoint.y);
    if (distanceToOrigin <= radius && distanceToCommand <= player.commandRange && distanceToOrigin < bestDistance) {
      bestDistance = distanceToOrigin;
      bestNode = node;
    }
  }

  return bestNode;
}

function canWorkerConsumeGrowthNode(worker, node) {
  return worker.radius >= workerGrowthNodeRequirement(node);
}

function feedWorkerFromGrowthNode(player, worker, node) {
  worker.food += node.value * WORKER_GROWTH_GAIN_MULTIPLIER;
  refreshWorkerDerivedStats(worker, player);
  worker.health = worker.healthMax;
  player.health = clamp(player.health + node.value * GROWTH_NODE_HEAL_FACTOR, 0, player.healthMax);
  grantScore(player, node.value);
  removeGrowthNode(node.id);
  pushEvent("growth_node", { playerId: player.id, name: player.name, score: Math.round(node.value) });
}

function handleWorkerHarvest(player, worker, index, deltaSeconds) {
  const fallback = formationPoint(player, index, player.workers.length);
  const nodeCandidate =
    findClosestCommandScopedGrowthNode(player, worker, WORKER_HARVEST_RADIUS) ||
    findClosestCommandScopedGrowthNode(player, fallback, WORKER_HARVEST_RADIUS);
  const node = nodeCandidate && canWorkerConsumeGrowthNode(worker, nodeCandidate) ? nodeCandidate : null;
  const food =
    findClosestCommandScopedFood(player, worker, WORKER_HARVEST_RADIUS) ||
    findClosestCommandScopedFood(player, fallback, WORKER_HARVEST_RADIUS);
  const target = node || food || fallback;
  moveEntity(worker, target.x, target.y, workerSpeed(worker, player), deltaSeconds, worker.radius + 2);
  clampWorkerToCommandRange(player, worker);

  if (node && canWorkerConsumeGrowthNode(worker, node) && Math.hypot(node.x - worker.x, node.y - worker.y) <= node.coreRadius + worker.radius + 2) {
    feedWorkerFromGrowthNode(player, worker, node);
    return;
  }

  if (food && Math.hypot(food.x - worker.x, food.y - worker.y) <= food.size + worker.radius + 2) {
    worker.food += food.value * WORKER_GROWTH_GAIN_MULTIPLIER;
    refreshWorkerDerivedStats(worker, player);
    worker.health = worker.healthMax;
    player.health = clamp(player.health + food.value * 0.32, 0, player.healthMax);
    grantScore(player, food.value);
    removeFood(food.id);
  }
}

function tryConsumeNearbyFood(player, worker) {
  const food = findClosestCommandScopedFood(player, worker, worker.radius + 18);
  if (!food) {
    return false;
  }

  if (Math.hypot(food.x - worker.x, food.y - worker.y) > food.size + worker.radius + 2) {
    return false;
  }

  worker.food += food.value * WORKER_GROWTH_GAIN_MULTIPLIER;
  refreshWorkerDerivedStats(worker, player);
  worker.health = worker.healthMax;
  player.health = clamp(player.health + food.value * 0.32, 0, player.healthMax);
  grantScore(player, food.value);
  removeFood(food.id);
  return true;
}

function tryConsumeFoodAlongPath(player, worker, fromX, fromY) {
  let bestFood = null;
  let bestDistance = Infinity;
  const sweepRadius = worker.radius + 8;

  for (const food of state.foods) {
    const distanceToCommand = Math.hypot(food.x - player.commandPoint.x, food.y - player.commandPoint.y);
    if (distanceToCommand > player.commandRange) {
      continue;
    }

    const pathDistance = distancePointToSegment(food.x, food.y, fromX, fromY, worker.x, worker.y);
    const collideDistance = food.size + sweepRadius;
    if (pathDistance <= collideDistance && pathDistance < bestDistance) {
      bestDistance = pathDistance;
      bestFood = food;
    }
  }

  if (!bestFood) {
    return false;
  }

  worker.food += bestFood.value * WORKER_GROWTH_GAIN_MULTIPLIER;
  refreshWorkerDerivedStats(worker, player);
  worker.health = worker.healthMax;
  player.health = clamp(player.health + bestFood.value * 0.32, 0, player.healthMax);
  grantScore(player, bestFood.value);
  removeFood(bestFood.id);
  return true;
}

function tryConsumeNearbyGrowthNode(player, worker) {
  const node = findClosestCommandScopedGrowthNode(player, worker, worker.radius + 20);
  if (!node || !canWorkerConsumeGrowthNode(worker, node)) {
    return false;
  }

  if (Math.hypot(node.x - worker.x, node.y - worker.y) > node.coreRadius + worker.radius + 2) {
    return false;
  }

  feedWorkerFromGrowthNode(player, worker, node);
  return true;
}

function handleWorkerCombat(player, worker, deltaSeconds) {
  const target = findWorkerTarget(player, worker);
  const commandedNodeCandidate = findClosestCommandScopedGrowthNode(
    player,
    player.commandPoint,
    Math.max(34, player.radius + 20)
  );
  const commandedNode =
    commandedNodeCandidate && canWorkerConsumeGrowthNode(worker, commandedNodeCandidate) ? commandedNodeCandidate : null;
  const commandedFood = findClosestCommandScopedFood(player, player.commandPoint, Math.max(28, player.radius + 12));
  const fallback = commandedNode || commandedFood || player.commandPoint;

  if (!target) {
    const previousX = worker.x;
    const previousY = worker.y;
    moveEntity(worker, fallback.x, fallback.y, workerSpeed(worker, player), deltaSeconds, worker.radius + 2);
    clampWorkerToCommandRange(player, worker);
    if (commandedNode) {
      tryConsumeNearbyGrowthNode(player, worker);
    } else if (commandedFood) {
      if (tryConsumeFoodAlongPath(player, worker, previousX, previousY)) {
        return;
      }
      tryConsumeNearbyFood(player, worker);
    } else {
      if (tryConsumeFoodAlongPath(player, worker, previousX, previousY)) {
        return;
      }
    }
    return;
  }

  const targetPosition = target.kind === "worker" ? target.worker : target.player;
  const previousX = worker.x;
  const previousY = worker.y;
  moveEntity(worker, targetPosition.x, targetPosition.y, workerSpeed(worker, player), deltaSeconds, worker.radius + 2);
  clampWorkerToCommandRange(player, worker);

  if (tryConsumeNearbyGrowthNode(player, worker)) {
    return;
  }
  if (tryConsumeFoodAlongPath(player, worker, previousX, previousY)) {
    return;
  }
  tryConsumeNearbyFood(player, worker);

  if (target.kind === "worker") {
    if (isAdminGodMode(target.player)) {
      target.worker.health = target.worker.healthMax;
      return;
    }
    const reach = workerReach(worker, player) + target.worker.radius;
    if (distance(worker, target.worker) <= reach) {
      target.worker.health -= workerDamage(worker, player) * deltaSeconds;
      if (target.worker.health <= 0) {
        target.player.workers = target.player.workers.filter((entry) => entry.id !== target.worker.id);
        grantScore(player, WORKER_PICKOFF_SCORE_REWARD);
        player.health = clamp(player.health + 6, 0, player.healthMax);
        pushEvent("worker_pickoff", { attacker: player.name, victim: target.player.name });
      }
    }
    return;
  }

  const reach = workerReach(worker, player) + target.player.radius + attackReachForPlayer(player);
  if (distance(worker, target.player) <= reach) {
    if (isAdminGodMode(target.player)) {
      target.player.health = target.player.healthMax;
      return;
    }
    target.player.health -= playerCoreDamage(worker, player) * deltaSeconds;
    const direction = normalize(target.player.x - worker.x, target.player.y - worker.y);
    applyHiveKnockback(target.player, direction, HIVE_ATTACK_KNOCKBACK);
    if (target.player.health <= 0) {
      collapsePlayer(player, target.player);
    }
  }
}

function updatePlayer(player, deltaSeconds) {
  if (state.round.status !== "running") {
    return;
  }

  if (!player.alive) {
    player.isBoosting = false;
    player.respawnTimer = Math.max(0, player.respawnTimer - deltaSeconds);
    if (player.respawnTimer === 0) {
      resetPlayer(player);
    }
    return;
  }

  if (player.adminFrozen) {
    player.isBoosting = false;
    player.isAttacking = false;
    player.commandPoint = { x: player.x, y: player.y };
    player.knockbackX *= 0.48;
    player.knockbackY *= 0.48;
    player.health = clamp(player.health + playerHealthRegen(player) * deltaSeconds, 0, player.healthMax);
    return;
  }

  const recentInput = Date.now() - player.lastInputAt < INPUT_TIMEOUT_MS;
  const input = recentInput
    ? player.input
    : { x: 0, y: 0, boost: false, hatch: false, merge: false, split: false, attack: false, pointerX: player.x, pointerY: player.y };

  player.isAttacking = Boolean(input.attack);
  player.commandPoint = clampedCommandPoint(player, input.pointerX, input.pointerY);

  const move = normalize(input.x, input.y);
  const baseSpeed = playerSpeedForRadius(player.radius, player);
  const isBoosting = Boolean(input.boost) && player.score > 1;
  player.isBoosting = isBoosting;
  const speed = baseSpeed + (isBoosting ? BOOST_BONUS : 0);

  player.x += move.x * speed * deltaSeconds + player.knockbackX * deltaSeconds;
  player.y += move.y * speed * deltaSeconds + player.knockbackY * deltaSeconds;
  player.x = clamp(player.x, player.radius, currentMapWidth() - player.radius);
  player.y = clamp(player.y, player.radius, currentMapHeight() - player.radius);
  player.knockbackX *= 0.48;
  player.knockbackY *= 0.48;
  player.health = clamp(player.health + playerHealthRegen(player) * deltaSeconds, 0, player.healthMax);
  if (isAdminGodMode(player)) {
    player.health = player.healthMax;
  }

  if (isBoosting) {
    spendScore(player, BOOST_SCORE_COST_PER_SECOND * deltaSeconds);
  }

  for (const food of state.foods) {
    if (distance(player, food) <= player.radius + food.size) {
      player.health = clamp(player.health + food.value * 0.6, 0, player.healthMax);
      grantScore(player, food.value * 0.85);
      removeFood(food.id);
      break;
    }
  }

  for (const node of state.growthNodes) {
    if (player.radius < node.requiredRadius) {
      continue;
    }

    if (distance(player, node) <= player.radius + node.coreRadius) {
      player.health = clamp(player.health + node.value * GROWTH_NODE_HEAL_FACTOR, 0, player.healthMax);
      grantScore(player, node.value);
      removeGrowthNode(node.id);
      pushEvent("growth_node", { playerId: player.id, name: player.name, score: Math.round(node.value) });
      break;
    }
  }

  if (input.hatch && player.eggs >= EGG_COST && player.workers.length < player.maxWorkers) {
    player.eggs -= EGG_COST;
    const hatchAngle = Math.atan2(player.commandPoint.y - player.y, player.commandPoint.x - player.x) || Math.random() * Math.PI * 2;
    player.workers.push(
      createWorker(player, {
        angle: hatchAngle,
        spawnDistance: WORKER_HATCH_SPAWN_DISTANCE,
        bounceSpeed: WORKER_HATCH_BOUNCE_SPEED
      })
    );
    pushEvent("hatch", { playerId: player.id, name: player.name, workers: player.workers.length });
    player.input.hatch = false;
  }

  if (input.merge && Date.now() >= player.mergeCooldownUntil) {
    if (mergeWorkers(player)) {
      player.input.merge = false;
    }
  }

  if (input.split && Date.now() >= player.splitCooldownUntil) {
    if (splitWorker(player)) {
      player.input.split = false;
    }
  }
}

function updateWorkers(player, deltaSeconds) {
  if (state.round.status !== "running") {
    return;
  }

  const attackMode = player.isAttacking;

  for (let index = player.workers.length - 1; index >= 0; index -= 1) {
    const worker = player.workers[index];
    worker.mode = attackMode ? "raid" : "harvest";
    worker.health = clamp(worker.health + WORKER_HEALTH_REGEN * deltaSeconds, 0, worker.healthMax);

    if (worker.mode === "raid") {
      handleWorkerCombat(player, worker, deltaSeconds);
    } else {
      handleWorkerHarvest(player, worker, index, deltaSeconds);
    }
  }

  resolveWorkerSolidity(player, deltaSeconds);
}

function updateGame() {
  const now = Date.now();
  const lastTickAt = Number.isFinite(state.lastTickAt) ? state.lastTickAt : now;
  const deltaSeconds = Math.min(Math.max((now - lastTickAt) / 1000, 0), 0.05);
  state.lastTickAt = now;

  if (state.round.status === "ended") {
    if (Date.now() >= state.round.countdownEndsAt) {
      startNextRound();
    }
    return;
  }

  ensureFoodTarget();
  ensureGrowthNodeTarget();

  for (const player of state.players.values()) {
    updatePlayer(player, deltaSeconds);
  }

  for (const player of state.players.values()) {
    updateWorkers(player, deltaSeconds);
  }

  const topPlayer = Array.from(state.players.values()).sort((left, right) => right.score - left.score)[0];
  if (topPlayer && topPlayer.score >= currentRoomConfig().roundScoreTarget) {
    endRound(topPlayer, "score_target");
  }
}

function buildLeaderboard(players) {
  return players
    .map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      workers: player.workers.length,
      killStreak: Math.floor(player.killStreak || 0)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, LEADERBOARD_SIZE);
}

function buildSnapshotContext() {
  const players = Array.from(state.players.values());
  const publicPlayers = players.map(serializePublicPlayer);
  const publicPlayersById = new Map(publicPlayers.map((player, index) => [player.id, { player, index }]));
  return {
    players,
    publicPlayers,
    publicPlayersById,
    leaderboard: buildLeaderboard(publicPlayers)
  };
}

function viewerBoundsForPlayer(viewerPlayer) {
  const halfWidth = Math.max(RESOURCE_VIEW_PADDING, viewerPlayer.commandRange * 2.65);
  const halfHeight = Math.max(RESOURCE_VIEW_PADDING * 0.8, viewerPlayer.commandRange * 2.1);
  return {
    minX: viewerPlayer.x - halfWidth,
    maxX: viewerPlayer.x + halfWidth,
    minY: viewerPlayer.y - halfHeight,
    maxY: viewerPlayer.y + halfHeight
  };
}

function pointInsideBounds(x, y, bounds) {
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

function playerIntersectsViewerBounds(player, bounds) {
  if (pointInsideBounds(player.x, player.y, bounds)) {
    return true;
  }

  for (const worker of player.workers) {
    if (pointInsideBounds(worker.x, worker.y, bounds)) {
      return true;
    }
  }

  return false;
}

function resolveSpectatorFocusId(players, requestedPlayerId) {
  if (requestedPlayerId && players.some((player) => player.id === requestedPlayerId && player.alive)) {
    return requestedPlayerId;
  }

  const alivePlayers = players
    .filter((player) => player.alive)
    .sort((left, right) => right.score - left.score);

  return alivePlayers[0]?.id || players[0]?.id || null;
}

function resourceViewStateForViewer({ playerId = null, spectatorMode = false, spectatorFocusId = null } = {}) {
  if (spectatorMode) {
    const focusPlayer = Array.from(state.players.values()).find((player) => player.id === spectatorFocusId && player.alive);
    if (focusPlayer) {
      return focusPlayer;
    }
  }

  if (playerId) {
    return state.players.get(playerId) || null;
  }

  return null;
}

function visibleResourcesAround(viewerPlayer) {
  if (!viewerPlayer) {
    return {
      foods: state.foods,
      growthNodes: state.growthNodes
    };
  }

  const halfWidth = Math.max(RESOURCE_VIEW_PADDING, viewerPlayer.commandRange * 2.4);
  const halfHeight = Math.max(RESOURCE_VIEW_PADDING * 0.72, viewerPlayer.commandRange * 1.8);
  const minX = viewerPlayer.x - halfWidth;
  const maxX = viewerPlayer.x + halfWidth;
  const minY = viewerPlayer.y - halfHeight;
  const maxY = viewerPlayer.y + halfHeight;

  return {
    foods: state.foods.filter((food) => food.x >= minX && food.x <= maxX && food.y >= minY && food.y <= maxY),
    growthNodes: state.growthNodes.filter((node) => node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY)
  };
}

function shouldRefreshResourcesForViewer(viewerState, viewerPlayer) {
  if (!viewerState || !viewerPlayer) {
    return true;
  }

  if (viewerState.resourcesVersion !== state.resourcesVersion) {
    return true;
  }

  const lastViewX = Number(viewerState.resourceViewX);
  const lastViewY = Number(viewerState.resourceViewY);
  if (!Number.isFinite(lastViewX) || !Number.isFinite(lastViewY)) {
    return true;
  }

  const movementThreshold = Math.max(220, viewerPlayer.commandRange * 0.38);
  return Math.hypot(viewerPlayer.x - lastViewX, viewerPlayer.y - lastViewY) >= movementThreshold;
}

function snapshotPlayersForViewer(snapshotContext, viewerPlayer, playerId, focusPlayerId = null) {
  if (!viewerPlayer) {
    return snapshotContext.publicPlayers;
  }

  const bounds = viewerBoundsForPlayer(viewerPlayer);
  const nextPlayers = [];

  for (let index = 0; index < snapshotContext.players.length; index += 1) {
    const rawPlayer = snapshotContext.players[index];
    if (!playerIntersectsViewerBounds(rawPlayer, bounds) && rawPlayer.id !== playerId && rawPlayer.id !== focusPlayerId) {
      continue;
    }

    if (rawPlayer.id === playerId) {
      nextPlayers.push(serializePlayerForSelf(rawPlayer));
    } else {
      nextPlayers.push(snapshotContext.publicPlayers[index]);
    }
  }

  return nextPlayers;
}

function snapshotForViewer({
  playerId = null,
  sessionToken = "",
  spectatorMode = false,
  spectatorFocusId = null,
  viewerState = null,
  snapshotContext = null
} = {}) {
  const resolvedContext = snapshotContext || buildSnapshotContext();
  const roomSequence = state.broadcastSequence || 0;
  const profileSession = sessionToken ? getSessionByToken(sessionToken) : state.players.get(playerId) ? getSessionByToken(state.players.get(playerId).sessionToken) : null;
  const fullPlayerList = resolvedContext.publicPlayers;
  const resolvedFocusId = spectatorMode ? resolveSpectatorFocusId(fullPlayerList, spectatorFocusId) : null;
  const resourceViewPlayer = resourceViewStateForViewer({ playerId, spectatorMode, spectatorFocusId: resolvedFocusId });
  const players = snapshotPlayersForViewer(resolvedContext, resourceViewPlayer, spectatorMode ? null : playerId, resolvedFocusId);
  const includeResources =
    shouldRefreshResourcesForViewer(viewerState, resourceViewPlayer) || roomSequence % RESOURCE_REFRESH_INTERVAL === 0;
  const includeLeaderboard = !viewerState || viewerState.leaderboardVersion !== state.leaderboardVersion || roomSequence % LEADERBOARD_REFRESH_INTERVAL === 0;
  const includeProfile = !viewerState || !viewerState.profileSent;
  const leaderboard = includeLeaderboard ? resolvedContext.leaderboard : undefined;

  const snapshot = {
    type: "state",
    sequence: roomSequence,
    you: playerId,
    spectator: {
      active: spectatorMode,
      focusPlayerId: resolvedFocusId
    },
    serverTime: Date.now(),
    config: {
      mapWidth: currentRoomConfig().mapWidth,
      mapHeight: currentRoomConfig().mapHeight,
      minPlayers: currentRoomConfig().minPlayers,
      maxPlayers: currentRoomConfig().maxPlayers,
      roundScoreTarget: currentRoomConfig().roundScoreTarget,
      tickRate: TICK_RATE,
      broadcastRate: BROADCAST_RATE,
      onlinePlayers: state.players.size,
      version: RELEASE_LABEL,
      versionInfo: versionPayload(),
      roomId: state.id,
      roomName: roomDisplayName(state),
      roomRegion: state.region,
      roomMode: state.mode
    },
    players,
    recentEvents: roomSequence % RECENT_EVENTS_INTERVAL === 0 ? state.events.slice(-8) : undefined,
    round: {
      number: state.round.number,
      status: state.round.status,
      winnerPlayerId: state.round.winnerPlayerId,
      winnerName: state.round.winnerName,
      reason: state.round.reason,
      countdownMs: Math.max(0, state.round.countdownEndsAt - Date.now())
    }
  };

  if (playerId && state.players.has(playerId)) {
    snapshot.ackInputSeq = state.players.get(playerId).lastInputSeq || 0;
  }

  if (includeResources) {
    const visibleResources = visibleResourcesAround(resourceViewPlayer);
    snapshot.foods = visibleResources.foods;
    snapshot.growthNodes = visibleResources.growthNodes;
    snapshot.resourcesVersion = state.resourcesVersion;
  }

  if (includeLeaderboard) {
    snapshot.leaderboard = leaderboard;
    snapshot.leaderboardVersion = state.leaderboardVersion;
  }

  if (includeProfile) {
    snapshot.profile = buildProfileForSession(profileSession);
  }

  if (viewerState) {
    if (includeResources) {
      viewerState.resourcesVersion = state.resourcesVersion;
      viewerState.resourceViewX = resourceViewPlayer?.x ?? null;
      viewerState.resourceViewY = resourceViewPlayer?.y ?? null;
    }
    if (includeLeaderboard) {
      viewerState.leaderboardVersion = state.leaderboardVersion;
    }
    if (includeProfile) {
      viewerState.profileSent = true;
    }
  }

  return snapshot;
}

function broadcastGameState() {
  broadcastSequence += 1;
  state.broadcastSequence = (state.broadcastSequence || 0) + 1;
  const snapshotContext = buildSnapshotContext();
  for (const player of state.players.values()) {
    if (player.socket?.readyState === 1) {
      if ((player.socket.bufferedAmount || 0) > MAX_SOCKET_BACKLOG_BYTES) {
        continue;
      }
      player.netState = player.netState || { resourcesVersion: 0, leaderboardVersion: 0, profileSent: false };
      player.socket.send(JSON.stringify(snapshotForViewer({ playerId: player.id, viewerState: player.netState, snapshotContext })));
    }
  }

  for (const spectator of state.spectators.values()) {
    if (spectator.socket?.readyState === 1) {
      if ((spectator.socket.bufferedAmount || 0) > MAX_SOCKET_BACKLOG_BYTES) {
        continue;
      }
      spectator.netState = spectator.netState || { resourcesVersion: 0, leaderboardVersion: 0, profileSent: false };
      spectator.socket.send(
        JSON.stringify(
          snapshotForViewer({ sessionToken: spectator.sessionToken, spectatorMode: true, viewerState: spectator.netState, snapshotContext })
        )
      );
    }
  }
}

function resolveSession(request, payload) {
  const token = parseAuthToken(request, payload);
  return getSessionByToken(token);
}

function handleRegister(request, response, payload) {
  const username = normalizeUsername(payload.username);
  const password = String(payload.password || "");
  const starterSkin = isStarterSkin(payload.starterSkin) ? payload.starterSkin : STARTER_SKINS[0];

  if (username.length < 3) {
    sendJson(response, 400, { error: "Username must be at least 3 characters." });
    return;
  }

  if (password.length < 8) {
    sendJson(response, 400, { error: "Password must be at least 8 characters." });
    return;
  }

  if (findAccountByUsername(username)) {
    sendJson(response, 409, { error: "That username is already taken." });
    return;
  }

  if (ADMIN_SEED_ENABLED && username.toLowerCase() === normalizeUsername(ADMIN_USERNAME).toLowerCase()) {
    sendJson(response, 403, { error: "That username is reserved." });
    return;
  }

  const salt = crypto.randomBytes(8).toString("hex");
  const account = {
    id: createId("acct"),
    username,
    salt,
    passwordHash: hashPassword(password, salt),
    passwordAlgo: "scrypt",
    xp: 0,
    level: 1,
    ownedSkins: [...STARTER_SKINS],
    selectedSkin: starterSkin,
    totalMatches: 0,
    totalKills: 0,
    createdAt: Date.now(),
    lastSeenAt: Date.now()
  };

  applyLevelUnlocks(account);
  accountStore.accounts.push(account);
  scheduleAccountSave();

  const authToken = createSessionForAccount(account);
  const session = getSessionByToken(authToken);
  auditLog("auth.register", { username: account.username, accountId: account.id, ip: clientIpForRequest(request) });
  sendJson(response, 200, {
    authToken,
    profile: summarizeAccount(account),
    ...sessionResponse(session)
  });
}

function handleLogin(request, response, payload) {
  const username = normalizeUsername(payload.username);
  const password = String(payload.password || "");
  const account = findAccountByUsername(username);

  if (!account || !verifyPassword(password, account)) {
    auditLog("auth.login.failed", { username, ip: clientIpForRequest(request) });
    sendJson(response, 401, { error: "Invalid username or password." });
    return;
  }
  upgradePasswordHashIfNeeded(account, password);

  if (isBannedAccount(account)) {
    sendJson(response, 403, { error: account.banReason || "This account has been banned." });
    return;
  }

  account.lastSeenAt = Date.now();
  applyLevelUnlocks(account);
  scheduleAccountSave();

  const authToken = createSessionForAccount(account);
  const session = getSessionByToken(authToken);
  auditLog("auth.login.success", { username: account.username, accountId: account.id, ip: clientIpForRequest(request) });
  sendJson(response, 200, {
    authToken,
    profile: summarizeAccount(account),
    ...sessionResponse(session)
  });
}

function handleGuest(request, response, payload) {
  const guestName = sanitizeGuestName(payload.name);
  if (isBannedGuestName(guestName)) {
    sendJson(response, 403, { error: "This guest profile has been banned." });
    return;
  }
  const selectedSkin = isStarterSkin(payload.starterSkin) ? payload.starterSkin : STARTER_SKINS[0];
  const authToken = createGuestSession(guestName, selectedSkin);
  const session = getSessionByToken(authToken);
  auditLog("auth.guest", { guestName, ip: clientIpForRequest(request) });
  sendJson(response, 200, {
    authToken,
    profile: summarizeGuestSession(getSessionByToken(authToken)),
    ...sessionResponse(session)
  });
}

function handleAuthMe(request, response) {
  const session = resolveSession(request);
  if (!session) {
    sendJson(response, 401, { error: "Not authenticated." });
    return;
  }

  const profile = buildProfileForSession(session);
  if (!profile) {
    sendJson(response, 401, { error: "Session is no longer valid." });
    return;
  }

  sendJson(response, 200, { profile, ...sessionResponse(session) });
}

function handleAdminAccountsPreview(request, response) {
  const admin = requireAdminSession(request, response);
  if (!admin) {
    return;
  }

  sendJson(response, 200, {
    accounts: redactedAccountsPreview()
  });
}

function handleAdminDashboard(request, response) {
  const admin = requireAdminSession(request, response);
  if (!admin) {
    return;
  }

  sendJson(response, 200, { ...adminDashboardPayload(), ...sessionResponse(admin.session) });
}

function handleAdminAction(request, response, payload) {
  const admin = requireAdminSession(request, response, payload);
  if (!admin) {
    return;
  }
  if (!requireCsrf(request, response, admin.session, payload)) {
    auditLog("csrf.admin.failed", { admin: admin.account.username, ip: clientIpForRequest(request) });
    return;
  }

  const adminRecord = findPlayerBySessionToken(admin.session.token);
  const player = adminRecord?.player || null;
  const adminActorName = player?.name || admin.account.username || "admin";
  const requireLiveAdminPlayer = () => {
    if (player) {
      return player;
    }
    sendJson(response, 409, { error: "Join the arena first to use that self-testing admin action." });
    return null;
  };

  const action = String(payload.action || "");
  const targetPlayerId = String(payload.targetPlayerId || "");
  const targetAccountId = String(payload.targetAccountId || "");
  const targetGuestName = String(payload.targetGuestName || "");
  const requestedAmount = Number(payload.amount) || 0;

  const findTargetPlayer = () => findPlayerRoom(targetPlayerId);
  const kickPlayer = (targetPlayer, reason = "Kicked by admin") => {
    if (!targetPlayer || targetPlayer.isAdmin) {
      return false;
    }
    const targetRecord = findPlayerRoom(targetPlayer.id);
    if (!targetRecord) {
      return false;
    }
    try {
      targetPlayer.socket?.close(4001, reason);
    } catch {}
    if (targetRecord.room.state.players.has(targetPlayer.id)) {
      targetRecord.room.state.players.delete(targetPlayer.id);
      playerRoomIndex.delete(targetPlayer.id);
      withRoomState(targetRecord.room, () => {
        bumpLeaderboardVersion();
        pushEvent("admin_kick", { admin: adminActorName, target: targetPlayer.name });
      });
    }
    return true;
  };

  const banAccountById = (accountId, reason = "Banned by admin") => {
    const account = getAccountById(accountId);
    if (!account || isAdminAccount(account)) {
      return false;
    }
    account.bannedAt = Date.now();
    account.banReason = reason;
    scheduleAccountSave();
    for (const [token, session] of sessions.entries()) {
      if (session.accountId === account.id) {
        sessions.delete(token);
      }
    }
    for (const { player: targetPlayer } of allLivePlayers()) {
      if (targetPlayer.accountId === account.id) {
        kickPlayer(targetPlayer, "Banned by admin");
      }
    }
    if (adminRecord?.room) {
      withRoomState(adminRecord.room, () => pushEvent("admin_ban", { admin: adminActorName, target: account.username }));
    }
    return true;
  };

  const banGuestByName = (guestName) => {
    const normalized = normalizeGuestName(guestName);
    if (!normalized) {
      return false;
    }
    accountStore.bannedGuests = accountStore.bannedGuests || [];
    if (!accountStore.bannedGuests.includes(normalized)) {
      accountStore.bannedGuests.push(normalized);
      scheduleAccountSave();
    }
    for (const [token, session] of sessions.entries()) {
      if (session.mode === "guest" && normalizeGuestName(session.guestName) === normalized) {
        sessions.delete(token);
      }
    }
    for (const { player: targetPlayer } of allLivePlayers()) {
      if (!targetPlayer.accountId && normalizeGuestName(targetPlayer.name) === normalized) {
        kickPlayer(targetPlayer, "Guest banned by admin");
      }
    }
    if (adminRecord?.room) {
      withRoomState(adminRecord.room, () => pushEvent("admin_ban_guest", { admin: adminActorName, target: normalized }));
    }
    return true;
  };

  const unbanAccountById = (accountId) => {
    const account = getAccountById(accountId);
    if (!account) {
      return false;
    }
    delete account.bannedAt;
    delete account.banReason;
    scheduleAccountSave();
    if (adminRecord?.room) {
      withRoomState(adminRecord.room, () => pushEvent("admin_unban", { admin: adminActorName, target: account.username }));
    }
    return true;
  };

  const resetAccountProgressById = (accountId) => {
    const account = getAccountById(accountId);
    if (!account || isAdminAccount(account)) {
      return false;
    }
    account.xp = 0;
    account.level = 1;
    account.ownedSkins = [...STARTER_SKINS];
    account.selectedSkin = STARTER_SKINS.includes(account.selectedSkin) ? account.selectedSkin : STARTER_SKINS[0];
    account.totalMatches = 0;
    account.totalKills = 0;
    account.lastSeenAt = Date.now();
    applyLevelUnlocks(account);
    scheduleAccountSave();
    kickSessionsForAccount(account.id);
    if (adminRecord?.room) {
      withRoomState(adminRecord.room, () => pushEvent("admin_reset_account", { admin: adminActorName, target: account.username }));
    }
    return true;
  };

  const unbanGuestByName = (guestName) => {
    const normalized = normalizeGuestName(guestName);
    const before = (accountStore.bannedGuests || []).length;
    accountStore.bannedGuests = (accountStore.bannedGuests || []).filter((entry) => entry !== normalized);
    if (accountStore.bannedGuests.length !== before) {
      scheduleAccountSave();
      if (adminRecord?.room) {
        withRoomState(adminRecord.room, () => pushEvent("admin_unban_guest", { admin: adminActorName, target: normalized }));
      }
      return true;
    }
    return false;
  };

  const kickSessionsForAccount = (accountId) => {
    const account = getAccountById(accountId);
    if (!account || isAdminAccount(account)) {
      return false;
    }

    let changed = false;
    for (const [token, session] of sessions.entries()) {
      if (session.accountId === account.id) {
        sessions.delete(token);
        changed = true;
      }
    }
    for (const { player: targetPlayer } of allLivePlayers()) {
      if (targetPlayer.accountId === account.id) {
        kickPlayer(targetPlayer, "Account sessions cleared by admin");
        changed = true;
      }
    }
    if (changed) {
      if (adminRecord?.room) {
        withRoomState(adminRecord.room, () => pushEvent("admin_kick_account", { admin: adminActorName, target: account.username }));
      }
    }
    return changed;
  };

  const kickSessionsForGuest = (guestName) => {
    const normalized = normalizeGuestName(guestName);
    if (!normalized) {
      return false;
    }

    let changed = false;
    for (const [token, session] of sessions.entries()) {
      if (session.mode === "guest" && normalizeGuestName(session.guestName) === normalized) {
        sessions.delete(token);
        changed = true;
      }
    }
    for (const { player: targetPlayer } of allLivePlayers()) {
      if (!targetPlayer.accountId && normalizeGuestName(targetPlayer.name) === normalized) {
        kickPlayer(targetPlayer, "Guest sessions cleared by admin");
        changed = true;
      }
    }
    if (changed) {
      if (adminRecord?.room) {
        withRoomState(adminRecord.room, () => pushEvent("admin_kick_guest", { admin: adminActorName, target: normalized }));
      }
    }
    return changed;
  };

  if (action === "toggle_god_mode") {
    const liveAdminPlayer = requireLiveAdminPlayer();
    if (!liveAdminPlayer) {
      return;
    }
    liveAdminPlayer.adminState.godMode = !liveAdminPlayer.adminState.godMode;
  } else if (action === "apply_test_build") {
    const liveAdminPlayer = requireLiveAdminPlayer();
    if (!liveAdminPlayer) {
      return;
    }
    withRoomState(adminRecord.room, () => applyAdminLoadout(liveAdminPlayer, { score: ADMIN_STARTING_SCORE }));
  } else if (action === "heal_refill") {
    const liveAdminPlayer = requireLiveAdminPlayer();
    if (!liveAdminPlayer) {
      return;
    }
    withRoomState(adminRecord.room, () => {
      refreshPlayerDerivedStats(liveAdminPlayer);
      liveAdminPlayer.health = liveAdminPlayer.healthMax;
      liveAdminPlayer.eggs = liveAdminPlayer.maxEggs;
      for (const worker of liveAdminPlayer.workers) {
        worker.health = worker.healthMax;
      }
    });
  } else if (action === "add_score") {
    const liveAdminPlayer = requireLiveAdminPlayer();
    if (!liveAdminPlayer) {
      return;
    }
    withRoomState(adminRecord.room, () => grantScore(liveAdminPlayer, Number(payload.amount) || 5000));
  } else if (action === "spawn_workers") {
    const liveAdminPlayer = requireLiveAdminPlayer();
    if (!liveAdminPlayer) {
      return;
    }
    const spawnCount = clamp(Number(payload.amount) || 4, 1, 12);
    withRoomState(adminRecord.room, () => {
      for (let index = 0; index < spawnCount && liveAdminPlayer.workers.length < liveAdminPlayer.maxWorkers; index += 1) {
        liveAdminPlayer.workers.push(createWorker(liveAdminPlayer));
      }
      applyAdminLoadout(liveAdminPlayer, { score: liveAdminPlayer.score });
    });
  } else if (action === "reset_cooldowns") {
    const liveAdminPlayer = requireLiveAdminPlayer();
    if (!liveAdminPlayer) {
      return;
    }
    liveAdminPlayer.mergeCooldownUntil = 0;
    liveAdminPlayer.splitCooldownUntil = 0;
  } else if (action === "kick_player") {
    if (!kickPlayer(findTargetPlayer()?.player)) {
      sendJson(response, 400, { error: "Unable to kick that player." });
      return;
    }
  } else if (action === "freeze_player") {
    const targetRecord = findTargetPlayer();
    const targetPlayer = targetRecord?.player;
    if (!targetPlayer || targetPlayer.isAdmin || !targetRecord?.room) {
      sendJson(response, 400, { error: "Unable to freeze that player." });
      return;
    }
    targetPlayer.adminFrozen = !targetPlayer.adminFrozen;
    if (targetPlayer.adminFrozen) {
      targetPlayer.isAttacking = false;
      targetPlayer.input = {
        ...targetPlayer.input,
        x: 0,
        y: 0,
        boost: false,
        hatch: false,
        merge: false,
        split: false,
        attack: false,
        pointerX: targetPlayer.x,
        pointerY: targetPlayer.y
      };
    }
    withRoomState(targetRecord.room, () => pushEvent("admin_freeze", { admin: adminActorName, target: targetPlayer.name, frozen: targetPlayer.adminFrozen }));
  } else if (action === "heal_player") {
    const targetRecord = findTargetPlayer();
    const targetPlayer = targetRecord?.player;
    if (!targetPlayer || !targetRecord?.room) {
      sendJson(response, 404, { error: "Player not found." });
      return;
    }
    refreshPlayerDerivedStats(targetPlayer);
    targetPlayer.health = targetPlayer.healthMax;
    for (const worker of targetPlayer.workers) {
      worker.health = worker.healthMax;
    }
    withRoomState(targetRecord.room, () => pushEvent("admin_heal", { admin: adminActorName, target: targetPlayer.name }));
  } else if (action === "grant_score_player") {
    const targetRecord = findTargetPlayer();
    const targetPlayer = targetRecord?.player;
    if (!targetPlayer || !targetRecord?.room) {
      sendJson(response, 404, { error: "Player not found." });
      return;
    }
    const amount = clamp(requestedAmount || 2000, 100, 10000);
    withRoomState(targetRecord.room, () => {
      grantScore(targetPlayer, amount);
      pushEvent("admin_score", { admin: adminActorName, target: targetPlayer.name, amount });
    });
  } else if (action === "ban_player") {
    const targetPlayer = findTargetPlayer()?.player;
    if (!targetPlayer) {
      sendJson(response, 404, { error: "Player not found." });
      return;
    }
    if (targetPlayer.accountId) {
      if (!banAccountById(targetPlayer.accountId, "Banned by admin")) {
        sendJson(response, 400, { error: "Unable to ban that account." });
        return;
      }
    } else if (!banGuestByName(targetPlayer.name)) {
      sendJson(response, 400, { error: "Unable to ban that guest." });
      return;
    }
  } else if (action === "ban_account") {
    if (!banAccountById(targetAccountId, "Banned by admin")) {
      sendJson(response, 400, { error: "Unable to ban that account." });
      return;
    }
  } else if (action === "ban_guest_name") {
    if (!banGuestByName(targetGuestName)) {
      sendJson(response, 400, { error: "Unable to ban that guest profile." });
      return;
    }
  } else if (action === "kick_account_sessions") {
    if (!kickSessionsForAccount(targetAccountId)) {
      sendJson(response, 400, { error: "Unable to kick that account's sessions." });
      return;
    }
  } else if (action === "kick_guest_sessions") {
    if (!kickSessionsForGuest(targetGuestName)) {
      sendJson(response, 400, { error: "Unable to kick that guest's sessions." });
      return;
    }
  } else if (action === "unban_account") {
    if (!unbanAccountById(targetAccountId)) {
      sendJson(response, 400, { error: "Unable to unban that account." });
      return;
    }
  } else if (action === "reset_account_progress") {
    if (!resetAccountProgressById(targetAccountId)) {
      sendJson(response, 400, { error: "Unable to reset that account." });
      return;
    }
  } else if (action === "unban_guest") {
    if (!unbanGuestByName(targetGuestName)) {
      sendJson(response, 400, { error: "Unable to unban that guest." });
      return;
    }
  } else if (action === "respawn_player") {
    const targetRecord = findTargetPlayer();
    const targetPlayer = targetRecord?.player;
    if (!targetPlayer || targetPlayer.isAdmin || !targetRecord?.room) {
      sendJson(response, 400, { error: "Unable to respawn that player." });
      return;
    }
    withRoomState(targetRecord.room, () => resetPlayer(targetPlayer));
  } else if (action === "kill_player") {
    const targetRecord = findTargetPlayer();
    const targetPlayer = targetRecord?.player;
    if (!targetPlayer || targetPlayer.isAdmin || !targetRecord?.room) {
      sendJson(response, 400, { error: "Unable to collapse that player." });
      return;
    }
    targetPlayer.health = 0;
    targetPlayer.alive = false;
    targetPlayer.respawnTimer = 3;
    targetPlayer.workers = [];
    targetPlayer.score = Math.max(0, targetPlayer.score * 0.65);
    withRoomState(targetRecord.room, () => {
      bumpLeaderboardVersion();
      pushEvent("admin_collapse", { admin: adminActorName, target: targetPlayer.name });
    });
  } else if (action === "reset_round") {
    const targetRoom = adminRecord?.room || ensurePublicArenaRoom(SERVER_REGION);
    withRoomState(targetRoom, () => startNextRound());
  } else {
    sendJson(response, 400, { error: "Unknown admin action." });
    return;
  }

  auditLog("admin.action", { admin: admin.account.username, action, targetPlayerId, targetAccountId, targetGuestName });
  sendJson(response, 200, {
    ok: true,
    profile: buildProfileForSession(admin.session),
    adminState: {
      godMode: Boolean(player?.adminState?.godMode)
    },
    dashboard: adminDashboardPayload(),
    ...sessionResponse(admin.session)
  });
}

function handleSelectSkin(request, response, payload) {
  const session = resolveSession(request, payload);
  if (!session) {
    sendJson(response, 401, { error: "Sign in first." });
    return;
  }
  if (!requireCsrf(request, response, session, payload)) {
    return;
  }

  const skinId = String(payload.skinId || "");
  if (!SKIN_LIBRARY[skinId]) {
    sendJson(response, 400, { error: "Unknown skin." });
    return;
  }

  if (session.mode === "guest") {
    if (!isStarterSkin(skinId)) {
      sendJson(response, 403, { error: "Guests can only use starter skins." });
      return;
    }

    session.selectedSkin = skinId;
  } else {
    const account = getAccountById(session.accountId);
    if (!account) {
      sendJson(response, 401, { error: "Session is no longer valid." });
      return;
    }

    applyLevelUnlocks(account);
    if (!account.ownedSkins.includes(skinId)) {
      sendJson(response, 403, { error: "That skin is still locked." });
      return;
    }

    account.selectedSkin = skinId;
    account.lastSeenAt = Date.now();
    scheduleAccountSave();
  }

  sendJson(response, 200, {
    profile: buildProfileForSession(session),
    ...sessionResponse(session)
  });
}

function handleSelectCard(request, response, payload) {
  const session = resolveSession(request, payload);
  if (!session) {
    sendJson(response, 401, { error: "Sign in first." });
    return;
  }
  if (!requireCsrf(request, response, session, payload)) {
    return;
  }

  const rewardLevel = Number(payload.rewardLevel);
  const cardId = String(payload.cardId || "");
  const resolved = findPlayerBySessionToken(session.token);
  const player = resolved?.player;
  if (!player || !resolved?.room) {
    sendJson(response, 409, { error: "Join the arena first to choose a hive card." });
    return;
  }

  const choiceIndex = player.pendingCardChoices.findIndex((choice) => choice.rewardLevel === rewardLevel);
  if (choiceIndex < 0) {
    sendJson(response, 404, { error: "That hive card choice is no longer available." });
    return;
  }

  const choice = player.pendingCardChoices[choiceIndex];
  if (!choice.options.includes(cardId)) {
    sendJson(response, 400, { error: "Choose 1 of the 3 offered cards." });
    return;
  }

  player.pendingCardChoices.splice(choiceIndex, 1);
  player.claimedCardRewardLevels.push(rewardLevel);
  player.activeCardIds.push(cardId);
  withRoomState(resolved.room, () => {
    syncPlayerBuffsFromAccount(player);
    pushEvent("card_claimed", {
      player: player.name,
      card: CARD_LIBRARY[cardId]?.title || cardId,
      rewardLevel
    });
  });

  sendJson(response, 200, {
    ok: true,
    ...sessionResponse(session)
  });
}

function handleLogout(request, response, payload) {
  const token = parseAuthToken(request, payload);
  const session = getSessionByToken(token);
  if (!requireCsrf(request, response, session, payload)) {
    return;
  }
  if (token) {
    sessions.delete(token);
  }
  auditLog("auth.logout", { sessionMode: session?.mode || "unknown", ip: clientIpForRequest(request) });
  sendJson(response, 200, { ok: true });
}

function resolveRequestedRoom(payload = {}) {
  const roomMode = String(payload.roomMode || "public").trim().toLowerCase();
  const roomRegion = normalizeRoomRegion(payload.roomRegion || SERVER_REGION);
  if (roomMode === "custom") {
    const requestedRoom = getRoomById(payload.roomId);
    if (requestedRoom) {
      return requestedRoom;
    }
    return createRoom({
      roomId: generateRoomId("custom"),
      name: payload.roomName,
      region: roomRegion,
      mode: "custom",
      config: payload.roomConfig || {}
    });
  }
  return ensurePublicArenaRoom(roomRegion);
}

function handleJoin(request, response, payload) {
  const session = resolveSession(request, payload);

  if (!session) {
    sendJson(response, 401, { error: "Choose guest or sign in before joining the arena." });
    return;
  }
  if (!requireCsrf(request, response, session, payload)) {
    return;
  }

  for (const roomState of allRoomStates()) {
    const existingPlayer = Array.from(roomState.players.values()).find((player) => player.sessionToken === session.token);
    if (existingPlayer) {
      sendJson(response, 409, {
        error: `This profile is already in ${roomDisplayName(roomState)}. Return to that session or leave it first.`
      });
      return;
    }
  }

  const room = resolveRequestedRoom(payload);
  if (room.state.players.size >= room.state.config.maxPlayers) {
    sendJson(response, 409, { error: `${roomDisplayName(room.state)} is full.` });
    return;
  }

  const profile = buildProfileForSession(session);
  if (!profile) {
    sendJson(response, 401, { error: "Session is no longer valid." });
    return;
  }

  if ((session.mode === "guest" && isBannedGuestName(session.guestName)) || profile.banned) {
    sendJson(response, 403, { error: session.mode === "guest" ? "This guest profile has been banned." : "This account has been banned." });
    return;
  }

  const player = withRoomState(room, () =>
    createPlayer({
      displayName: profile.displayName,
      selectedSkin: profile.selectedSkin,
      mode: profile.mode,
      sessionToken: session.token,
      accountId: session.mode === "account" ? session.accountId : null,
      isAdmin: Boolean(profile.isAdmin)
    })
  );
  player.roomId = room.id;
  room.state.players.set(player.id, player);
  playerRoomIndex.set(player.id, room.id);
  room.state.lastActiveAt = Date.now();
  withRoomState(room, () => bumpLeaderboardVersion());
  if (player.accountId) {
    incrementAccountStat(player, "totalMatches");
  }

  sendJson(response, 200, {
    playerId: player.id,
    message: "Joined Colony.io",
    room: roomSummary(room.state),
    profile: buildProfileForSession(session),
    ...sessionResponse(session)
  });

  auditLog("arena.join", {
    playerId: player.id,
    name: player.name,
    mode: session.mode,
    roomId: room.id,
    roomName: roomDisplayName(room.state),
    ip: clientIpForRequest(request)
  });
  withRoomState(room, () => pushEvent("join", { playerId: player.id, name: player.name }));
}

function handleSpectate(request, response, payload) {
  const session = resolveSession(request, payload);

  if (!session) {
    sendJson(response, 401, { error: "Choose guest or sign in before spectating." });
    return;
  }
  if (!requireCsrf(request, response, session, payload)) {
    return;
  }

  const profile = buildProfileForSession(session);
  if (!profile) {
    sendJson(response, 401, { error: "Session is no longer valid." });
    return;
  }

  if ((session.mode === "guest" && isBannedGuestName(session.guestName)) || profile.banned) {
    sendJson(response, 403, { error: session.mode === "guest" ? "This guest profile has been banned." : "This account has been banned." });
    return;
  }

  const room = resolveRequestedRoom(payload);
  const spectator = createSpectatorSession(session, room.id);
  room.state.lastActiveAt = Date.now();
  sendJson(response, 200, {
    spectatorId: spectator.id,
    message: "Spectating Colony.io",
    room: roomSummary(room.state),
    profile,
    ...sessionResponse(session)
  });
  auditLog("arena.spectate", {
    spectatorId: spectator.id,
    mode: session.mode,
    roomId: room.id,
    roomName: roomDisplayName(room.state),
    ip: clientIpForRequest(request)
  });
}

function serveFile(filePath, response) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(
      200,
      applySecurityHeaders({
        "Content-Type": contentType,
        "Cache-Control": "no-store"
      })
    );
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const requestIp = clientIpForRequest(request);

  if (request.method === "GET" && requestUrl.pathname === "/healthz") {
    const roomStates = allRoomStates();
    sendJson(response, isShuttingDown ? 503 : 200, {
      ok: !isShuttingDown,
      shuttingDown: isShuttingDown,
      players: roomStates.reduce((sum, roomState) => sum + roomState.players.size, 0),
      spectators: roomStates.reduce((sum, roomState) => sum + roomState.spectators.size, 0),
      rooms: roomStates.length,
      region: SERVER_REGION,
      version: versionPayload()
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/version") {
    sendJson(response, 200, versionPayload());
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/rooms") {
    sendJson(response, 200, {
      serverRegion: SERVER_REGION,
      supportedRegions: ROOM_REGIONS,
      version: versionPayload(),
      rooms: publicRoomsPayload()
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/auth/me") {
    handleAuthMe(request, response);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/admin/accounts-preview") {
    handleAdminAccountsPreview(request, response);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/admin/dashboard") {
    handleAdminDashboard(request, response);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/admin") {
    serveFile(path.join(PUBLIC_DIR, "admin.html"), response);
    return;
  }

  if (request.method === "POST") {
    const isAuthPath =
      requestUrl.pathname === "/auth/register" || requestUrl.pathname === "/auth/login" || requestUrl.pathname === "/auth/guest";
    const isAdminPath = requestUrl.pathname === "/admin/action";
    const isWritePath = isAuthPath || isAdminPath || requestUrl.pathname === "/join" || requestUrl.pathname === "/spectate";

    if (isAuthPath && !requireRateLimit(response, "auth", requestIp, AUTH_RATE_LIMIT_WINDOW_MS, AUTH_RATE_LIMIT_MAX, "Too many auth requests.")) {
      return;
    }
    if (isAdminPath && !requireRateLimit(response, "admin", requestIp, ADMIN_RATE_LIMIT_WINDOW_MS, ADMIN_RATE_LIMIT_MAX, "Too many admin requests.")) {
      return;
    }
    if (isWritePath && !requireRateLimit(response, "write", requestIp, WRITE_RATE_LIMIT_WINDOW_MS, WRITE_RATE_LIMIT_MAX, "Too many action requests.")) {
      return;
    }

    const bodyBuffer = await readBody(request).catch((error) => error || null);
    if (bodyBuffer instanceof Error) {
      if (bodyBuffer.message === "BODY_TOO_LARGE") {
        sendJson(response, 413, { error: "Request body too large." });
        return;
      }
      sendJson(response, 400, { error: "Unable to read request body." });
      return;
    }
    const payload = bodyBuffer ? parseJsonSafe(bodyBuffer.toString("utf8") || "{}") : null;

    if (!payload) {
      sendJson(response, 400, { error: "Invalid JSON payload." });
      return;
    }

    if (requestUrl.pathname === "/auth/register") {
      handleRegister(request, response, payload);
      return;
    }

    if (requestUrl.pathname === "/auth/login") {
      handleLogin(request, response, payload);
      return;
    }

    if (requestUrl.pathname === "/auth/guest") {
      handleGuest(request, response, payload);
      return;
    }

    if (requestUrl.pathname === "/auth/select-skin") {
      handleSelectSkin(request, response, payload);
      return;
    }

    if (requestUrl.pathname === "/auth/select-card") {
      handleSelectCard(request, response, payload);
      return;
    }

    if (requestUrl.pathname === "/auth/logout") {
      handleLogout(request, response, payload);
      return;
    }

    if (requestUrl.pathname === "/join") {
      handleJoin(request, response, payload);
      return;
    }

    if (requestUrl.pathname === "/spectate") {
      handleSpectate(request, response, payload);
      return;
    }

    if (requestUrl.pathname === "/admin/action") {
      handleAdminAction(request, response, payload);
      return;
    }
  }

  const safePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const normalized = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!normalized.startsWith(PUBLIC_DIR)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  serveFile(normalized, response);
});

const webSocketServer = new WebSocketServer({ server, perMessageDeflate: false, maxPayload: MAX_WS_PAYLOAD_BYTES });

function markSocketAlive() {
  this.isAlive = true;
}

const socketHeartbeatTimer = setInterval(() => {
  for (const socket of webSocketServer.clients) {
    if (socket.isAlive === false) {
      socket.terminate();
      continue;
    }

    socket.isAlive = false;
    try {
      socket.ping();
    } catch {}
  }
}, SOCKET_HEARTBEAT_INTERVAL_MS);

webSocketServer.on("close", () => {
  clearInterval(socketHeartbeatTimer);
});

webSocketServer.on("connection", (socket, request) => {
  socket._socket?.setNoDelay(true);
  socket._socket?.setKeepAlive(true, 30000);
  socket.isAlive = true;
  socket.messageWindowStart = Date.now();
  socket.messageWindowCount = 0;
  socket.on("pong", markSocketAlive);
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const playerId = requestUrl.searchParams.get("playerId");
  const spectatorId = requestUrl.searchParams.get("spectatorId");

  if (spectatorId) {
    const resolved = findSpectatorRoom(spectatorId);
    const spectator = resolved?.spectator;
    const room = resolved?.room;

    if (!spectator || !room) {
      socket.close(1008, "Unknown spectator");
      return;
    }

    if (spectator.socket && spectator.socket !== socket) {
      try {
        spectator.socket.close(4002, "Spectator reconnected");
      } catch {}
    }
    spectator.socket = socket;
    spectator.netState = { resourcesVersion: 0, leaderboardVersion: 0, profileSent: false };
    socket.send(JSON.stringify({ type: "welcome", spectatorId: spectator.id, spectating: true }));
    socket.send(JSON.stringify(withRoomState(room, () => snapshotForViewer({ sessionToken: spectator.sessionToken, spectatorMode: true, viewerState: spectator.netState }))));

    socket.on("message", (rawMessage) => {
      const now = Date.now();
      if (now - socket.messageWindowStart > INPUT_RATE_WINDOW_MS) {
        socket.messageWindowStart = now;
        socket.messageWindowCount = 0;
      }
      socket.messageWindowCount += 1;
      if (socket.messageWindowCount > MAX_INPUT_MESSAGES_PER_WINDOW) {
        socket.close(1008, "Rate limit exceeded");
        return;
      }
      try {
        const message = JSON.parse(rawMessage.toString("utf8"));
        if (message.type !== "ping") {
          return;
        }

        socket.send(
          JSON.stringify({
            type: "pong",
            clientTime: Number(message.clientTime) || 0,
            serverTime: Date.now()
          })
        );
      } catch {}
    });

    socket.on("close", () => {
      if (room.state.spectators.get(spectator.id)?.socket === socket) {
        room.state.spectators.delete(spectator.id);
        spectatorRoomIndex.delete(spectator.id);
      }
      logStructured("info", "socket.spectator.closed", { spectatorId: spectator.id });
    });
    socket.on("error", (error) => {
      logStructured("warn", "socket.spectator.error", { spectatorId: spectator.id, message: error.message });
    });
    return;
  }

  const resolved = findPlayerRoom(playerId);
  const player = resolved?.player;
  const room = resolved?.room;

  if (!player || !room) {
    socket.close(1008, "Unknown player");
    return;
  }

  if (player.socket && player.socket !== socket) {
    try {
      player.socket.close(4002, "Player reconnected");
    } catch {}
  }
  player.socket = socket;
  player.netState = { resourcesVersion: 0, leaderboardVersion: 0, profileSent: false };
  socket.send(JSON.stringify({ type: "welcome", playerId: player.id, name: player.name }));
  socket.send(JSON.stringify(withRoomState(room, () => snapshotForViewer({ playerId: player.id, viewerState: player.netState }))));

  socket.on("message", (rawMessage) => {
    const now = Date.now();
    if (now - socket.messageWindowStart > INPUT_RATE_WINDOW_MS) {
      socket.messageWindowStart = now;
      socket.messageWindowCount = 0;
    }
    socket.messageWindowCount += 1;
    if (socket.messageWindowCount > MAX_INPUT_MESSAGES_PER_WINDOW) {
      socket.close(1008, "Rate limit exceeded");
      return;
    }

    try {
      const message = JSON.parse(rawMessage.toString("utf8"));
      if (message.type === "ping") {
        socket.send(
          JSON.stringify({
            type: "pong",
            clientTime: Number(message.clientTime) || 0,
            serverTime: Date.now()
          })
        );
        return;
      }

      if (message.type !== "input") {
        return;
      }

      player.lastInputAt = Date.now();
      player.input = {
        inputSeq: Math.max(0, Math.floor(finiteNumber(message.inputSeq, player.input.inputSeq || 0))),
        x: clamp(finiteNumber(message.x, 0), -1, 1),
        y: clamp(finiteNumber(message.y, 0), -1, 1),
        boost: Boolean(message.boost),
        hatch: Boolean(message.hatch),
        merge: Boolean(message.merge),
        split: Boolean(message.split),
        attack: Boolean(message.attack),
        pointerX: finiteNumber(message.pointerX, player.x),
        pointerY: finiteNumber(message.pointerY, player.y)
      };
      player.lastInputSeq = player.input.inputSeq;
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", message: "Bad input packet." }));
    }
  });

  socket.on("close", (code, reasonBuffer) => {
    const reason = String(reasonBuffer || "");
    if (room.state.players.has(player.id) && room.state.players.get(player.id)?.socket === socket) {
      room.state.players.delete(player.id);
      playerRoomIndex.delete(player.id);
      room.state.lastActiveAt = Date.now();
      withRoomState(room, () => {
        bumpLeaderboardVersion();
        pushEvent("leave", { playerId: player.id, name: player.name });
      });
    }
    logStructured("info", "socket.player.closed", { playerId: player.id, code, reason });
  });
  socket.on("error", (error) => {
    logStructured("warn", "socket.player.error", { playerId: player.id, message: error.message });
  });
});

setInterval(() => {
  for (const room of rooms.values()) {
    withRoomState(room, () => updateGame());
  }
}, 1000 / TICK_RATE);
setInterval(() => {
  for (const room of rooms.values()) {
    withRoomState(room, () => broadcastGameState());
  }
}, 1000 / BROADCAST_RATE);
setInterval(pruneExpiredSessions, SESSION_CLEANUP_INTERVAL_MS).unref();

async function shutdownGracefully(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  try {
    await flushAccountSaveNow();
  } catch (error) {
    logStructured("error", "shutdown.flush.failed", { signal, message: error.message });
  }

  for (const roomState of allRoomStates()) {
    for (const player of roomState.players.values()) {
      try {
        player.socket?.close(1001, "Server shutting down");
      } catch {}
    }

    for (const spectator of roomState.spectators.values()) {
      try {
        spectator.socket?.close(1001, "Server shutting down");
      } catch {}
    }
  }

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(0);
  }, 5000).unref();
}

process.on("SIGTERM", () => shutdownGracefully("SIGTERM"));
process.on("SIGINT", () => shutdownGracefully("SIGINT"));

async function bootstrap() {
  await initializePersistence();
  ensurePublicArenaRoom(SERVER_REGION);
  for (const account of accountStore.accounts) {
    applyLevelUnlocks(account);
  }
  ensureAdminAccount();
  scheduleAccountSave();
  server.listen(PORT, () => {
    logStructured("info", "server.started", {
      port: PORT,
      persistence: persistence?.mode || "json",
      region: SERVER_REGION,
      version: RELEASE_LABEL,
      channel: DEPLOY_CHANNEL,
      rooms: rooms.size
    });
  });
}

bootstrap().catch((error) => {
  logStructured("error", "server.bootstrap.failed", { message: error.message });
  process.exit(1);
});
