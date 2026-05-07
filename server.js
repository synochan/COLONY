const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
let isShuttingDown = false;

const MAP_WIDTH = 8200;
const MAP_HEIGHT = 5200;
const FOOD_TARGET = 720;
const GROWTH_NODE_TARGET = 42;
const TICK_RATE = 36;
const BROADCAST_RATE = 36;
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
const WORKER_PICKOFF_SCORE_REWARD = 12;
const COLONY_KILL_SCORE_REWARD = 58;
const HIVE_SCORE_STEAL_PCT = 0.42;
const HIVE_SCORE_STEAL_MIN = 30;
const HIVE_SCORE_STEAL_CAP = 780;

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

const state = {
  players: new Map(),
  spectators: new Map(),
  foods: [],
  growthNodes: [],
  events: [],
  nextEventId: 1,
  round: {
    number: 1,
    status: "running",
    winnerPlayerId: null,
    winnerName: "",
    reason: "",
    countdownEndsAt: 0
  }
};

const sessions = new Map();
let lastTick = Date.now();
let saveTimer = null;

function ensureAccountStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(ACCOUNTS_FILE)) {
    fs.writeFileSync(
      ACCOUNTS_FILE,
      JSON.stringify(
        {
          accounts: []
        },
        null,
        2
      )
    );
  }
}

function loadAccountStore() {
  ensureAccountStore();

  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.accounts)) {
      return { accounts: [] };
    }
    return parsed;
  } catch (error) {
    return { accounts: [] };
  }
}

const accountStore = loadAccountStore();

function scheduleAccountSave() {
  if (saveTimer) {
    return;
  }

  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accountStore, null, 2));
  }, 300);
}

function flushAccountSaveNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  ensureAccountStore();
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accountStore, null, 2));
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString("hex")}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  return base * (1 + (owner?.buffState?.workerDamageBonusPct || 0));
}

function workerReach(worker, owner) {
  const base = 10 + worker.radius * 0.85;
  return base * (1 + (owner?.buffState?.workerReachBonusPct || 0));
}

function playerCoreDamage(worker, owner) {
  const base = 7 + worker.radius * 0.36 + scoreFactor(owner.score) * 0.12;
  return base * (1 + (owner?.buffState?.coreDamageBonusPct || 0));
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
  return {
    id: createId("food"),
    x: randomBetween(40, MAP_WIDTH - 40),
    y: randomBetween(40, MAP_HEIGHT - 40),
    size: randomBetween(5, 11),
    value: randomBetween(6, 12)
  };
}

function spawnGrowthNode() {
  const coreRadius = randomBetween(11, 18);
  const ringRadius = coreRadius + randomBetween(12, 22);
  return {
    id: createId("growth"),
    x: randomBetween(ringRadius + 30, MAP_WIDTH - ringRadius - 30),
    y: randomBetween(ringRadius + 30, MAP_HEIGHT - ringRadius - 30),
    coreRadius,
    ringRadius,
    value: randomBetween(110, 180),
    requiredRadius: randomBetween(35, 43)
  };
}

function ensureFoodTarget() {
  if (state.round.status !== "running") {
    return;
  }
  while (state.foods.length < FOOD_TARGET) {
    state.foods.push(spawnFood());
  }
}

function ensureGrowthNodeTarget() {
  if (state.round.status !== "running") {
    return;
  }

  while (state.growthNodes.length < GROWTH_NODE_TARGET) {
    state.growthNodes.push(spawnGrowthNode());
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

function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
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

function isStarterSkin(skinId) {
  return STARTER_SKINS.includes(skinId);
}

function findAccountByUsername(username) {
  const lowered = normalizeUsername(username).toLowerCase();
  return accountStore.accounts.find((account) => account.username.toLowerCase() === lowered) || null;
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

  const level = levelFromXp(account.xp || 0);
  for (const unlock of LEVEL_SKIN_UNLOCKS) {
    if (level >= unlock.level) {
      owned.add(unlock.skinId);
    }
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
    mode: "guest",
    guestName,
    selectedSkin: isStarterSkin(selectedSkin) ? selectedSkin : STARTER_SKINS[0],
    createdAt: Date.now()
  });
  return token;
}

function createSpectatorSession(session) {
  const spectator = {
    id: createId("spectator"),
    sessionToken: session.token,
    socket: null,
    createdAt: Date.now()
  };
  state.spectators.set(spectator.id, spectator);
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
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function refreshPlayerDerivedStats(player) {
  player.radius = playerRadiusForScore(player.score);
  player.healthMax = playerHealthCap(player.score, player);
  player.commandRange = playerCommandRange(player.score, player);
  player.maxEggs = maxEggsForPlayer(player);
  player.maxWorkers = maxWorkersForPlayer(player);
  player.eggScoreStep = eggScoreStepForPlayer(player);
  player.eggs = clamp(player.eggs, 0, player.maxEggs);
  player.health = clamp(player.health, 0, player.healthMax);
}

function resetArenaState() {
  state.foods = [];
  state.growthNodes = [];
  state.events = [];
  state.nextEventId = 1;
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
      x: randomBetween(padding, MAP_WIDTH - padding),
      y: randomBetween(padding, MAP_HEIGHT - padding)
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

  return bestPoint || { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
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
    x: spawnPoint.x,
    y: spawnPoint.y,
    radius: PLAYER_BASE_RADIUS,
    health: PLAYER_BASE_HEALTH,
    healthMax: PLAYER_BASE_HEALTH,
    score: 0,
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

  return player;
}

function playerHiveLevel(player) {
  return player.matchLevel || 1;
}

function playerActiveCards(player) {
  return (player?.activeCardIds || []).map(summarizeCard).filter(Boolean);
}

function serializePlayer(player) {
  return {
    id: player.id,
    name: player.name,
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
    matchXp: Math.round(player.matchXp),
    matchXpIntoLevel: Math.round(player.matchXp - matchXpFloorForLevel(player.matchLevel)),
    matchXpForNextLevel:
      matchXpNeededForNextLevel(player.matchLevel) === null
        ? null
        : matchXpNeededForNextLevel(player.matchLevel) - matchXpFloorForLevel(player.matchLevel),
    eggs: player.eggs,
    maxEggs: player.maxEggs,
    alive: player.alive,
    mergeCooldownMs: Math.max(0, player.mergeCooldownUntil - Date.now()),
    splitCooldownMs: Math.max(0, player.splitCooldownUntil - Date.now()),
    commandRange: Math.round(player.commandRange),
    maxWorkers: player.maxWorkers,
    spawnProtectedMs: Math.max(0, (player.spawnGraceUntil || 0) - Date.now()),
    pendingCardChoices: summarizePlayerPendingChoices(player),
    nextCardRewardLevel: nextPlayerCardRewardLevel(player),
    commandX: Math.round(player.commandPoint.x),
    commandY: Math.round(player.commandPoint.y),
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

function clampPointToMap(point) {
  return {
    x: clamp(point.x, 0, MAP_WIDTH),
    y: clamp(point.y, 0, MAP_HEIGHT)
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
  }
}

function removeGrowthNode(nodeId) {
  const index = state.growthNodes.findIndex((node) => node.id === nodeId);
  if (index >= 0) {
    state.growthNodes.splice(index, 1);
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
  awardAccountXp(player, finalAmount);
  grantMatchXp(player, finalAmount);
}

function spendScore(player, amount) {
  player.score = Math.max(0, player.score - amount);
  refreshPlayerDerivedStats(player);
}

function resetPlayer(player) {
  const replacement = createPlayer({
    displayName: player.name,
    selectedSkin: player.skinId,
    mode: player.profileMode,
    sessionToken: player.sessionToken,
    accountId: player.accountId
  });

  player.x = replacement.x;
  player.y = replacement.y;
  player.radius = replacement.radius;
  player.health = replacement.health;
  player.healthMax = replacement.healthMax;
  player.score = 0;
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
  pushEvent("respawn", { playerId: player.id, name: player.name });
}

function collapsePlayer(attacker, victim) {
  victim.alive = false;
  victim.respawnTimer = 3;
  victim.workers = [];
  victim.health = 0;
  const stolenScore = clamp(victim.score * HIVE_SCORE_STEAL_PCT, HIVE_SCORE_STEAL_MIN, HIVE_SCORE_STEAL_CAP);
  attacker.health = clamp(attacker.health + 20, 0, attacker.healthMax);
  grantScore(attacker, COLONY_KILL_SCORE_REWARD);
  grantScore(attacker, stolenScore);
  incrementAccountStat(attacker, "totalKills");
  pushEvent("colony_down", {
    attacker: attacker.name,
    victim: victim.name,
    stolenScore: Math.round(stolenScore)
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
  worker.x = clamp(worker.x, worker.radius + 2, MAP_WIDTH - worker.radius - 2);
  worker.y = clamp(worker.y, worker.radius + 2, MAP_HEIGHT - worker.radius - 2);
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
  merged.food = bestPair.first.food + bestPair.second.food + MERGE_BONUS_FOOD;
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
  entity.x = clamp(entity.x, padding, MAP_WIDTH - padding);
  entity.y = clamp(entity.y, padding, MAP_HEIGHT - padding);
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
    moveEntity(worker, fallback.x, fallback.y, workerSpeed(worker, player), deltaSeconds, worker.radius + 2);
    clampWorkerToCommandRange(player, worker);
    if (commandedNode) {
      tryConsumeNearbyGrowthNode(player, worker);
    } else if (commandedFood) {
      tryConsumeNearbyFood(player, worker);
    }
    return;
  }

  const targetPosition = target.kind === "worker" ? target.worker : target.player;
  moveEntity(worker, targetPosition.x, targetPosition.y, workerSpeed(worker, player), deltaSeconds, worker.radius + 2);
  clampWorkerToCommandRange(player, worker);

  if (target.kind === "worker") {
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
  player.x = clamp(player.x, player.radius, MAP_WIDTH - player.radius);
  player.y = clamp(player.y, player.radius, MAP_HEIGHT - player.radius);
  player.knockbackX *= 0.48;
  player.knockbackY *= 0.48;
  player.health = clamp(player.health + playerHealthRegen(player) * deltaSeconds, 0, player.healthMax);

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
}

function updateGame() {
  const now = Date.now();
  const deltaSeconds = Math.min((now - lastTick) / 1000, 0.05);
  lastTick = now;

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
  if (topPlayer && topPlayer.score >= ROUND_SCORE_TARGET) {
    endRound(topPlayer, "score_target");
  }
}

function buildLeaderboard(players) {
  return players
    .map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      workers: player.workers.length
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, LEADERBOARD_SIZE);
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

function snapshotForViewer({ playerId = null, sessionToken = "", spectatorMode = false, spectatorFocusId = null } = {}) {
  const players = Array.from(state.players.values()).map(serializePlayer);
  const leaderboard = buildLeaderboard(players);
  const profileSession = sessionToken ? getSessionByToken(sessionToken) : state.players.get(playerId) ? getSessionByToken(state.players.get(playerId).sessionToken) : null;
  const resolvedFocusId = spectatorMode ? resolveSpectatorFocusId(players, spectatorFocusId) : null;

  return {
    type: "state",
    you: playerId,
    spectator: {
      active: spectatorMode,
      focusPlayerId: resolvedFocusId
    },
    serverTime: Date.now(),
    config: {
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,
      roundScoreTarget: ROUND_SCORE_TARGET,
      tickRate: TICK_RATE,
      broadcastRate: BROADCAST_RATE
    },
    players,
    foods: state.foods,
    growthNodes: state.growthNodes,
    leaderboard,
    recentEvents: state.events.slice(-8),
    profile: buildProfileForSession(profileSession),
    round: {
      number: state.round.number,
      status: state.round.status,
      winnerPlayerId: state.round.winnerPlayerId,
      winnerName: state.round.winnerName,
      reason: state.round.reason,
      countdownMs: Math.max(0, state.round.countdownEndsAt - Date.now())
    }
  };
}

function broadcastGameState() {
  for (const player of state.players.values()) {
    if (player.socket?.readyState === 1) {
      player.socket.send(JSON.stringify(snapshotForViewer({ playerId: player.id })));
    }
  }

  for (const spectator of state.spectators.values()) {
    if (spectator.socket?.readyState === 1) {
      spectator.socket.send(
        JSON.stringify(snapshotForViewer({ sessionToken: spectator.sessionToken, spectatorMode: true }))
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

  if (password.length < 4) {
    sendJson(response, 400, { error: "Password must be at least 4 characters." });
    return;
  }

  if (findAccountByUsername(username)) {
    sendJson(response, 409, { error: "That username is already taken." });
    return;
  }

  const salt = crypto.randomBytes(8).toString("hex");
  const account = {
    id: createId("acct"),
    username,
    salt,
    passwordHash: hashPassword(password, salt),
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
  sendJson(response, 200, {
    authToken,
    profile: summarizeAccount(account)
  });
}

function handleLogin(response, payload) {
  const username = normalizeUsername(payload.username);
  const password = String(payload.password || "");
  const account = findAccountByUsername(username);

  if (!account || account.passwordHash !== hashPassword(password, account.salt)) {
    sendJson(response, 401, { error: "Invalid username or password." });
    return;
  }

  account.lastSeenAt = Date.now();
  applyLevelUnlocks(account);
  scheduleAccountSave();

  const authToken = createSessionForAccount(account);
  sendJson(response, 200, {
    authToken,
    profile: summarizeAccount(account)
  });
}

function handleGuest(response, payload) {
  const guestName = sanitizeGuestName(payload.name);
  const selectedSkin = isStarterSkin(payload.starterSkin) ? payload.starterSkin : STARTER_SKINS[0];
  const authToken = createGuestSession(guestName, selectedSkin);
  sendJson(response, 200, {
    authToken,
    profile: summarizeGuestSession(getSessionByToken(authToken))
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

  sendJson(response, 200, { profile });
}

function handleSelectSkin(request, response, payload) {
  const session = resolveSession(request, payload);
  if (!session) {
    sendJson(response, 401, { error: "Sign in first." });
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
    profile: buildProfileForSession(session)
  });
}

function handleSelectCard(request, response, payload) {
  const session = resolveSession(request, payload);
  if (!session) {
    sendJson(response, 401, { error: "Sign in first." });
    return;
  }

  const rewardLevel = Number(payload.rewardLevel);
  const cardId = String(payload.cardId || "");
  const player = Array.from(state.players.values()).find((entry) => entry.sessionToken === session.token);
  if (!player) {
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
  syncPlayerBuffsFromAccount(player);
  pushEvent("card_claimed", {
    player: player.name,
    card: CARD_LIBRARY[cardId]?.title || cardId,
    rewardLevel
  });

  sendJson(response, 200, {
    ok: true
  });
}

function handleLogout(request, response, payload) {
  const token = parseAuthToken(request, payload);
  if (token) {
    sessions.delete(token);
  }
  sendJson(response, 200, { ok: true });
}

function handleJoin(request, response, payload) {
  const session = resolveSession(request, payload);

  if (!session) {
    sendJson(response, 401, { error: "Choose guest or sign in before joining the arena." });
    return;
  }

  if (state.players.size >= MAX_PLAYERS) {
    sendJson(response, 409, { error: `Room is full. Colony.io supports up to ${MAX_PLAYERS} concurrent players.` });
    return;
  }

  const existingPlayer = Array.from(state.players.values()).find((player) => player.sessionToken === session.token);
  if (existingPlayer) {
    sendJson(response, 409, { error: "This profile is already in the arena. Return to that session or leave it first." });
    return;
  }

  const profile = buildProfileForSession(session);
  if (!profile) {
    sendJson(response, 401, { error: "Session is no longer valid." });
    return;
  }

  const player = createPlayer({
    displayName: profile.displayName,
    selectedSkin: profile.selectedSkin,
    mode: profile.mode,
    sessionToken: session.token,
    accountId: session.mode === "account" ? session.accountId : null
  });

  state.players.set(player.id, player);
  if (player.accountId) {
    incrementAccountStat(player, "totalMatches");
  }

  sendJson(response, 200, {
    playerId: player.id,
    message: "Joined Colony.io",
    profile: buildProfileForSession(session)
  });

  pushEvent("join", { playerId: player.id, name: player.name });
}

function handleSpectate(request, response, payload) {
  const session = resolveSession(request, payload);

  if (!session) {
    sendJson(response, 401, { error: "Choose guest or sign in before spectating." });
    return;
  }

  const profile = buildProfileForSession(session);
  if (!profile) {
    sendJson(response, 401, { error: "Session is no longer valid." });
    return;
  }

  const spectator = createSpectatorSession(session);
  sendJson(response, 200, {
    spectatorId: spectator.id,
    message: "Spectating Colony.io",
    profile
  });
}

function serveFile(filePath, response) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    response.end(content);
  });
}

for (const account of accountStore.accounts) {
  applyLevelUnlocks(account);
}
scheduleAccountSave();

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && requestUrl.pathname === "/healthz") {
    sendJson(response, isShuttingDown ? 503 : 200, {
      ok: !isShuttingDown,
      shuttingDown: isShuttingDown,
      players: state.players.size,
      spectators: state.spectators.size,
      round: state.round.status
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/auth/me") {
    handleAuthMe(request, response);
    return;
  }

  if (request.method === "POST") {
    const bodyBuffer = await readBody(request).catch(() => null);
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
      handleLogin(response, payload);
      return;
    }

    if (requestUrl.pathname === "/auth/guest") {
      handleGuest(response, payload);
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
  }

  const safePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const normalized = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!normalized.startsWith(PUBLIC_DIR)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  serveFile(normalized, response);
});

const webSocketServer = new WebSocketServer({ server });

webSocketServer.on("connection", (socket, request) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const playerId = requestUrl.searchParams.get("playerId");
  const spectatorId = requestUrl.searchParams.get("spectatorId");

  if (spectatorId) {
    const spectator = state.spectators.get(spectatorId);

    if (!spectator) {
      socket.close(1008, "Unknown spectator");
      return;
    }

    spectator.socket = socket;
    socket.send(JSON.stringify({ type: "welcome", spectatorId: spectator.id, spectating: true }));
    socket.send(JSON.stringify(snapshotForViewer({ sessionToken: spectator.sessionToken, spectatorMode: true })));

    socket.on("message", (rawMessage) => {
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
      state.spectators.delete(spectator.id);
    });
    return;
  }

  const player = state.players.get(playerId);

  if (!player) {
    socket.close(1008, "Unknown player");
    return;
  }

  player.socket = socket;
  socket.send(JSON.stringify({ type: "welcome", playerId: player.id, name: player.name }));
  socket.send(JSON.stringify(snapshotForViewer({ playerId: player.id })));

  socket.on("message", (rawMessage) => {
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
        x: Number(message.x) || 0,
        y: Number(message.y) || 0,
        boost: Boolean(message.boost),
        hatch: Boolean(message.hatch),
        merge: Boolean(message.merge),
        split: Boolean(message.split),
        attack: Boolean(message.attack),
        pointerX: Number(message.pointerX),
        pointerY: Number(message.pointerY)
      };
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", message: "Bad input packet." }));
    }
  });

  socket.on("close", () => {
    if (state.players.has(player.id)) {
      state.players.delete(player.id);
      pushEvent("leave", { playerId: player.id, name: player.name });
    }
  });
});

setInterval(updateGame, 1000 / TICK_RATE);
setInterval(broadcastGameState, 1000 / BROADCAST_RATE);

function shutdownGracefully(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  try {
    flushAccountSaveNow();
  } catch (error) {
    console.error("Failed to flush account data during shutdown:", error);
  }

  for (const player of state.players.values()) {
    try {
      player.socket?.close(1001, "Server shutting down");
    } catch {}
  }

  for (const spectator of state.spectators.values()) {
    try {
      spectator.socket?.close(1001, "Server shutting down");
    } catch {}
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

server.listen(PORT, () => {
  console.log(`Colony.io server running on http://localhost:${PORT}`);
});
