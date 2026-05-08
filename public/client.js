const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const statusText = document.getElementById("statusText");
const playerStats = document.getElementById("playerStats");
const activeBuffs = document.getElementById("activeBuffs");
const buffTooltip = document.getElementById("buffTooltip");
const leaderboard = document.getElementById("leaderboard");
const joinOverlay = document.getElementById("joinOverlay");
const networkPanel = document.getElementById("networkPanel");
const optionsToggleButton = document.getElementById("optionsToggleButton");
const adminPanel = document.getElementById("adminPanel");
const adminNetworkDashboard = document.getElementById("adminNetworkDashboard");
const adminPlayersDashboard = document.getElementById("adminPlayersDashboard");
const adminAccountsDashboard = document.getElementById("adminAccountsDashboard");
const adminGuestsDashboard = document.getElementById("adminGuestsDashboard");
const cardChoiceOverlay = document.getElementById("cardChoiceOverlay");
const cardChoiceTitle = document.getElementById("cardChoiceTitle");
const cardChoiceText = document.getElementById("cardChoiceText");
const cardChoiceGrid = document.getElementById("cardChoiceGrid");
const cardChoiceHint = document.getElementById("cardChoiceHint");
const optionsOverlay = document.getElementById("optionsOverlay");
const closeOptionsButton = document.getElementById("closeOptionsButton");
const openOptionsMenuButton = document.getElementById("openOptionsMenuButton");
const muteAllToggle = document.getElementById("muteAllToggle");
const lowGraphicsToggle = document.getElementById("lowGraphicsToggle");
const masterVolumeInput = document.getElementById("masterVolumeInput");
const musicVolumeInput = document.getElementById("musicVolumeInput");
const sfxVolumeInput = document.getElementById("sfxVolumeInput");
const masterVolumeValue = document.getElementById("masterVolumeValue");
const musicVolumeValue = document.getElementById("musicVolumeValue");
const sfxVolumeValue = document.getElementById("sfxVolumeValue");
const authMessage = document.getElementById("authMessage");
const authUnauthed = document.getElementById("authUnauthed");
const authAuthed = document.getElementById("authAuthed");
const profileSummary = document.getElementById("profileSummary");
const roomModeSelect = document.getElementById("roomModeSelect");
const roomRegionLabel = document.getElementById("roomRegionLabel");
const roomRegionSelect = document.getElementById("roomRegionSelect");
const roomNameLabel = document.getElementById("roomNameLabel");
const roomNameInput = document.getElementById("roomNameInput");
const roomPickerLabel = document.getElementById("roomPickerLabel");
const roomPickerSelect = document.getElementById("roomPickerSelect");
const roomMaxPlayersInput = document.getElementById("roomMaxPlayersInput");
const roomFoodTargetInput = document.getElementById("roomFoodTargetInput");
const roomGrowthTargetInput = document.getElementById("roomGrowthTargetInput");
const roomGoalInput = document.getElementById("roomGoalInput");
const roomMapWidthInput = document.getElementById("roomMapWidthInput");
const roomMapHeightInput = document.getElementById("roomMapHeightInput");
const roomFoodValueInput = document.getElementById("roomFoodValueInput");
const roomGrowthValueInput = document.getElementById("roomGrowthValueInput");
const roomHiveDamageInput = document.getElementById("roomHiveDamageInput");
const roomWorkerDamageInput = document.getElementById("roomWorkerDamageInput");
const roomListSummary = document.getElementById("roomListSummary");
const ownedSkinGrid = document.getElementById("ownedSkinGrid");
const registerStarterSkins = document.getElementById("registerStarterSkins");
const guestStarterSkins = document.getElementById("guestStarterSkins");
const enterArenaButton = document.getElementById("enterArenaButton");
const spectateButton = document.getElementById("spectateButton");
const openAdminDashboardButton = document.getElementById("openAdminDashboardButton");
const logoutButton = document.getElementById("logoutButton");
const adminRefreshButton = document.getElementById("adminRefreshButton");
const adminTestBuildButton = document.getElementById("adminTestBuildButton");
const adminGodModeButton = document.getElementById("adminGodModeButton");
const adminHealButton = document.getElementById("adminHealButton");
const adminScoreButton = document.getElementById("adminScoreButton");
const adminWorkersButton = document.getElementById("adminWorkersButton");
const adminCooldownsButton = document.getElementById("adminCooldownsButton");
const adminResetRoundButton = document.getElementById("adminResetRoundButton");
const guestButton = document.getElementById("guestButton");
const registerButton = document.getElementById("registerButton");
const loginButton = document.getElementById("loginButton");
const guestNameInput = document.getElementById("guestNameInput");
const registerNameInput = document.getElementById("registerNameInput");
const registerPasswordInput = document.getElementById("registerPasswordInput");
const loginNameInput = document.getElementById("loginNameInput");
const loginPasswordInput = document.getElementById("loginPasswordInput");
const authModeButtons = Array.from(document.querySelectorAll("[data-auth-mode]"));
const authPanels = {
  guest: document.getElementById("guestPanel"),
  register: document.getElementById("registerPanel"),
  login: document.getElementById("loginPanel")
};

const AUTH_TOKEN_KEY = "colony_auth_token";
const CSRF_TOKEN_KEY = "colony_csrf_token";
const SETTINGS_KEY = "colony_settings";
const STARTER_SKINS = ["ember", "tide", "moss"];
const DEFAULT_SETTINGS = Object.freeze({
  muted: false,
  masterVolume: 0.7,
  musicVolume: 0.45,
  sfxVolume: 0.78,
  lowGraphics: false
});
const SKIN_UNLOCK_LEVELS = {
  ember: "Starter",
  tide: "Starter",
  moss: "Starter",
  royal: "Lv 5",
  frost: "Lv 10",
  obsidian: "Lv 20",
  rose: "Lv 30",
  solar: "Lv 40",
  void: "Lv 50"
};
const CARD_RARITY_LABELS = {
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary"
};
const CARD_ART_CODES = {
  "trailblazer-legs": "SPD",
  "tempered-stingers": "DMG",
  "resin-shell": "HP",
  "forager-instinct": "XP",
  "quick-brood": "EGG",
  "queen-plate": "ARM",
  "rally-pheromones": "RNG",
  "rich-spore-vault": "GOLD",
  "nurse-lineage": "NRS",
  "spearhead-drill": "PWR",
  "swarm-foundry": "SWM",
  "war-hymn": "WR",
  "overcharged-glands": "OVR",
  "royal-jelly-reserve": "ROY",
  "shockframe-carapace": "SHK",
  "monarchs-decree": "CROWN",
  "worldroot-heart": "ROOT",
  "cataclysm-brood": "CAT",
  "golden-symphony": "GLD",
  "apex-signal": "APX"
};

const SKINS = {
  ember: {
    id: "ember",
    name: "Ember Scout",
    primary: "#ff9f43",
    secondary: "#ff6b6b",
    worker: "#ffd27a",
    glow: "rgba(255, 159, 67, 0.75)"
  },
  tide: {
    id: "tide",
    name: "Tide Runner",
    primary: "#54a0ff",
    secondary: "#8ce2ff",
    worker: "#d4f2ff",
    glow: "rgba(84, 160, 255, 0.75)"
  },
  moss: {
    id: "moss",
    name: "Moss Crown",
    primary: "#1dd1a1",
    secondary: "#7ef7c8",
    worker: "#d5ffe8",
    glow: "rgba(29, 209, 161, 0.72)"
  },
  royal: {
    id: "royal",
    name: "Royal Bloom",
    primary: "#8d7dff",
    secondary: "#c2a9ff",
    worker: "#f0e0ff",
    glow: "rgba(141, 125, 255, 0.74)"
  },
  frost: {
    id: "frost",
    name: "Frost Veil",
    primary: "#98e7ff",
    secondary: "#ecfcff",
    worker: "#ffffff",
    glow: "rgba(152, 231, 255, 0.8)"
  },
  obsidian: {
    id: "obsidian",
    name: "Obsidian Maw",
    primary: "#5d6175",
    secondary: "#a7b0d0",
    worker: "#d6dbef",
    glow: "rgba(93, 97, 117, 0.8)"
  },
  rose: {
    id: "rose",
    name: "Rose Thorn",
    primary: "#ff6ea8",
    secondary: "#ffd2e4",
    worker: "#fff2f8",
    glow: "rgba(255, 110, 168, 0.78)"
  },
  solar: {
    id: "solar",
    name: "Solar Flare",
    primary: "#ffd166",
    secondary: "#fff0af",
    worker: "#fff9d9",
    glow: "rgba(255, 209, 102, 0.82)"
  },
  void: {
    id: "void",
    name: "Void Monarch",
    primary: "#9a6bff",
    secondary: "#dac8ff",
    worker: "#f4edff",
    glow: "rgba(154, 107, 255, 0.84)"
  }
};

const inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  boost: false,
  hatch: false,
  merge: false,
  split: false,
  attack: false,
  pointerX: 0,
  pointerY: 0
};

const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  browserScale: 1
};

const BASE_WORLD_ZOOM = 0.84;
const MIN_WORLD_ZOOM = 0.36;
const WORKER_RANGE_VIEW_MULTIPLIER = 2;
const ENTITY_SMOOTHING = 0.22;
const CAMERA_SMOOTHING = 0.2;
const ZOOM_SMOOTHING = 0.12;
const INPUT_SEND_INTERVAL_MS = 33;
const PING_INTERVAL_MS = 2000;
const INPUT_HEARTBEAT_MS = 120;
const INPUT_IDLE_HEARTBEAT_MS = 280;
const INPUT_POINTER_SEND_THRESHOLD_WORLD = 2;
const INPUT_POINTER_SIGNATURE_WORLD = 4;
const MAX_CLIENT_SOCKET_BACKLOG_BYTES = 128 * 1024;

const clientState = {
  authToken: localStorage.getItem(AUTH_TOKEN_KEY) || "",
  csrfToken: localStorage.getItem(CSRF_TOKEN_KEY) || "",
  settings: loadSettings(),
  profile: null,
  availableRooms: [],
  supportedRegions: ["singapore"],
  roomSelection: {
    mode: "public",
    region: "singapore",
    roomId: "",
    roomName: "Custom Colony",
    roomConfig: {
      maxPlayers: 16,
      foodTarget: 480,
      growthNodeTarget: 24,
      roundScoreTarget: 12000,
      mapWidth: 8200,
      mapHeight: 5200,
      foodValueMultiplier: 1,
      growthValueMultiplier: 1,
      hiveDamageMultiplier: 1,
      workerDamageMultiplier: 1
    }
  },
  authMode: "guest",
  playerId: null,
  spectatorId: null,
  socket: null,
  snapshot: null,
  renderSnapshot: null,
  cardSelectionPending: false,
  cardOverlayKey: "",
  connected: false,
  spectatorMode: false,
  spectatingFromDeath: false,
  spectatorFocusId: null,
  camera: { x: 0, y: 0, zoom: BASE_WORLD_ZOOM },
  worldPointer: { x: 0, y: 0 },
  pointerInitialized: false,
  pingTimer: null,
  network: {
    pingMs: 0,
    jitterMs: 0,
    snapshotsPerSecond: 0,
    snapshotAgeMs: 0,
    clockOffsetMs: 0,
    inLossPct: 0,
    outLossPct: 0,
    snapshotsReceived: 0,
    snapshotsMissed: 0,
    inputSeq: 0,
    lastAckInputSeq: 0,
    maxSentInputSeq: 0,
    lastPingSentAt: 0,
    lastAckReceivedAt: 0,
    lastSnapshotReceivedAt: 0,
    lastSnapshotIntervalMs: 0,
    lastSnapshotSequence: 0
  },
  lastSentInputSignature: "",
  lastSentInputAt: 0,
  lastSentPointerWorld: { x: 0, y: 0 },
  registerStarterSkin: STARTER_SKINS[0],
  guestStarterSkin: STARTER_SKINS[0],
  adminDashboard: null,
  adminDashboardTimer: null,
  audio: {
    context: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    musicLoopTimer: null,
    musicStep: 0,
    processedEventKeys: [],
    uiPrimed: false
  }
};

function resizeCanvas() {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  viewport.dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewport.browserScale = getBrowserScale();
  canvas.width = Math.floor(viewport.width * viewport.dpr);
  canvas.height = Math.floor(viewport.height * viewport.dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
}

function setStatus(text) {
  if (statusText) {
    statusText.textContent = text;
  }
}

function setAuthMessage(text, isError = false) {
  authMessage.textContent = text || "";
  authMessage.classList.toggle("error", Boolean(isError));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return {
      muted: Boolean(parsed.muted),
      masterVolume: clampUnit(parsed.masterVolume, DEFAULT_SETTINGS.masterVolume),
      musicVolume: clampUnit(parsed.musicVolume, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clampUnit(parsed.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      lowGraphics: Boolean(parsed.lowGraphics)
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function clampUnit(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, numeric));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(clientState.settings));
}

function applySettingsToUi() {
  if (muteAllToggle) {
    muteAllToggle.checked = clientState.settings.muted;
  }
  if (lowGraphicsToggle) {
    lowGraphicsToggle.checked = clientState.settings.lowGraphics;
  }
  if (masterVolumeInput) {
    masterVolumeInput.value = Math.round(clientState.settings.masterVolume * 100);
  }
  if (musicVolumeInput) {
    musicVolumeInput.value = Math.round(clientState.settings.musicVolume * 100);
  }
  if (sfxVolumeInput) {
    sfxVolumeInput.value = Math.round(clientState.settings.sfxVolume * 100);
  }
  if (masterVolumeValue) {
    masterVolumeValue.textContent = `${Math.round(clientState.settings.masterVolume * 100)}%`;
  }
  if (musicVolumeValue) {
    musicVolumeValue.textContent = `${Math.round(clientState.settings.musicVolume * 100)}%`;
  }
  if (sfxVolumeValue) {
    sfxVolumeValue.textContent = `${Math.round(clientState.settings.sfxVolume * 100)}%`;
  }
}

function isLowGraphics() {
  return Boolean(clientState.settings.lowGraphics);
}

function updateAudioMix() {
  if (!clientState.audio.masterGain || !clientState.audio.musicGain || !clientState.audio.sfxGain) {
    return;
  }
  const ctx = clientState.audio.context;
  const now = ctx.currentTime;
  const master = clientState.settings.muted ? 0 : clientState.settings.masterVolume;
  clientState.audio.masterGain.gain.cancelScheduledValues(now);
  clientState.audio.musicGain.gain.cancelScheduledValues(now);
  clientState.audio.sfxGain.gain.cancelScheduledValues(now);
  clientState.audio.masterGain.gain.setTargetAtTime(master, now, 0.08);
  clientState.audio.musicGain.gain.setTargetAtTime(clientState.settings.musicVolume, now, 0.12);
  clientState.audio.sfxGain.gain.setTargetAtTime(clientState.settings.sfxVolume, now, 0.08);
}

function ensureAudioContext() {
  const AudioApi = window.AudioContext || window.webkitAudioContext;
  if (!AudioApi) {
    return null;
  }

  if (!clientState.audio.context) {
    const ctx = new AudioApi();
    const masterGain = ctx.createGain();
    const musicGain = ctx.createGain();
    const sfxGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    clientState.audio.context = ctx;
    clientState.audio.masterGain = masterGain;
    clientState.audio.musicGain = musicGain;
    clientState.audio.sfxGain = sfxGain;
    updateAudioMix();
    startMusicLoop();
  }

  if (clientState.audio.context.state === "suspended") {
    clientState.audio.context.resume().catch(() => {});
  }

  return clientState.audio.context;
}

function startMusicLoop() {
  if (clientState.audio.musicLoopTimer) {
    return;
  }
  queueMusicPhrase();
  clientState.audio.musicLoopTimer = window.setInterval(queueMusicPhrase, 2600);
}

function queueMusicPhrase() {
  const ctx = ensureAudioContext();
  if (!ctx || !clientState.audio.musicGain) {
    return;
  }

  const baseSequence = [220, 261.63, 293.66, 329.63, 293.66, 261.63];
  const stepOffset = clientState.audio.musicStep % baseSequence.length;
  const startAt = ctx.currentTime + 0.05;
  for (let index = 0; index < 4; index += 1) {
    const frequency = baseSequence[(stepOffset + index) % baseSequence.length];
    playTone({
      frequency,
      duration: 1.6,
      when: startAt + index * 0.38,
      gain: 0.035,
      type: index % 2 === 0 ? "sine" : "triangle",
      channel: "music",
      attack: 0.08,
      release: 0.45
    });
  }
  playTone({
    frequency: baseSequence[stepOffset] / 2,
    duration: 2.1,
    when: startAt,
    gain: 0.022,
    type: "sine",
    channel: "music",
    attack: 0.12,
    release: 0.7
  });
  clientState.audio.musicStep += 1;
}

function playTone({
  frequency = 440,
  duration = 0.15,
  when = 0,
  gain = 0.08,
  type = "sine",
  channel = "sfx",
  attack = 0.01,
  release = 0.08,
  detune = 0
} = {}) {
  const ctx = ensureAudioContext();
  if (!ctx) {
    return;
  }

  const targetGain = channel === "music" ? clientState.audio.musicGain : clientState.audio.sfxGain;
  if (!targetGain) {
    return;
  }

  const startAt = Math.max(ctx.currentTime, when || ctx.currentTime);
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.detune.setValueAtTime(detune, startAt);
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.linearRampToValueAtTime(gain, startAt + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration + release);
  oscillator.connect(envelope);
  envelope.connect(targetGain);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + release + 0.02);
}

function playUiClickSound() {
  if (clientState.settings.muted) {
    return;
  }
  playTone({ frequency: 720, duration: 0.04, gain: 0.07, type: "triangle", attack: 0.004, release: 0.04 });
  playTone({ frequency: 940, duration: 0.03, gain: 0.04, type: "sine", when: ensureAudioContext()?.currentTime + 0.015 || 0 });
}

function playEventSound(event) {
  if (!event || clientState.settings.muted) {
    return;
  }

  if (event.type === "hatch") {
    playTone({ frequency: 480, duration: 0.08, gain: 0.08, type: "triangle" });
    playTone({ frequency: 660, duration: 0.06, gain: 0.05, type: "sine", when: ensureAudioContext()?.currentTime + 0.03 || 0 });
    return;
  }
  if (event.type === "worker_split") {
    playTone({ frequency: 540, duration: 0.07, gain: 0.08, type: "square", detune: -60 });
    playTone({ frequency: 690, duration: 0.07, gain: 0.05, type: "square", detune: 40, when: ensureAudioContext()?.currentTime + 0.02 || 0 });
    return;
  }
  if (event.type === "growth_node") {
    playTone({ frequency: 360, duration: 0.14, gain: 0.09, type: "triangle", attack: 0.02, release: 0.14 });
    playTone({ frequency: 540, duration: 0.14, gain: 0.05, type: "sine", when: ensureAudioContext()?.currentTime + 0.05 || 0 });
    return;
  }
  if (event.type === "worker_pickoff") {
    playTone({ frequency: 220, duration: 0.08, gain: 0.08, type: "sawtooth", release: 0.08 });
    return;
  }
  if (event.type === "colony_down") {
    playTone({ frequency: 240, duration: 0.22, gain: 0.1, type: "sawtooth", attack: 0.01, release: 0.25, detune: -120 });
    return;
  }
  if (event.type === "card_claimed") {
    playTone({ frequency: 520, duration: 0.08, gain: 0.08, type: "triangle" });
    playTone({ frequency: 780, duration: 0.1, gain: 0.06, type: "sine", when: ensureAudioContext()?.currentTime + 0.04 || 0 });
  }
}

function processRecentEvents(recentEvents) {
  if (!Array.isArray(recentEvents) || !recentEvents.length) {
    return;
  }

  for (const entry of recentEvents) {
    const signature = `${entry.type}:${entry.playerId || ""}:${entry.targetPlayerId || ""}:${entry.workerId || ""}:${entry.time || ""}:${entry.rewardLevel || ""}`;
    if (clientState.audio.processedEventKeys.includes(signature)) {
      continue;
    }
    clientState.audio.processedEventKeys.push(signature);
    if (clientState.audio.processedEventKeys.length > 80) {
      clientState.audio.processedEventKeys.splice(0, clientState.audio.processedEventKeys.length - 80);
    }
    playEventSound(entry);
  }
}

function setSetting(key, value) {
  if (!(key in clientState.settings)) {
    return;
  }
  clientState.settings[key] = value;
  saveSettings();
  applySettingsToUi();
  updateAudioMix();
}

function openOptionsMenu() {
  applySettingsToUi();
  optionsOverlay?.classList.remove("hidden");
}

function closeOptionsMenu() {
  optionsOverlay?.classList.add("hidden");
}

function isOptionsMenuOpen() {
  return Boolean(optionsOverlay && !optionsOverlay.classList.contains("hidden"));
}

function getSkin(skinId) {
  return SKINS[skinId] || SKINS.ember;
}

function getBrowserScale() {
  const viewportScale = window.visualViewport?.scale;
  const desktopFallback =
    window.outerWidth && window.innerWidth ? window.outerWidth / Math.max(window.innerWidth, 1) : 1;
  const scale = viewportScale && Number.isFinite(viewportScale) && viewportScale > 0 ? viewportScale : desktopFallback;
  return Math.max(0.5, Math.min(2, scale));
}

function worldRenderScale() {
  return clientState.camera.zoom * (1 / viewport.browserScale);
}

function effectiveViewportWidth() {
  return viewport.width * viewport.browserScale;
}

function effectiveViewportHeight() {
  return viewport.height * viewport.browserScale;
}

function scaleWorld(value) {
  return value * worldRenderScale();
}

function worldToScreen(x, y) {
  return {
    x: (x - clientState.camera.x) * worldRenderScale() + viewport.width / 2,
    y: (y - clientState.camera.y) * worldRenderScale() + viewport.height / 2
  };
}

function screenToWorld(x, y) {
  return {
    x: (x - viewport.width / 2) / worldRenderScale() + clientState.camera.x,
    y: (y - viewport.height / 2) / worldRenderScale() + clientState.camera.y
  };
}

function desiredZoomForPlayer(player) {
  const requiredDiameter = Math.max(420, player.commandRange * WORKER_RANGE_VIEW_MULTIPLIER);
  const fitWidthZoom = (effectiveViewportWidth() * 0.8) / requiredDiameter;
  const fitHeightZoom = (effectiveViewportHeight() * 0.7) / requiredDiameter;
  return Math.max(MIN_WORLD_ZOOM, Math.min(BASE_WORLD_ZOOM, fitWidthZoom, fitHeightZoom));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function smoothStep(current, target, factor) {
  if (!Number.isFinite(current)) {
    return target;
  }
  return lerp(current, target, factor);
}

function currentSnapshot() {
  return clientState.renderSnapshot || clientState.snapshot;
}

function rarityPalette(rarity) {
  if (rarity === "legendary") {
    return {
      fill: "rgba(255, 209, 102, 0.22)",
      stroke: "rgba(255, 209, 102, 0.9)"
    };
  }
  if (rarity === "epic") {
    return {
      fill: "rgba(206, 136, 255, 0.2)",
      stroke: "rgba(206, 136, 255, 0.9)"
    };
  }
  if (rarity === "rare") {
    return {
      fill: "rgba(98, 184, 255, 0.2)",
      stroke: "rgba(98, 184, 255, 0.9)"
    };
  }
  return {
    fill: "rgba(96, 255, 179, 0.18)",
    stroke: "rgba(96, 255, 179, 0.88)"
  };
}

function rarityCardTheme(rarity) {
  if (rarity === "legendary") {
    return {
      top: "#ffdd85",
      bottom: "#8a4d15",
      edge: "#ffb74d"
    };
  }
  if (rarity === "epic") {
    return {
      top: "#d39aff",
      bottom: "#5c257a",
      edge: "#bb6dff"
    };
  }
  if (rarity === "rare") {
    return {
      top: "#9ed7ff",
      bottom: "#1e4f82",
      edge: "#61b8ff"
    };
  }
  return {
    top: "#9af7c9",
    bottom: "#1b6d52",
    edge: "#49d992"
  };
}

function cardArtCode(card) {
  return CARD_ART_CODES[card.id] || cardGlyph(card);
}

const cardArtCache = new Map();

function cardArtDataUri(card) {
  const key = `${card.id}:${card.rarity}`;
  if (cardArtCache.has(key)) {
    return cardArtCache.get(key);
  }

  const theme = rarityCardTheme(card.rarity);
  const label = CARD_RARITY_LABELS[card.rarity] || card.rarity;
  const code = cardArtCode(card);
  const title = card.title;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 196">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${theme.top}"/>
          <stop offset="100%" stop-color="${theme.bottom}"/>
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="130" height="186" rx="18" fill="#120c23" stroke="${theme.edge}" stroke-width="4"/>
      <rect x="13" y="13" width="114" height="170" rx="14" fill="url(#bg)" opacity="0.92"/>
      <rect x="22" y="24" width="96" height="72" rx="12" fill="rgba(18,12,35,0.24)" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
      <circle cx="70" cy="60" r="28" fill="rgba(18,12,35,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <text x="70" y="68" text-anchor="middle" font-family="Manrope, Arial" font-size="22" font-weight="800" fill="#fff6dc">${code}</text>
      <text x="70" y="118" text-anchor="middle" font-family="Manrope, Arial" font-size="10" font-weight="700" fill="#fff6dc" letter-spacing="1.6">${label.toUpperCase()}</text>
      <text x="70" y="142" text-anchor="middle" font-family="Cinzel, Georgia" font-size="14" font-weight="700" fill="#fff6dc">${title}</text>
      <rect x="30" y="156" width="80" height="8" rx="4" fill="rgba(255,255,255,0.18)"/>
      <rect x="30" y="156" width="${Math.min(80, Math.max(30, code.length * 12))}" height="8" rx="4" fill="rgba(255,246,220,0.78)"/>
    </svg>
  `;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cardArtCache.set(key, uri);
  return uri;
}

function cardGlyph(card) {
  return card.title
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function renderEnemyCardIcons(player, anchorX, startY) {
  const cards = player.activeCards || [];
  if (!cards.length) {
    return;
  }

  const columns = Math.min(5, cards.length);
  const cardWidth = Math.max(14, scaleWorld(18));
  const cardHeight = Math.max(18, scaleWorld(24));
  const gap = Math.max(3, scaleWorld(4));
  const rowGap = Math.max(4, scaleWorld(5));

  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cardsInRow = row === Math.floor((cards.length - 1) / columns) ? Math.min(columns, cards.length - row * columns) : columns;
    const rowWidth = cardsInRow * cardWidth + Math.max(0, cardsInRow - 1) * gap;
    const left = anchorX - rowWidth / 2 + column * (cardWidth + gap);
    const top = startY + row * (cardHeight + rowGap);
    const palette = rarityPalette(card.rarity);

    context.beginPath();
    context.fillStyle = palette.fill;
    context.strokeStyle = palette.stroke;
    context.lineWidth = 1.5;
    context.roundRect(left, top, cardWidth, cardHeight, Math.max(4, scaleWorld(5)));
    context.fill();
    context.stroke();

    context.fillStyle = "#fff6dc";
    context.font = `800 ${Math.max(7, scaleWorld(7.5))}px Manrope`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(cardGlyph(card), left + cardWidth / 2, top + cardHeight / 2 + 0.5);
  }

  context.textBaseline = "alphabetic";
}

function getPlayerFromSnapshot(snapshot, playerId = clientState.playerId) {
  return snapshot?.players.find((player) => player.id === playerId) || null;
}

function aliveSpectateCandidates(snapshot = currentSnapshot()) {
  const selfId = clientState.playerId;
  return (snapshot?.players || [])
    .filter((player) => player.alive && player.id !== selfId)
    .sort((left, right) => right.score - left.score);
}

function getSpectateTarget(snapshot = currentSnapshot()) {
  const candidates = aliveSpectateCandidates(snapshot);
  if (!candidates.length) {
    return null;
  }

  return candidates.find((player) => player.id === clientState.spectatorFocusId) || candidates[0];
}

function getYou() {
  return getPlayerFromSnapshot(clientState.renderSnapshot || clientState.snapshot);
}

function cloneWorker(worker) {
  return {
    ...worker
  };
}

function clonePlayer(player) {
  return {
    ...player,
    activeCards: (player.activeCards || []).map((card) => ({ ...card })),
    pendingCardChoices: (player.pendingCardChoices || []).map((choice) => ({
      ...choice,
      options: (choice.options || []).map((card) => ({ ...card }))
    })),
    workers: player.workers.map(cloneWorker)
  };
}

function cloneSnapshot(snapshot) {
  return {
    ...snapshot,
    players: snapshot.players.map(clonePlayer),
    foods: (snapshot.foods || []).map((food) => ({ ...food })),
    growthNodes: (snapshot.growthNodes || []).map((node) => ({ ...node })),
    leaderboard: (snapshot.leaderboard || []).map((entry) => ({ ...entry })),
    recentEvents: (snapshot.recentEvents || []).map((entry) => ({ ...entry })),
    round: snapshot.round ? { ...snapshot.round } : null
  };
}

function mergeIncomingSnapshot(previousSnapshot, nextSnapshot) {
  if (!previousSnapshot) {
    return nextSnapshot;
  }

  return {
    ...previousSnapshot,
    ...nextSnapshot,
    config: nextSnapshot.config || previousSnapshot.config,
    foods: nextSnapshot.foods || previousSnapshot.foods || [],
    growthNodes: nextSnapshot.growthNodes || previousSnapshot.growthNodes || [],
    leaderboard: nextSnapshot.leaderboard || previousSnapshot.leaderboard || [],
    recentEvents: nextSnapshot.recentEvents || previousSnapshot.recentEvents || [],
    profile: nextSnapshot.profile || previousSnapshot.profile || null,
    round: nextSnapshot.round || previousSnapshot.round || null,
    players: nextSnapshot.players || previousSnapshot.players || []
  };
}

function smoothWorkerState(currentWorker, targetWorker) {
  currentWorker.x = smoothStep(currentWorker.x, targetWorker.x, ENTITY_SMOOTHING);
  currentWorker.y = smoothStep(currentWorker.y, targetWorker.y, ENTITY_SMOOTHING);
  currentWorker.radius = smoothStep(currentWorker.radius, targetWorker.radius, ENTITY_SMOOTHING);
  currentWorker.food = smoothStep(currentWorker.food, targetWorker.food, ENTITY_SMOOTHING);
  currentWorker.health = smoothStep(currentWorker.health, targetWorker.health, ENTITY_SMOOTHING);
  currentWorker.healthMax = smoothStep(currentWorker.healthMax, targetWorker.healthMax, ENTITY_SMOOTHING);
  currentWorker.mode = targetWorker.mode;
}

function smoothPlayerState(currentPlayer, targetPlayer) {
  currentPlayer.x = smoothStep(currentPlayer.x, targetPlayer.x, ENTITY_SMOOTHING);
  currentPlayer.y = smoothStep(currentPlayer.y, targetPlayer.y, ENTITY_SMOOTHING);
  currentPlayer.radius = smoothStep(currentPlayer.radius, targetPlayer.radius, ENTITY_SMOOTHING);
  currentPlayer.health = smoothStep(currentPlayer.health, targetPlayer.health, ENTITY_SMOOTHING);
  currentPlayer.healthMax = smoothStep(currentPlayer.healthMax, targetPlayer.healthMax, ENTITY_SMOOTHING);
  currentPlayer.score = smoothStep(currentPlayer.score, targetPlayer.score, ENTITY_SMOOTHING);
  currentPlayer.commandRange = smoothStep(currentPlayer.commandRange, targetPlayer.commandRange, ENTITY_SMOOTHING);
  currentPlayer.commandX = smoothStep(currentPlayer.commandX, targetPlayer.commandX, ENTITY_SMOOTHING);
  currentPlayer.commandY = smoothStep(currentPlayer.commandY, targetPlayer.commandY, ENTITY_SMOOTHING);
  currentPlayer.eggs = targetPlayer.eggs;
  currentPlayer.maxEggs = targetPlayer.maxEggs;
  currentPlayer.maxWorkers = targetPlayer.maxWorkers;
  currentPlayer.alive = targetPlayer.alive;
  currentPlayer.level = targetPlayer.level;
  currentPlayer.skinId = targetPlayer.skinId;
  currentPlayer.name = targetPlayer.name;
  currentPlayer.mergeCooldownMs = targetPlayer.mergeCooldownMs;
  currentPlayer.splitCooldownMs = targetPlayer.splitCooldownMs;
  currentPlayer.respawnTimer = targetPlayer.respawnTimer;
  currentPlayer.spawnProtectedMs = targetPlayer.spawnProtectedMs;
  currentPlayer.matchXp = targetPlayer.matchXp;
  currentPlayer.matchXpIntoLevel = targetPlayer.matchXpIntoLevel;
  currentPlayer.matchXpForNextLevel = targetPlayer.matchXpForNextLevel;
  currentPlayer.nextCardRewardLevel = targetPlayer.nextCardRewardLevel;
  currentPlayer.activeCards = (targetPlayer.activeCards || []).map((card) => ({ ...card }));
  currentPlayer.pendingCardChoices = (targetPlayer.pendingCardChoices || []).map((choice) => ({
    ...choice,
    options: (choice.options || []).map((card) => ({ ...card }))
  }));

  const currentWorkersById = new Map(currentPlayer.workers.map((worker) => [worker.id, worker]));
  const nextWorkers = [];

  for (const targetWorker of targetPlayer.workers) {
    const currentWorker = currentWorkersById.get(targetWorker.id);
    if (currentWorker) {
      smoothWorkerState(currentWorker, targetWorker);
      nextWorkers.push(currentWorker);
    } else {
      nextWorkers.push(cloneWorker(targetWorker));
    }
  }

  currentPlayer.workers = nextWorkers;
}

function reconcileRenderSnapshot() {
  const target = clientState.snapshot;
  if (!target) {
    clientState.renderSnapshot = null;
    return;
  }

  if (!clientState.renderSnapshot) {
    clientState.renderSnapshot = cloneSnapshot(target);
    return;
  }

  const current = clientState.renderSnapshot;
  current.serverTime = target.serverTime;
  current.config = target.config;
  current.round = target.round ? { ...target.round } : null;
  if (target.foods) {
    current.foods = target.foods.map((food) => ({ ...food }));
  }
  if (target.growthNodes) {
    current.growthNodes = target.growthNodes.map((node) => ({ ...node }));
  }
  if (target.leaderboard) {
    current.leaderboard = target.leaderboard.map((entry) => ({ ...entry }));
  }
  if (target.recentEvents) {
    current.recentEvents = target.recentEvents.map((entry) => ({ ...entry }));
  }

  const currentPlayersById = new Map(current.players.map((player) => [player.id, player]));
  const nextPlayers = [];

  for (const targetPlayer of target.players) {
    const currentPlayer = currentPlayersById.get(targetPlayer.id);
    if (currentPlayer) {
      smoothPlayerState(currentPlayer, targetPlayer);
      nextPlayers.push(currentPlayer);
    } else {
      nextPlayers.push(clonePlayer(targetPlayer));
    }
  }

  current.players = nextPlayers;
}

function computeInputVector() {
  return {
    x: (inputState.right ? 1 : 0) - (inputState.left ? 1 : 0),
    y: (inputState.down ? 1 : 0) - (inputState.up ? 1 : 0)
  };
}

function currentInputSnapshot() {
  const { x, y } = computeInputVector();
  return {
    x,
    y,
    boost: inputState.boost,
    hatch: inputState.hatch,
    merge: inputState.merge,
    split: inputState.split,
    attack: inputState.attack,
    pointerX: clientState.worldPointer.x,
    pointerY: clientState.worldPointer.y
  };
}

function inputSignature(input) {
  return [
    input.x,
    input.y,
    input.boost ? 1 : 0,
    input.hatch ? 1 : 0,
    input.merge ? 1 : 0,
    input.split ? 1 : 0,
    input.attack ? 1 : 0,
    Math.round(input.pointerX / INPUT_POINTER_SIGNATURE_WORLD),
    Math.round(input.pointerY / INPUT_POINTER_SIGNATURE_WORLD)
  ].join("|");
}

function updatePointerFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  inputState.pointerX = event.clientX - rect.left;
  inputState.pointerY = event.clientY - rect.top;
  clientState.worldPointer = screenToWorld(inputState.pointerX, inputState.pointerY);
  clientState.pointerInitialized = true;
}

function recordSnapshotArrival(payload) {
  const now = performance.now();
  if (payload.sequence) {
    const previousSequence = clientState.network.lastSnapshotSequence || payload.sequence;
    const missed = Math.max(0, payload.sequence - previousSequence - 1);
    clientState.network.snapshotsMissed += missed;
    clientState.network.snapshotsReceived += 1;
    clientState.network.lastSnapshotSequence = payload.sequence;
    const totalSnapshots = clientState.network.snapshotsReceived + clientState.network.snapshotsMissed;
    clientState.network.inLossPct = totalSnapshots > 0 ? (clientState.network.snapshotsMissed / totalSnapshots) * 100 : 0;
  }

  const previousAt = clientState.network.lastSnapshotReceivedAt;
  if (previousAt > 0) {
    const interval = now - previousAt;
    if (interval >= 8) {
      clientState.network.lastSnapshotIntervalMs = interval;
    }
    const targetBroadcastRate = Math.max(1, payload.config?.broadcastRate || 1);
    const snapshotsPerSecond = interval > 0 ? Math.min(targetBroadcastRate * 1.35, 1000 / interval) : 0;
    clientState.network.snapshotsPerSecond = clientState.network.snapshotsPerSecond
      ? lerp(clientState.network.snapshotsPerSecond, snapshotsPerSecond, 0.28)
      : snapshotsPerSecond;
    const previousInterval = clientState.network.jitterMs;
    const intervalJitter = Math.abs(interval - 1000 / targetBroadcastRate);
    clientState.network.jitterMs = previousInterval
      ? lerp(previousInterval, intervalJitter, 0.24)
      : intervalJitter;
  }

  clientState.network.lastSnapshotReceivedAt = now;
  clientState.network.snapshotAgeMs = 0;
  if (payload.serverTime) {
    const offset = Date.now() - payload.serverTime;
    clientState.network.clockOffsetMs = clientState.network.clockOffsetMs
      ? lerp(clientState.network.clockOffsetMs, offset, 0.2)
      : offset;
  }

  if (typeof payload.ackInputSeq === "number") {
    if (payload.ackInputSeq > clientState.network.lastAckInputSeq) {
      clientState.network.lastAckReceivedAt = now;
    }
    clientState.network.lastAckInputSeq = Math.max(clientState.network.lastAckInputSeq, payload.ackInputSeq);
  }
  const outstandingInputs = Math.max(0, clientState.network.maxSentInputSeq - clientState.network.lastAckInputSeq);
  const clientBufferedBytes = clientState.socket?.bufferedAmount || 0;
  const ackAgeMs = clientState.network.lastAckReceivedAt > 0 ? now - clientState.network.lastAckReceivedAt : 0;
  let outPressure = 0;
  if (outstandingInputs > 2) {
    outPressure += (outstandingInputs - 2) * 2.4;
  }
  if (ackAgeMs > 220) {
    outPressure += (ackAgeMs - 220) / 30;
  }
  if (clientBufferedBytes > 4096) {
    outPressure += (clientBufferedBytes - 4096) / 8192;
  }
  const nextOutLossPct = Math.max(0, Math.min(100, outPressure));
  clientState.network.outLossPct = clientState.network.outLossPct
    ? lerp(clientState.network.outLossPct, nextOutLossPct, 0.2)
    : nextOutLossPct;
}

function sendPing() {
  if (!clientState.socket || clientState.socket.readyState !== WebSocket.OPEN) {
    return;
  }

  const clientTime = Date.now();
  clientState.network.lastPingSentAt = clientTime;
  clientState.socket.send(
    JSON.stringify({
      type: "ping",
      clientTime
    })
  );
}

function handlePong(payload) {
  const now = Date.now();
  const roundTripMs = Math.max(0, now - (Number(payload.clientTime) || now));
  const previousPing = clientState.network.pingMs;
  clientState.network.pingMs = previousPing ? lerp(previousPing, roundTripMs, 0.35) : roundTripMs;
  const delta = previousPing ? Math.abs(roundTripMs - previousPing) : 0;
  clientState.network.jitterMs = clientState.network.jitterMs
    ? lerp(clientState.network.jitterMs, delta, 0.2)
    : delta;
  if (payload.serverTime) {
    const offset = now - roundTripMs / 2 - payload.serverTime;
    clientState.network.clockOffsetMs = clientState.network.clockOffsetMs
      ? lerp(clientState.network.clockOffsetMs, offset, 0.2)
      : offset;
  }
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
  }
  const csrfToken = options.csrfToken ?? clientState.csrfToken;
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(path, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function storeToken(token) {
  clientState.authToken = token;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function storeCsrfToken(token) {
  clientState.csrfToken = token || "";
  if (clientState.csrfToken) {
    localStorage.setItem(CSRF_TOKEN_KEY, clientState.csrfToken);
  } else {
    localStorage.removeItem(CSRF_TOKEN_KEY);
  }
}

function storeSessionAuth(authToken, csrfToken) {
  storeToken(authToken);
  storeCsrfToken(csrfToken);
}

function clearToken() {
  clientState.authToken = "";
  localStorage.removeItem(AUTH_TOKEN_KEY);
  storeCsrfToken("");
}

function switchAuthMode(mode) {
  clientState.authMode = mode;
  for (const button of authModeButtons) {
    button.classList.toggle("active", button.dataset.authMode === mode);
  }
  for (const [panelMode, panel] of Object.entries(authPanels)) {
    panel.classList.toggle("hidden", panelMode !== mode);
  }
}

function renderSkinGrid(container, skinIds, selectedSkin, ownedSkins) {
  container.innerHTML = skinIds
    .map((skinId) => {
      const skin = getSkin(skinId);
      const isOwned = !ownedSkins || ownedSkins.includes(skinId);
      const classes = ["skin-option"];
      if (selectedSkin === skinId) {
        classes.push("selected");
      }
      if (!isOwned) {
        classes.push("locked");
      }
      return `
        <button type="button" class="${classes.join(" ")}" data-skin="${skinId}" ${isOwned ? "" : "disabled"}>
          <div class="skin-chip" style="background:linear-gradient(135deg, ${skin.primary}, ${skin.secondary})"></div>
          <div class="skin-copy">
            <div class="skin-name">${skin.name}</div>
            <div class="skin-meta">${SKIN_UNLOCK_LEVELS[skinId]}</div>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderProfileSummary() {
  const profile = clientState.profile;
  if (!profile) {
    profileSummary.innerHTML = "";
    return;
  }

  const skin = getSkin(profile.selectedSkin);
  const modeLabel = profile.mode === "account" ? `Level ${profile.level}` : "Guest Session";
  const progress =
    profile.mode === "account" && profile.xpForNextLevel
      ? `${profile.xpIntoLevel}/${profile.xpForNextLevel} XP`
      : "Temporary profile";

  profileSummary.innerHTML = `
    <div class="profile-title">
      <strong>${profile.displayName}</strong>
      <span class="profile-badge">${profile.isAdmin ? "Admin Hive" : profile.mode === "account" ? `Hive ${modeLabel}` : modeLabel}</span>
    </div>
    <p>Selected skin: <strong style="color:${skin.primary}">${skin.name}</strong></p>
    <p>Unlocked skins: ${profile.ownedSkins.length} / ${Object.keys(SKINS).length}</p>
    <p>${progress}</p>
  `;
  openAdminDashboardButton?.classList.toggle("hidden", !profile.isAdmin);
}

function readRoomSelectionFromUi() {
  clientState.roomSelection.mode = roomModeSelect?.value === "custom" ? "custom" : "public";
  clientState.roomSelection.region = roomRegionSelect?.value || clientState.roomSelection.region || "singapore";
  clientState.roomSelection.roomId = roomPickerSelect?.value || "";
  clientState.roomSelection.roomName = (roomNameInput?.value || "Custom Colony").trim() || "Custom Colony";
  clientState.roomSelection.roomConfig = {
    maxPlayers: Number(roomMaxPlayersInput?.value || 16),
    foodTarget: Number(roomFoodTargetInput?.value || 480),
    growthNodeTarget: Number(roomGrowthTargetInput?.value || 24),
    roundScoreTarget: Number(roomGoalInput?.value || 12000),
    mapWidth: Number(roomMapWidthInput?.value || 8200),
    mapHeight: Number(roomMapHeightInput?.value || 5200),
    foodValueMultiplier: Number(roomFoodValueInput?.value || 1),
    growthValueMultiplier: Number(roomGrowthValueInput?.value || 1),
    hiveDamageMultiplier: Number(roomHiveDamageInput?.value || 1),
    workerDamageMultiplier: Number(roomWorkerDamageInput?.value || 1)
  };
}

function renderRoomSelection() {
  const selection = clientState.roomSelection;
  if (roomModeSelect) {
    roomModeSelect.value = selection.mode;
  }
  if (roomRegionSelect) {
    roomRegionSelect.innerHTML = (clientState.supportedRegions || ["singapore"])
      .map((region) => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`)
      .join("");
    roomRegionSelect.value = selection.region || clientState.supportedRegions[0] || "singapore";
  }
  if (roomNameInput) {
    roomNameInput.value = selection.roomName || "Custom Colony";
  }
  if (roomPickerSelect) {
    const matchingRooms = (clientState.availableRooms || []).filter((room) => room.mode === "custom");
    roomPickerSelect.innerHTML =
      `<option value="">Create new custom game</option>` +
      matchingRooms
        .map(
          (room) =>
            `<option value="${escapeHtml(room.id)}">${escapeHtml(room.name)} • ${escapeHtml(room.region)} • ${escapeHtml(room.players)}/${escapeHtml(room.config?.maxPlayers || 0)}</option>`
        )
        .join("");
    roomPickerSelect.value = selection.roomId || "";
  }
  if (roomMaxPlayersInput) {
    roomMaxPlayersInput.value = String(selection.roomConfig.maxPlayers);
  }
  if (roomFoodTargetInput) {
    roomFoodTargetInput.value = String(selection.roomConfig.foodTarget);
  }
  if (roomGrowthTargetInput) {
    roomGrowthTargetInput.value = String(selection.roomConfig.growthNodeTarget);
  }
  if (roomGoalInput) {
    roomGoalInput.value = String(selection.roomConfig.roundScoreTarget);
  }
  if (roomMapWidthInput) {
    roomMapWidthInput.value = String(selection.roomConfig.mapWidth);
  }
  if (roomMapHeightInput) {
    roomMapHeightInput.value = String(selection.roomConfig.mapHeight);
  }
  if (roomFoodValueInput) {
    roomFoodValueInput.value = String(selection.roomConfig.foodValueMultiplier);
  }
  if (roomGrowthValueInput) {
    roomGrowthValueInput.value = String(selection.roomConfig.growthValueMultiplier);
  }
  if (roomHiveDamageInput) {
    roomHiveDamageInput.value = String(selection.roomConfig.hiveDamageMultiplier);
  }
  if (roomWorkerDamageInput) {
    roomWorkerDamageInput.value = String(selection.roomConfig.workerDamageMultiplier);
  }

  const customMode = selection.mode === "custom";
  document.querySelector(".room-grid")?.classList.toggle("hidden", !customMode);
  document.querySelectorAll(".room-grid label").forEach((label) => {
    label.classList.toggle("hidden", !customMode);
  });
  roomNameLabel?.classList.toggle("hidden", !customMode);
  roomPickerLabel?.classList.toggle("hidden", !customMode);
  if (roomListSummary) {
    const customRooms = (clientState.availableRooms || []).filter((room) => room.mode === "custom");
    roomListSummary.textContent = customMode
      ? `${customRooms.length} custom game${customRooms.length === 1 ? "" : "s"} available. Select one, or leave it empty to create a new custom game.`
      : "Play joins the public arena automatically. A new public lobby is created only when the active one is full.";
  }
}

async function fetchAvailableRooms() {
  try {
    const payload = await apiRequest("/rooms");
    clientState.availableRooms = Array.isArray(payload.rooms) ? payload.rooms : [];
    clientState.supportedRegions = Array.isArray(payload.supportedRegions) && payload.supportedRegions.length ? payload.supportedRegions : ["singapore"];
    if (!clientState.roomSelection.region || !clientState.supportedRegions.includes(clientState.roomSelection.region)) {
      clientState.roomSelection.region = payload.serverRegion || clientState.supportedRegions[0] || "singapore";
    }
    renderRoomSelection();
  } catch {
    renderRoomSelection();
  }
}

function renderAdminPanel() {
  const isVisible = Boolean(clientState.connected && clientState.profile?.isAdmin);
  adminPanel?.classList.toggle("hidden", !isVisible);
  if (!isVisible) {
    if (adminNetworkDashboard) {
      adminNetworkDashboard.innerHTML = "";
    }
    if (adminPlayersDashboard) {
      adminPlayersDashboard.innerHTML = "";
    }
    if (adminAccountsDashboard) {
      adminAccountsDashboard.innerHTML = "";
    }
    if (adminGuestsDashboard) {
      adminGuestsDashboard.innerHTML = "";
    }
    return;
  }

  const you = getYou();
  const godModeLabel = you?.adminGodMode ? "God Mode: ON" : "God Mode: OFF";
  if (adminGodModeButton) {
    adminGodModeButton.textContent = godModeLabel;
  }

  renderAdminDashboard();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value || 0));
}

function formatDuration(seconds) {
  const whole = Math.max(0, Math.round(Number(seconds) || 0));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function renderAdminDashboard() {
  const dashboard = clientState.adminDashboard;
  if (!dashboard) {
    if (adminNetworkDashboard) {
      adminNetworkDashboard.innerHTML = '<div class="admin-empty"><strong>Admin dashboard idle.</strong> Refresh to load live server data.</div>';
    }
    if (adminPlayersDashboard) {
      adminPlayersDashboard.innerHTML = "";
    }
    if (adminAccountsDashboard) {
      adminAccountsDashboard.innerHTML = "";
    }
    if (adminGuestsDashboard) {
      adminGuestsDashboard.innerHTML = "";
    }
    return;
  }

  if (adminNetworkDashboard) {
    const network = dashboard.network || {};
    const metrics = [
      ["Online", network.onlinePlayers ?? 0],
      ["Spectators", network.spectators ?? 0],
      ["Rooms", network.rooms ?? 0],
      ["Sessions", network.sessions ?? 0],
      ["Tick / Broadcast", `${network.tickRate ?? 0} / ${network.broadcastRate ?? 0}`],
      ["Heap / RSS", `${network.heapUsedMb ?? 0}MB / ${network.rssMb ?? 0}MB`],
      ["Uptime", formatDuration(network.uptimeSec)],
      ["Food / Growth", `${network.foods ?? 0} / ${network.growthNodes ?? 0}`]
    ];
    adminNetworkDashboard.innerHTML = metrics
      .map(
        ([label, value]) => `
          <div class="admin-metric">
            <strong>${escapeHtml(label)}</strong>
            <span class="admin-metric-value">${escapeHtml(value)}</span>
          </div>
        `
      )
      .join("");
  }

  if (adminPlayersDashboard) {
    const players = Array.isArray(dashboard.players) ? dashboard.players : [];
    adminPlayersDashboard.innerHTML = players.length
      ? players
          .map((entry) => {
            const isAdmin = Boolean(entry.isAdmin);
            const badge = isAdmin ? '<span class="admin-badge">Admin</span>' : "";
            const moderationActions = isAdmin
              ? '<div class="admin-inline-note">Protected admin session.</div>'
              : `
                  <div class="admin-actions">
                    <button type="button" class="admin-action" data-admin-action="respawn_player" data-player-id="${escapeHtml(entry.id)}">Respawn</button>
                    <button type="button" class="admin-action warn" data-admin-action="kill_player" data-player-id="${escapeHtml(entry.id)}">Collapse</button>
                    <button type="button" class="admin-action warn" data-admin-action="kick_player" data-player-id="${escapeHtml(entry.id)}">Kick</button>
                    <button type="button" class="admin-action danger" data-admin-action="ban_player" data-player-id="${escapeHtml(entry.id)}">Ban</button>
                  </div>
                `;
            return `
              <div class="admin-row">
                <div class="admin-row-head">
                  <strong>${escapeHtml(entry.name)}</strong>
                  ${badge}
                </div>
                <div class="admin-row-meta">
                  <span>${entry.alive ? "Alive" : "Down"} | Score ${formatCompactNumber(entry.score)} | Run Lv ${escapeHtml(entry.level)}</span>
                  <span>Workers ${escapeHtml(entry.workers)} | HP ${escapeHtml(entry.health)}/${escapeHtml(entry.healthMax)}</span>
                </div>
                <div class="admin-row-meta">
                  <span>${entry.accountId ? "Account" : "Guest"}${entry.socketBufferedBytes ? ` | Backlog ${formatCompactNumber(entry.socketBufferedBytes)}B` : ""}</span>
                </div>
                ${moderationActions}
              </div>
            `;
          })
          .join("")
      : '<div class="admin-empty"><strong>No live players.</strong> The arena is waiting for challengers.</div>';
  }

  if (adminAccountsDashboard) {
    const accounts = Array.isArray(dashboard.accounts) ? dashboard.accounts : [];
    adminAccountsDashboard.innerHTML = accounts.length
      ? accounts
          .map((account) => {
            const badge = account.isAdmin || account.role === "admin" ? '<span class="admin-badge">Admin</span>' : "";
            const unbanButton = account.banned
              ? `<button type="button" class="admin-action" data-admin-action="unban_account" data-account-id="${escapeHtml(account.id)}">Unban Account</button>`
              : "";
            return `
              <div class="admin-row">
                <div class="admin-row-head">
                  <strong>${escapeHtml(account.username)}</strong>
                  ${badge}
                </div>
                <div class="admin-row-meta">
                  <span>${escapeHtml(account.role || "player")} | Hive Lv ${escapeHtml(account.level)} | XP ${formatCompactNumber(account.xp)}</span>
                  <span>Matches ${escapeHtml(account.totalMatches)} | Kills ${escapeHtml(account.totalKills)}</span>
                </div>
                <div class="admin-row-meta">
                  <span>${account.banned ? `Banned${account.banReason ? `: ${escapeHtml(account.banReason)}` : ""}` : "Active account"}</span>
                  <span>Skins ${escapeHtml(account.ownedSkins)}</span>
                </div>
                ${unbanButton ? `<div class="admin-actions">${unbanButton}</div>` : ""}
              </div>
            `;
          })
          .join("")
      : '<div class="admin-empty"><strong>No saved accounts.</strong></div>';
  }

  if (adminGuestsDashboard) {
    const bannedGuests = Array.isArray(dashboard.bannedGuests) ? dashboard.bannedGuests : [];
    adminGuestsDashboard.innerHTML = bannedGuests.length
      ? bannedGuests
          .map(
            (guestName) => `
              <div class="admin-row">
                <div class="admin-row-head">
                  <strong>${escapeHtml(guestName)}</strong>
                </div>
                <div class="admin-actions">
                  <button type="button" class="admin-action" data-admin-action="unban_guest" data-guest-name="${escapeHtml(guestName)}">Unban Guest</button>
                </div>
              </div>
            `
          )
          .join("")
      : '<div class="admin-empty"><strong>No banned guests.</strong></div>';
  }
}

function getPendingCardChoice() {
  return getYou()?.pendingCardChoices?.[0] || null;
}

function cardChoiceOverlayKey(pendingChoice) {
  if (!pendingChoice) {
    return "";
  }

  const optionIds = (pendingChoice.options || []).map((card) => card.id).join("|");
  return `${pendingChoice.rewardLevel}:${pendingChoice.rarity}:${optionIds}:${clientState.cardSelectionPending ? 1 : 0}`;
}

function applyChosenCardLocally(cardId, rewardLevel) {
  const applyToSnapshot = (snapshot) => {
    const player = getPlayerFromSnapshot(snapshot);
    if (!player) {
      return;
    }

    const choiceIndex = (player.pendingCardChoices || []).findIndex((choice) => choice.rewardLevel === rewardLevel);
    if (choiceIndex < 0) {
      return;
    }

    const choice = player.pendingCardChoices[choiceIndex];
    const selectedCard = (choice.options || []).find((entry) => entry.id === cardId);
    player.pendingCardChoices.splice(choiceIndex, 1);
    if (selectedCard) {
      player.activeCards = [...(player.activeCards || []), selectedCard];
    }
  };

  applyToSnapshot(clientState.snapshot);
  applyToSnapshot(clientState.renderSnapshot);
}

function renderCardChoiceOverlay() {
  const profile = clientState.profile;
  const you = getYou();
  const pendingChoice = getPendingCardChoice();
  const shouldShow = Boolean(profile && you && pendingChoice);

  cardChoiceOverlay.classList.toggle("hidden", !shouldShow);
  if (!shouldShow) {
    cardChoiceGrid.innerHTML = "";
    cardChoiceHint.textContent = "";
    clientState.cardSelectionPending = false;
    clientState.cardOverlayKey = "";
    return;
  }

  cardChoiceTitle.textContent = `Level ${pendingChoice.rewardLevel} reward: choose 1 ${CARD_RARITY_LABELS[pendingChoice.rarity]} card`;
  cardChoiceText.textContent =
    "This buff applies to your current hive run immediately. Card progression is earned in-match.";
  cardChoiceHint.textContent = clientState.cardSelectionPending
    ? "Locking in your hive upgrade..."
    : "Pick 1 of the 3 cards below.";
  const nextOverlayKey = cardChoiceOverlayKey(pendingChoice);
  if (clientState.cardOverlayKey !== nextOverlayKey) {
    cardChoiceGrid.innerHTML = pendingChoice.options
      .map(
        (card) => `
          <button
            type="button"
            class="card-choice ${card.rarity}"
            data-card-id="${card.id}"
            data-reward-level="${pendingChoice.rewardLevel}"
            ${clientState.cardSelectionPending ? "disabled" : ""}
          >
            <img class="card-choice-art" src="${cardArtDataUri(card)}" alt="${card.title}" draggable="false" />
            <span class="card-choice-rarity">${CARD_RARITY_LABELS[card.rarity]}</span>
            <strong>${card.title}</strong>
            <span>${card.description}</span>
          </button>
        `
      )
      .join("");
    clientState.cardOverlayKey = nextOverlayKey;
  }
}

function renderAuthState() {
  ensureAdminDashboardPolling();
  if (clientState.connected) {
    joinOverlay.classList.add("hidden");
    renderCardChoiceOverlay();
    renderAdminPanel();
    return;
  }

  joinOverlay.classList.remove("hidden");
  if (activeBuffs) {
    activeBuffs.innerHTML = '<div class="buff-empty">No active buffs yet.</div>';
  }
  const isAuthed = Boolean(clientState.profile);
  authUnauthed.classList.toggle("hidden", isAuthed);
  authAuthed.classList.toggle("hidden", !isAuthed);
  renderSkinGrid(registerStarterSkins, STARTER_SKINS, clientState.registerStarterSkin);
  renderSkinGrid(guestStarterSkins, STARTER_SKINS, clientState.guestStarterSkin);

  if (isAuthed) {
    renderProfileSummary();
    renderSkinGrid(ownedSkinGrid, Object.keys(SKINS), clientState.profile.selectedSkin, clientState.profile.ownedSkins);
    renderRoomSelection();
  }

  switchAuthMode(clientState.authMode);
  renderCardChoiceOverlay();
  renderAdminPanel();
}

async function restoreSession() {
  if (!clientState.authToken) {
    renderAuthState();
    return;
  }

  try {
    const payload = await apiRequest("/auth/me", {
      authToken: clientState.authToken
    });
    clientState.profile = payload.profile;
    storeCsrfToken(payload.csrfToken);
    await fetchAvailableRooms();
    setAuthMessage(`Welcome back, ${payload.profile.displayName}. Your hive is ready.`);
  } catch (error) {
    clearToken();
    clientState.profile = null;
    setAuthMessage("Your session expired. Sign back in or continue as a guest.");
  }

  renderAuthState();
}

async function registerAccount() {
  try {
    setAuthMessage("Creating account...");
    const payload = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        username: registerNameInput.value,
        password: registerPasswordInput.value,
        starterSkin: clientState.registerStarterSkin
      }
    });
    storeSessionAuth(payload.authToken, payload.csrfToken);
    clientState.profile = payload.profile;
    await fetchAvailableRooms();
    setAuthMessage("Account created. Pick your skin, then head into the wilds.");
    renderAuthState();
  } catch (error) {
    setAuthMessage(error.message, true);
  }
}

async function loginAccount() {
  try {
    setAuthMessage("Logging in...");
    const payload = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        username: loginNameInput.value,
        password: loginPasswordInput.value
      }
    });
    storeSessionAuth(payload.authToken, payload.csrfToken);
    clientState.profile = payload.profile;
    await fetchAvailableRooms();
    setAuthMessage(`Logged in as ${payload.profile.displayName}.`);
    renderAuthState();
  } catch (error) {
    setAuthMessage(error.message, true);
  }
}

async function continueAsGuest() {
  try {
    setAuthMessage("Creating guest session...");
    const payload = await apiRequest("/auth/guest", {
      method: "POST",
      body: {
        name: guestNameInput.value,
        starterSkin: clientState.guestStarterSkin
      }
    });
    storeSessionAuth(payload.authToken, payload.csrfToken);
    clientState.profile = payload.profile;
    await fetchAvailableRooms();
    setAuthMessage("Guest session ready. Jump in and see how long your hive survives.");
    renderAuthState();
  } catch (error) {
    setAuthMessage(error.message, true);
  }
}

async function selectSkin(skinId) {
  try {
    const payload = await apiRequest("/auth/select-skin", {
      method: "POST",
      authToken: clientState.authToken,
      body: {
        skinId
      }
    });
    clientState.profile = payload.profile;
    storeCsrfToken(payload.csrfToken);
    renderAuthState();
  } catch (error) {
    setAuthMessage(error.message, true);
  }
}

async function selectCard(cardId, rewardLevel) {
  try {
    playUiClickSound();
    clientState.cardSelectionPending = true;
    renderCardChoiceOverlay();
    const payload = await apiRequest("/auth/select-card", {
      method: "POST",
      authToken: clientState.authToken,
      body: {
        cardId,
        rewardLevel
      }
    });
    storeCsrfToken(payload.csrfToken);
    applyChosenCardLocally(cardId, rewardLevel);
  } catch (error) {
    setAuthMessage(error.message, true);
  } finally {
    clientState.cardSelectionPending = false;
    renderAuthState();
    renderStats();
  }
}

async function fetchAdminDashboard() {
  if (!clientState.profile?.isAdmin) {
    return;
  }

  try {
    const payload = await apiRequest("/admin/dashboard", {
      authToken: clientState.authToken
    });
    clientState.adminDashboard = payload;
    storeCsrfToken(payload.csrfToken);
    renderAdminPanel();
  } catch (error) {
    setAuthMessage(error.message, true);
  }
}

function stopAdminDashboardPolling() {
  if (clientState.adminDashboardTimer) {
    clearInterval(clientState.adminDashboardTimer);
    clientState.adminDashboardTimer = null;
  }
}

function ensureAdminDashboardPolling() {
  if (!(clientState.connected && clientState.profile?.isAdmin)) {
    stopAdminDashboardPolling();
    return;
  }
  if (clientState.adminDashboardTimer) {
    return;
  }
  clientState.adminDashboardTimer = setInterval(fetchAdminDashboard, 2500);
}

async function runAdminAction(action, extra = {}) {
  if (!clientState.profile?.isAdmin) {
    return;
  }

  try {
    const payload = await apiRequest("/admin/action", {
      method: "POST",
      authToken: clientState.authToken,
      body: { action, ...extra }
    });
    if (payload.profile) {
      clientState.profile = payload.profile;
    }
    storeCsrfToken(payload.csrfToken);
    if (payload.dashboard) {
      clientState.adminDashboard = payload.dashboard;
    }
    const you = getYou();
    if (you && payload.adminState) {
      you.adminGodMode = Boolean(payload.adminState.godMode);
    }
    renderAdminPanel();
  } catch (error) {
    setAuthMessage(error.message, true);
  }
}

async function logout() {
  try {
    if (clientState.authToken) {
      await apiRequest("/auth/logout", {
        method: "POST",
        authToken: clientState.authToken,
        body: {}
      });
    }
  } catch (error) {
    // Ignore logout transport errors and clear local session anyway.
  }

  if (clientState.socket) {
    clientState.socket.close();
  }
  if (clientState.pingTimer) {
    clearInterval(clientState.pingTimer);
    clientState.pingTimer = null;
  }

  clearToken();
  clientState.profile = null;
  clientState.adminDashboard = null;
  stopAdminDashboardPolling();
  clientState.network.lastAckInputSeq = 0;
  clientState.network.maxSentInputSeq = 0;
  clientState.network.outLossPct = 0;
  clientState.network.lastAckReceivedAt = 0;
  clientState.playerId = null;
  clientState.spectatorId = null;
  clientState.snapshot = null;
  clientState.renderSnapshot = null;
  clientState.connected = false;
  clientState.lastSentInputSignature = "";
  clientState.lastSentInputAt = 0;
  clientState.spectatorMode = false;
  clientState.spectatingFromDeath = false;
  clientState.spectatorFocusId = null;
  closeOptionsMenu();
  setAuthMessage("Signed out.");
  fetchAvailableRooms();
  renderAuthState();
}

function returnToMainMenu() {
  if (clientState.socket) {
    clientState.socket.close();
  }
  if (clientState.pingTimer) {
    clearInterval(clientState.pingTimer);
    clientState.pingTimer = null;
  }

  clientState.connected = false;
  clientState.playerId = null;
  clientState.spectatorId = null;
  clientState.snapshot = null;
  clientState.renderSnapshot = null;
  clientState.pointerInitialized = false;
  clientState.lastSentInputSignature = "";
  clientState.lastSentInputAt = 0;
  clientState.network.lastAckInputSeq = 0;
  clientState.network.maxSentInputSeq = 0;
  clientState.network.outLossPct = 0;
  clientState.network.lastAckReceivedAt = 0;
  clientState.spectatorMode = false;
  clientState.spectatingFromDeath = false;
  clientState.spectatorFocusId = null;
  clientState.adminDashboard = null;
  stopAdminDashboardPolling();
  inputState.attack = false;
  closeOptionsMenu();
  joinOverlay.classList.remove("hidden");
  setStatus("Returned to the main menu. Press Play Now to respawn when you're ready.");
  setAuthMessage("Arena session closed. You can change skins, review cards, or jump back in.");
  fetchAvailableRooms();
  renderAuthState();
}

function toggleDeathSpectate() {
  const you = getYou();
  if (!you || you.alive || clientState.spectatorMode) {
    return;
  }

  clientState.spectatingFromDeath = !clientState.spectatingFromDeath;
  clientState.spectatorFocusId = clientState.spectatingFromDeath ? getSpectateTarget()?.id || null : null;
  setStatus(
    clientState.spectatingFromDeath
      ? "Spectating another hive while you wait to respawn."
      : "Returned to your hive respawn view."
  );
}

async function startSpectating() {
  if (!clientState.profile || !clientState.authToken) {
    setAuthMessage("Create an account or continue as a guest first.", true);
    return;
  }

  try {
    spectateButton.disabled = true;
    setStatus("Finding a hive to watch...");
    const payload = await apiRequest("/spectate", {
      method: "POST",
      authToken: clientState.authToken,
      body: currentRoomRequestBody()
    });

    clientState.spectatorId = payload.spectatorId;
    storeCsrfToken(payload.csrfToken);
    clientState.playerId = null;
    clientState.snapshot = null;
    clientState.renderSnapshot = null;
    clientState.spectatorMode = true;
    clientState.spectatingFromDeath = false;
    clientState.spectatorFocusId = null;
    clientState.profile = payload.profile;
    if (payload.room) {
      setStatus(`Spectating ${payload.room.name} in ${payload.room.region}.`);
    }
    connectSocket("spectator");
  } catch (error) {
    setAuthMessage(error.message, true);
    spectateButton.disabled = false;
  }
}

function sendInput(force = false) {
  if (!clientState.socket || clientState.socket.readyState !== WebSocket.OPEN || clientState.spectatorMode) {
    return;
  }

  if ((clientState.socket.bufferedAmount || 0) > MAX_CLIENT_SOCKET_BACKLOG_BYTES && !force) {
    return;
  }

  const now = performance.now();
  const nextInput = currentInputSnapshot();
  const signature = inputSignature(nextInput);
  const pointerDelta = Math.hypot(
    nextInput.pointerX - clientState.lastSentPointerWorld.x,
    nextInput.pointerY - clientState.lastSentPointerWorld.y
  );
  const activeInput = Boolean(
    nextInput.x ||
      nextInput.y ||
      nextInput.boost ||
      nextInput.attack ||
      nextInput.hatch ||
      nextInput.merge ||
      nextInput.split
  );
  const minResendMs = activeInput ? (nextInput.attack ? 33 : INPUT_HEARTBEAT_MS) : INPUT_IDLE_HEARTBEAT_MS;
  const changed = signature !== clientState.lastSentInputSignature;
  const pointerChanged = pointerDelta >= INPUT_POINTER_SEND_THRESHOLD_WORLD;

  if (!force && !changed && !pointerChanged && now - clientState.lastSentInputAt < minResendMs) {
    return;
  }

  const inputSeq = ++clientState.network.inputSeq;
  clientState.network.maxSentInputSeq = inputSeq;
  clientState.socket.send(
    JSON.stringify({
      type: "input",
      inputSeq,
      x: nextInput.x,
      y: nextInput.y,
      boost: nextInput.boost,
      hatch: nextInput.hatch,
      merge: nextInput.merge,
      split: nextInput.split,
      attack: nextInput.attack,
      pointerX: Math.round(nextInput.pointerX),
      pointerY: Math.round(nextInput.pointerY)
    })
  );
  clientState.lastSentInputSignature = signature;
  clientState.lastSentInputAt = now;
  clientState.lastSentPointerWorld = {
    x: nextInput.pointerX,
    y: nextInput.pointerY
  };

  inputState.hatch = false;
  inputState.merge = false;
  inputState.split = false;
}

function renderBackground() {
  context.clearRect(0, 0, viewport.width, viewport.height);

  if (isLowGraphics()) {
    context.fillStyle = "#171134";
  } else {
    const gradient = context.createLinearGradient(0, 0, 0, viewport.height);
    gradient.addColorStop(0, "#2f275f");
    gradient.addColorStop(1, "#0f0b24");
    context.fillStyle = gradient;
  }
  context.fillRect(0, 0, viewport.width, viewport.height);

  context.strokeStyle = isLowGraphics() ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.05)";
  context.lineWidth = 1;
  const gridStep = isLowGraphics() ? 72 : 48;

  for (let x = -gridStep; x < viewport.width + gridStep; x += gridStep) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, viewport.height);
    context.stroke();
  }

  for (let y = -gridStep; y < viewport.height + gridStep; y += gridStep) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(viewport.width, y);
    context.stroke();
  }
}

function renderWorldBounds(snapshot) {
  const topLeft = worldToScreen(0, 0);
  const bottomRight = worldToScreen(snapshot.config.mapWidth, snapshot.config.mapHeight);

  context.save();
  context.strokeStyle = "rgba(255, 204, 103, 0.28)";
  context.lineWidth = Math.max(2, scaleWorld(5));
  context.setLineDash([Math.max(6, scaleWorld(16)), Math.max(5, scaleWorld(12))]);
  context.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
  context.restore();
}

function renderGrowthNodes(growthNodes, you) {
  for (const node of growthNodes || []) {
    const screen = worldToScreen(node.x, node.y);
    const edible = Boolean(you && you.radius >= node.requiredRadius);

    context.beginPath();
    context.fillStyle = edible ? "rgba(99, 224, 171, 0.16)" : "rgba(99, 224, 171, 0.08)";
    context.arc(screen.x, screen.y, scaleWorld(node.coreRadius), 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.strokeStyle = edible ? "rgba(153, 255, 214, 0.42)" : "rgba(153, 255, 214, 0.14)";
    context.lineWidth = Math.max(1, scaleWorld(2.4));
    context.arc(screen.x, screen.y, scaleWorld(node.ringRadius), 0, Math.PI * 2);
    context.stroke();

    if (edible) {
      context.beginPath();
      context.strokeStyle = "rgba(255, 209, 102, 0.35)";
      context.lineWidth = Math.max(1, scaleWorld(1.2));
      context.arc(screen.x, screen.y, scaleWorld(node.ringRadius + 6), 0, Math.PI * 2);
      if (!isLowGraphics()) {
        context.stroke();
      }
    }
  }
}

function renderFoods(foods) {
  for (const food of foods) {
    const screen = worldToScreen(food.x, food.y);
    context.beginPath();
    context.fillStyle = "#ffd166";
    context.shadowColor = "rgba(255, 209, 102, 0.45)";
    context.shadowBlur = isLowGraphics() ? 0 : Math.max(6, scaleWorld(16));
    context.arc(screen.x, screen.y, scaleWorld(food.size), 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
  }
}

function renderWorker(player, worker, skin, coreScreen) {
  const screen = worldToScreen(worker.x, worker.y);
  const radius = scaleWorld(worker.radius);

  context.beginPath();
  context.strokeStyle = `${skin.primary}88`;
  context.lineWidth = Math.max(1, scaleWorld(2));
  context.moveTo(coreScreen.x, coreScreen.y);
  context.lineTo(screen.x, screen.y);
  context.stroke();

  context.beginPath();
  context.fillStyle = worker.mode === "raid" ? skin.secondary : skin.worker;
  context.moveTo(screen.x, screen.y - radius);
  context.lineTo(screen.x + radius * 0.85, screen.y);
  context.lineTo(screen.x, screen.y + radius);
  context.lineTo(screen.x - radius * 0.85, screen.y);
  context.closePath();
  context.fill();
  context.strokeStyle = skin.primary;
  context.lineWidth = Math.max(1, scaleWorld(2));
  context.stroke();
}

function renderPlayer(player, isYou) {
  const screen = worldToScreen(player.x, player.y);
  const skin = getSkin(player.skinId);
  const radius = scaleWorld(player.radius);
  const healthRatio = player.healthMax > 0 ? Math.max(0, Math.min(1, player.health / player.healthMax)) : 0;

  context.beginPath();
  context.fillStyle = `${skin.primary}2c`;
  context.arc(screen.x, screen.y, radius + scaleWorld(22), 0, Math.PI * 2);
  context.fill();

  if ((player.spawnProtectedMs || 0) > 0) {
    context.beginPath();
    context.strokeStyle = "rgba(255, 244, 170, 0.72)";
    context.lineWidth = Math.max(2, scaleWorld(3));
    context.arc(screen.x, screen.y, radius + scaleWorld(12), 0, Math.PI * 2);
    if (!isLowGraphics()) {
      context.stroke();
    }
  }

  context.beginPath();
  context.fillStyle = skin.primary;
  context.shadowColor = isYou ? skin.glow : `${skin.primary}88`;
  context.shadowBlur = isLowGraphics() ? 0 : Math.max(8, scaleWorld(isYou ? 28 : 18));
  context.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.beginPath();
  context.fillStyle = skin.secondary;
  context.arc(screen.x - radius * 0.28, screen.y - radius * 0.22, radius * 0.28, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.fillStyle = "#1e153c";
  context.arc(screen.x + radius * 0.16, screen.y + radius * 0.1, radius * 0.18, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#fff8df";
  context.font = `700 ${Math.max(11, scaleWorld(14))}px Manrope`;
  context.textAlign = "center";
  context.fillText(player.name, screen.x, screen.y - radius - scaleWorld(14));

  const barWidth = Math.max(38, radius * 2.3);
  const barX = screen.x - barWidth / 2;
  const barY = screen.y + radius + scaleWorld(10);
  context.fillStyle = "rgba(7, 6, 20, 0.72)";
  context.fillRect(barX, barY, barWidth, Math.max(4, scaleWorld(8)));
  context.fillStyle = healthRatio > 0.45 ? skin.secondary : "#ff7b8b";
  context.fillRect(barX, barY, barWidth * healthRatio, Math.max(4, scaleWorld(8)));
  context.strokeStyle = "rgba(255,255,255,0.18)";
  context.strokeRect(barX, barY, barWidth, Math.max(4, scaleWorld(8)));

  if (!isYou) {
    context.fillStyle = "#fff6dc";
    context.font = `700 ${Math.max(10, scaleWorld(12))}px Manrope`;
    context.textAlign = "center";
    const infoY = barY + Math.max(16, scaleWorld(20));
    context.fillText(`Lv ${player.level} | HP ${Math.round(player.health)}/${Math.round(player.healthMax)}`, screen.x, infoY);
    renderEnemyCardIcons(player, screen.x, infoY + Math.max(6, scaleWorld(8)));
  }

  if (isYou) {
    const commandTarget =
      clientState.connected && clientState.pointerInitialized && !clientState.spectatorMode
        ? clientState.worldPointer
        : { x: player.commandX, y: player.commandY };
    const commandScreen = worldToScreen(commandTarget.x, commandTarget.y);
    if (!isLowGraphics()) {
      context.beginPath();
      context.strokeStyle = `${skin.secondary}55`;
      context.lineWidth = Math.max(1, scaleWorld(2));
      context.arc(screen.x, screen.y, scaleWorld(player.commandRange), 0, Math.PI * 2);
      context.stroke();
    }

    context.beginPath();
    context.fillStyle = skin.secondary;
    context.arc(commandScreen.x, commandScreen.y, Math.max(3, scaleWorld(5)), 0, Math.PI * 2);
    context.fill();
  }

  for (const worker of player.workers) {
    renderWorker(player, worker, skin, screen);
  }
}

function renderMiniMap(snapshot) {
  const width = 180;
  const height = 110;
  const left = viewport.width - width - 28;
  const top = 142;

  context.fillStyle = "rgba(10, 8, 24, 0.72)";
  context.fillRect(left, top, width, height);
  context.strokeStyle = "rgba(255,255,255,0.16)";
  context.strokeRect(left, top, width, height);

  for (const food of snapshot.foods) {
    const x = left + (food.x / snapshot.config.mapWidth) * width;
    const y = top + (food.y / snapshot.config.mapHeight) * height;
    context.fillStyle = "#ffd166";
    context.fillRect(x, y, 2, 2);
  }

  for (const node of snapshot.growthNodes || []) {
    const x = left + (node.x / snapshot.config.mapWidth) * width;
    const y = top + (node.y / snapshot.config.mapHeight) * height;
    context.beginPath();
    context.strokeStyle = "rgba(153, 255, 214, 0.6)";
    context.lineWidth = 1;
    context.arc(x, y, 3, 0, Math.PI * 2);
    context.stroke();
  }

  const minimapTarget = clientState.spectatorMode ? getSpectateTarget(snapshot) : getYou();
  if (minimapTarget) {
    const skin = getSkin(minimapTarget.skinId);
    const x = left + (minimapTarget.x / snapshot.config.mapWidth) * width;
    const y = top + (minimapTarget.y / snapshot.config.mapHeight) * height;
    context.beginPath();
    context.fillStyle = skin.primary;
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "rgba(255,255,255,0.84)";
  context.font = "700 11px Manrope";
  context.textAlign = "left";
  context.fillText("Arena map", left + 10, top + 15);
}

function renderNetworkPanel() {
  if (!networkPanel) {
    return;
  }

  const snapshot = clientState.snapshot;
  const onlinePlayers = snapshot?.config?.onlinePlayers ?? snapshot?.players?.length ?? 0;
  const targetSnapRate = snapshot?.config?.broadcastRate ?? 0;
  networkPanel.textContent =
    `Ping ${Math.round(clientState.network.pingMs || 0)}ms` +
    ` | Jitter ${Math.round(clientState.network.jitterMs || 0)}ms` +
    ` | Snap ${Math.max(0, clientState.network.snapshotsPerSecond || 0).toFixed(1)}/${targetSnapRate}` +
    ` | In ${Math.max(0, clientState.network.inLossPct || 0).toFixed(1)}%` +
    ` | Out ${Math.max(0, clientState.network.outLossPct || 0).toFixed(1)}%` +
    ` | Online ${onlinePlayers}`;
}

function renderActiveBuffs(player) {
  if (!activeBuffs) {
    return;
  }

  const cards = player?.activeCards || [];
  if (!cards.length) {
    activeBuffs.innerHTML = '<div class="buff-empty">No active buffs yet.</div>';
    return;
  }

  activeBuffs.innerHTML = cards
    .map((card) => {
      const tooltip = `${card.title}: ${card.description}`;
      return `
        <button
          type="button"
          class="buff-chip ${card.rarity}"
          data-tooltip="${escapeHtml(tooltip)}"
          aria-label="${escapeHtml(tooltip)}"
        >
          <img src="${cardArtDataUri(card)}" alt="${escapeHtml(card.title)}" draggable="false" />
        </button>
      `;
    })
    .join("");
}

function showBuffTooltip(button) {
  if (!buffTooltip || !button) {
    return;
  }
  const text = button.dataset.tooltip || "";
  if (!text) {
    hideBuffTooltip();
    return;
  }
  buffTooltip.textContent = text;
  buffTooltip.classList.remove("hidden");
  const rect = button.getBoundingClientRect();
  const tooltipRect = buffTooltip.getBoundingClientRect();
  const left = Math.min(
    window.innerWidth - tooltipRect.width - 12,
    Math.max(12, rect.left + rect.width / 2 - tooltipRect.width / 2)
  );
  const top = Math.min(
    window.innerHeight - tooltipRect.height - 12,
    Math.max(12, rect.top - tooltipRect.height - 10)
  );
  buffTooltip.style.left = `${left}px`;
  buffTooltip.style.top = `${top}px`;
}

function hideBuffTooltip() {
  if (!buffTooltip) {
    return;
  }
  buffTooltip.classList.add("hidden");
}

function renderOverlay() {
  const you = getYou();
  const round = clientState.snapshot?.round;
  const spectateTarget = clientState.spectatorMode || clientState.spectatingFromDeath ? getSpectateTarget() : null;
  if (!you && !clientState.spectatorMode) {
    context.fillStyle = "rgba(255,255,255,0.92)";
    context.font = "800 28px Cinzel";
    context.textAlign = "center";
    const message = clientState.profile
      ? "Press Play Now to enter the world"
      : "Create an account or continue as a guest";
    context.fillText(message, viewport.width / 2, viewport.height / 2);
    return;
  }

  if (clientState.spectatorMode) {
    context.fillStyle = "rgba(255,255,255,0.92)";
    context.font = "800 18px Cinzel";
    context.textAlign = "left";
    context.fillText("Spectator Mode", 20, 32);
    context.font = "700 15px Manrope";
    context.fillText(
      spectateTarget ? `Watching ${spectateTarget.name} | Score ${spectateTarget.score}` : "Waiting for an active hive to watch",
      20,
      54
    );
    context.fillText("Press Esc to return to the main menu.", 20, 76);
    if (round) {
      context.fillText(`Round ${round.number} | Target ${clientState.snapshot.config.roundScoreTarget} score`, 20, 98);
    }
    return;
  }

  const profile = clientState.profile;
  const roundedScore = Math.round(you.score || 0);
  const roundedHealth = Math.round(you.health || 0);
  const roundedHealthMax = Math.round(you.healthMax || 0);
  const roundedRadius = Math.round(you.radius || 0);
  const roundedCommand = Math.round(you.commandRange || 0);
  const matchProgress = you.matchXpForNextLevel ? `${Math.round(you.matchXpIntoLevel || 0)}/${Math.round(you.matchXpForNextLevel)}` : "Max";
  const hudLeft = 20;
  const hudTop = 196;
  context.fillStyle = "rgba(255,255,255,0.92)";
  context.font = "800 18px Cinzel";
  context.textAlign = "left";
  context.fillText(`Score ${roundedScore}`, hudLeft, hudTop);
  context.font = "700 15px Manrope";
  context.fillText(`Health ${roundedHealth}/${roundedHealthMax} | Radius ${roundedRadius} | Command ${roundedCommand}`, hudLeft, hudTop + 22);
  const mergeCooldown = Math.max(0, Math.ceil((you.mergeCooldownMs || 0) / 1000));
  const splitCooldown = Math.max(0, Math.ceil((you.splitCooldownMs || 0) / 1000));
  const mergeStatus = mergeCooldown > 0 ? `Merge ${mergeCooldown}s` : "Merge Ready";
  const splitStatus = splitCooldown > 0 ? `Split ${splitCooldown}s` : "Split Ready";
  context.fillText(
    `Workers ${you.workers.length}/${you.maxWorkers} | Eggs ${you.eggs}/${you.maxEggs} | ${mergeStatus} | ${splitStatus}`,
    hudLeft,
    hudTop + 44
  );
  if (profile) {
    const identityLabel = `Run Lv ${you.level}`;
    const skin = getSkin(profile.selectedSkin);
    context.fillText(`${identityLabel} | Match XP ${matchProgress} | Skin ${skin.name}`, hudLeft, hudTop + 66);
    if ((you.pendingCardChoices || []).length) {
      context.fillText(
        `Card Pick Ready | Lv ${you.pendingCardChoices[0].rewardLevel} ${CARD_RARITY_LABELS[you.pendingCardChoices[0].rarity]}`,
        hudLeft,
        hudTop + 88
      );
    } else if (you.nextCardRewardLevel) {
      context.fillText(`Next card reward at Run Lv ${you.nextCardRewardLevel}`, hudLeft, hudTop + 88);
    }
  }
  if (round) {
    context.fillText(`Round ${round.number} | Target ${currentSnapshot().config.roundScoreTarget} score`, hudLeft, hudTop + 110);
  }

  if (round?.status === "ended") {
    context.fillStyle = "rgba(7, 6, 20, 0.72)";
    context.fillRect(0, 0, viewport.width, viewport.height);
    context.fillStyle = "#fff6dc";
    context.font = "800 34px Cinzel";
    context.textAlign = "center";
    context.fillText(`${round.winnerName} Wins The Round`, viewport.width / 2, viewport.height / 2 - 24);
    context.font = "700 18px Manrope";
    const countdown = Math.max(0, Math.ceil((round.countdownMs || 0) / 1000));
    const reason = round.reason === "score_target" ? "Reached the score target" : "Round complete";
    context.fillText(reason, viewport.width / 2, viewport.height / 2 + 8);
    context.fillText(`Next round starts in ${countdown}s`, viewport.width / 2, viewport.height / 2 + 36);
    return;
  }

  if (!you.alive) {
    context.fillStyle = "rgba(7, 6, 20, 0.76)";
    context.fillRect(0, 0, viewport.width, viewport.height);
    context.fillStyle = "#fff6dc";
    context.font = "800 32px Cinzel";
    context.textAlign = "center";
    context.fillText(
      clientState.spectatingFromDeath && spectateTarget ? `Spectating ${spectateTarget.name}` : "Colony collapsed",
      viewport.width / 2,
      viewport.height / 2 - 12
    );
    context.font = "700 18px Manrope";
    context.fillText(
      clientState.spectatingFromDeath && spectateTarget
        ? `Respawning in ${you.respawnTimer.toFixed(1)}s | Press V to return to your hive`
        : `Respawning in ${you.respawnTimer.toFixed(1)}s | Press V to spectate`,
      viewport.width / 2,
      viewport.height / 2 + 22
    );
  }
}

function drawFrame() {
  renderBackground();
  reconcileRenderSnapshot();
  if (clientState.network.lastSnapshotReceivedAt > 0) {
    clientState.network.snapshotAgeMs = Math.max(0, performance.now() - clientState.network.lastSnapshotReceivedAt);
  }

  const snapshot = clientState.renderSnapshot || clientState.snapshot;
  if (snapshot) {
    const you = getYou();
    const cameraTarget =
      clientState.spectatorMode || (clientState.spectatingFromDeath && (!you || !you.alive))
        ? getSpectateTarget(snapshot)
        : you;

    if (cameraTarget) {
      clientState.camera.x += (cameraTarget.x - clientState.camera.x) * CAMERA_SMOOTHING;
      clientState.camera.y += (cameraTarget.y - clientState.camera.y) * CAMERA_SMOOTHING;
      const desiredZoom = desiredZoomForPlayer(cameraTarget);
      clientState.camera.zoom += (desiredZoom - clientState.camera.zoom) * ZOOM_SMOOTHING;
    }

    renderWorldBounds(snapshot);
    renderGrowthNodes(snapshot.growthNodes, you);
    renderFoods(snapshot.foods);
    for (const player of snapshot.players) {
      renderPlayer(player, player.id === clientState.playerId);
    }
  }

  renderOverlay();
  renderNetworkPanel();
  requestAnimationFrame(drawFrame);
}

function renderStats() {
  const snapshot = clientState.snapshot;
  playerStats.innerHTML = "";
  if (activeBuffs) {
    activeBuffs.innerHTML = '<div class="buff-empty">No active buffs yet.</div>';
  }
  leaderboard.innerHTML = "";

  if (!snapshot) {
    return;
  }

  renderActiveBuffs(getYou() || getPlayerFromSnapshot(snapshot));

  for (const entry of snapshot.leaderboard) {
    const item = document.createElement("li");
    item.textContent = `${entry.name} - ${entry.score} pts - ${entry.workers} workers`;
    leaderboard.appendChild(item);
  }
}

function currentRoomRequestBody() {
  readRoomSelectionFromUi();
  const selection = clientState.roomSelection;
  return {
    authToken: clientState.authToken,
    roomMode: selection.mode,
    roomRegion: selection.region,
    roomId: selection.mode === "custom" ? selection.roomId || "" : "",
    roomName: selection.mode === "custom" ? selection.roomName : "",
    roomConfig:
      selection.mode === "custom"
        ? {
            maxPlayers: selection.roomConfig.maxPlayers,
            foodTarget: selection.roomConfig.foodTarget,
            growthNodeTarget: selection.roomConfig.growthNodeTarget,
            roundScoreTarget: selection.roomConfig.roundScoreTarget,
            mapWidth: selection.roomConfig.mapWidth,
            mapHeight: selection.roomConfig.mapHeight,
            foodValueMultiplier: selection.roomConfig.foodValueMultiplier,
            growthValueMultiplier: selection.roomConfig.growthValueMultiplier,
            hiveDamageMultiplier: selection.roomConfig.hiveDamageMultiplier,
            workerDamageMultiplier: selection.roomConfig.workerDamageMultiplier
          }
        : undefined
  };
}

async function joinGame() {
  if (!clientState.profile || !clientState.authToken) {
    setAuthMessage("Create an account or continue as a guest first.", true);
    return;
  }

  try {
    enterArenaButton.disabled = true;
    setStatus("Crossing into the wilds...");
    const payload = await apiRequest("/join", {
      method: "POST",
      authToken: clientState.authToken,
      body: currentRoomRequestBody()
    });

    clientState.playerId = payload.playerId;
    storeCsrfToken(payload.csrfToken);
    clientState.spectatorId = null;
    clientState.spectatorMode = false;
    clientState.spectatingFromDeath = false;
    clientState.spectatorFocusId = null;
    clientState.profile = payload.profile;
    if (payload.room) {
      setStatus(`Joined ${payload.room.name} in ${payload.room.region}.`);
    }
    connectSocket();
  } catch (error) {
    setAuthMessage(error.message, true);
    enterArenaButton.disabled = false;
  }
}

function connectSocket(mode = "player") {
  clientState.pointerInitialized = false;
  clientState.lastSentInputSignature = "";
  clientState.lastSentInputAt = 0;
  clientState.lastSentPointerWorld = { x: 0, y: 0 };
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const query =
    mode === "spectator"
      ? `spectatorId=${encodeURIComponent(clientState.spectatorId)}`
      : `playerId=${encodeURIComponent(clientState.playerId)}`;
  clientState.socket = new WebSocket(`${protocol}://${window.location.host}?${query}`);

  clientState.socket.addEventListener("open", () => {
    clientState.connected = true;
    clientState.network.lastSnapshotReceivedAt = 0;
    clientState.network.lastSnapshotIntervalMs = 0;
    clientState.network.snapshotsPerSecond = 0;
    clientState.network.snapshotAgeMs = 0;
    clientState.network.lastAckInputSeq = 0;
    clientState.network.maxSentInputSeq = 0;
    clientState.network.outLossPct = 0;
    clientState.network.lastAckReceivedAt = performance.now();
    joinOverlay.classList.add("hidden");
    setStatus(
      mode === "spectator"
        ? "Spectating live match. Press Esc to return to the main menu."
        : "Move with WASD, hatch with Space, merge with Q, split with F, and hold left click to raid."
    );
    enterArenaButton.disabled = false;
    spectateButton.disabled = false;
    if (clientState.pingTimer) {
      clearInterval(clientState.pingTimer);
    }
    clientState.pingTimer = setInterval(sendPing, PING_INTERVAL_MS);
    sendPing();
    ensureAdminDashboardPolling();
    if (clientState.profile?.isAdmin) {
      fetchAdminDashboard();
    }
  });

  clientState.socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "pong") {
      handlePong(payload);
      return;
    }
    if (payload.type === "state") {
      recordSnapshotArrival(payload);
      clientState.snapshot = mergeIncomingSnapshot(clientState.snapshot, payload);
      processRecentEvents(payload.recentEvents);
      clientState.spectatorMode = Boolean(payload.spectator?.active);
      if (payload.spectator?.focusPlayerId && !clientState.spectatingFromDeath) {
        clientState.spectatorFocusId = payload.spectator.focusPlayerId;
      }
      if (payload.profile) {
        clientState.profile = payload.profile;
      }
      const you = getPlayerFromSnapshot(payload);
      if (you?.alive) {
        clientState.spectatingFromDeath = false;
      }
      if (you && !clientState.pointerInitialized) {
        clientState.worldPointer = { x: you.commandX, y: you.commandY };
      }
      renderStats();
      renderAuthState();
      renderAdminPanel();
      ensureAdminDashboardPolling();
    }
  });

  clientState.socket.addEventListener("close", (event) => {
    if (clientState.pingTimer) {
      clearInterval(clientState.pingTimer);
      clientState.pingTimer = null;
    }
    clientState.connected = false;
    clientState.network.snapshotAgeMs = 0;
    clientState.network.outLossPct = 0;
    clientState.network.lastAckReceivedAt = 0;
    clientState.playerId = null;
    clientState.spectatorId = null;
    clientState.snapshot = null;
    clientState.renderSnapshot = null;
    clientState.spectatorMode = false;
    clientState.spectatingFromDeath = false;
    clientState.spectatorFocusId = null;
    clientState.audio.processedEventKeys = [];
    clientState.lastSentInputSignature = "";
    clientState.lastSentInputAt = 0;
    clientState.adminDashboard = null;
    stopAdminDashboardPolling();
    joinOverlay.classList.remove("hidden");
    const closeCode = event.code || "";
    const closeReason = event.reason || "";
    const closeSuffix = closeCode ? ` (${closeCode}${closeReason ? `: ${closeReason}` : ""})` : "";
    setStatus(`Connection closed${closeSuffix}. Re-enter from your account or guest profile when you're ready.`);
    renderAuthState();
  });

  clientState.socket.addEventListener("error", () => {
    setStatus("Socket error. Please reconnect.");
  });
}

function handleKeyChange(event, isPressed) {
  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" && joinOverlay && !joinOverlay.classList.contains("hidden")) {
    return;
  }

  const key = event.key.toLowerCase();
  if (key === "escape" && isPressed && isOptionsMenuOpen()) {
    closeOptionsMenu();
    return;
  }
  if (key === "o" && isPressed) {
    if (isOptionsMenuOpen()) {
      closeOptionsMenu();
    } else {
      openOptionsMenu();
      ensureAudioContext();
      playUiClickSound();
    }
    return;
  }
  if (isOptionsMenuOpen()) {
    return;
  }

  if (key === "w") {
    inputState.up = isPressed;
  } else if (key === "s") {
    inputState.down = isPressed;
  } else if (key === "a") {
    inputState.left = isPressed;
  } else if (key === "d") {
    inputState.right = isPressed;
  } else if (key === "shift") {
    inputState.boost = isPressed;
  } else if (key === "q") {
    if (isPressed) {
      inputState.merge = true;
    }
  } else if (key === "f") {
    if (isPressed) {
      inputState.split = true;
    }
  } else if (key === " ") {
    if (isPressed) {
      inputState.hatch = true;
    }
    event.preventDefault();
  } else if (key === "v") {
    if (isPressed) {
      toggleDeathSpectate();
    }
  } else if (key === "escape") {
    if (isPressed && clientState.connected) {
      returnToMainMenu();
    }
  } else {
    return;
  }

  sendInput(true);
}

registerStarterSkins.addEventListener("click", (event) => {
  const button = event.target.closest("[data-skin]");
  if (!button) {
    return;
  }
  clientState.registerStarterSkin = button.dataset.skin;
  renderAuthState();
});

guestStarterSkins.addEventListener("click", (event) => {
  const button = event.target.closest("[data-skin]");
  if (!button) {
    return;
  }
  clientState.guestStarterSkin = button.dataset.skin;
  renderAuthState();
});

ownedSkinGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-skin]");
  if (!button) {
    return;
  }
  selectSkin(button.dataset.skin);
});

cardChoiceOverlay.addEventListener("mousedown", (event) => {
  event.stopPropagation();
});

cardChoiceOverlay.addEventListener("mouseup", (event) => {
  event.stopPropagation();
});

cardChoiceOverlay.addEventListener("click", (event) => {
  event.stopPropagation();
});

cardChoiceOverlay.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

cardChoiceOverlay.addEventListener("pointerup", (event) => {
  event.stopPropagation();
});

cardChoiceGrid.addEventListener("pointerdown", (event) => {
  const button = event.target.closest("[data-card-id]");
  if (!button) {
    return;
  }

  ensureAudioContext();
  event.preventDefault();
  event.stopPropagation();

  if (clientState.cardSelectionPending || button.disabled) {
    return;
  }

  playUiClickSound();
  selectCard(button.dataset.cardId, Number(button.dataset.rewardLevel));
});

cardChoiceGrid.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
});

activeBuffs?.addEventListener("pointerenter", (event) => {
  const button = event.target.closest?.(".buff-chip");
  if (button) {
    showBuffTooltip(button);
  }
}, true);

activeBuffs?.addEventListener("pointermove", (event) => {
  const button = event.target.closest?.(".buff-chip");
  if (button) {
    showBuffTooltip(button);
  }
});

activeBuffs?.addEventListener("pointerleave", hideBuffTooltip, true);
activeBuffs?.addEventListener("focusin", (event) => {
  const button = event.target.closest?.(".buff-chip");
  if (button) {
    showBuffTooltip(button);
  }
});
activeBuffs?.addEventListener("focusout", hideBuffTooltip);

optionsOverlay?.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

optionsOverlay?.addEventListener("click", (event) => {
  if (event.target === optionsOverlay) {
    closeOptionsMenu();
    return;
  }
  event.stopPropagation();
});

for (const button of authModeButtons) {
  button.addEventListener("click", () => {
    ensureAudioContext();
    playUiClickSound();
    switchAuthMode(button.dataset.authMode);
    setAuthMessage("");
  });
}

roomModeSelect?.addEventListener("change", () => {
  playUiClickSound();
  readRoomSelectionFromUi();
  renderRoomSelection();
});

roomRegionSelect?.addEventListener("change", () => {
  readRoomSelectionFromUi();
  fetchAvailableRooms();
});

roomPickerSelect?.addEventListener("change", () => {
  readRoomSelectionFromUi();
});

[
  roomNameInput,
  roomMaxPlayersInput,
  roomFoodTargetInput,
  roomGrowthTargetInput,
  roomGoalInput,
  roomMapWidthInput,
  roomMapHeightInput,
  roomFoodValueInput,
  roomGrowthValueInput,
  roomHiveDamageInput,
  roomWorkerDamageInput
].forEach((input) => {
  input?.addEventListener("input", () => {
    readRoomSelectionFromUi();
  });
});

guestButton.addEventListener("click", () => {
  ensureAudioContext();
  playUiClickSound();
  continueAsGuest();
});
registerButton.addEventListener("click", () => {
  ensureAudioContext();
  playUiClickSound();
  registerAccount();
});
loginButton.addEventListener("click", () => {
  ensureAudioContext();
  playUiClickSound();
  loginAccount();
});
enterArenaButton.addEventListener("click", () => {
  ensureAudioContext();
  playUiClickSound();
  joinGame();
});
spectateButton.addEventListener("click", () => {
  ensureAudioContext();
  playUiClickSound();
  startSpectating();
});
optionsToggleButton?.addEventListener("click", () => {
  ensureAudioContext();
  playUiClickSound();
  openOptionsMenu();
});
openOptionsMenuButton?.addEventListener("click", () => {
  ensureAudioContext();
  playUiClickSound();
  openOptionsMenu();
});
closeOptionsButton?.addEventListener("click", () => {
  playUiClickSound();
  closeOptionsMenu();
});
openAdminDashboardButton?.addEventListener("click", () => {
  ensureAudioContext();
  playUiClickSound();
  window.location.href = "/admin";
});
logoutButton.addEventListener("click", () => {
  playUiClickSound();
  logout();
});
adminRefreshButton?.addEventListener("click", () => {
  playUiClickSound();
  fetchAdminDashboard();
});
adminTestBuildButton?.addEventListener("click", () => {
  playUiClickSound();
  runAdminAction("apply_test_build");
});
adminGodModeButton?.addEventListener("click", () => {
  playUiClickSound();
  runAdminAction("toggle_god_mode");
});
adminHealButton?.addEventListener("click", () => {
  playUiClickSound();
  runAdminAction("heal_refill");
});
adminScoreButton?.addEventListener("click", () => {
  playUiClickSound();
  runAdminAction("add_score", { amount: 5000 });
});
adminWorkersButton?.addEventListener("click", () => {
  playUiClickSound();
  runAdminAction("spawn_workers", { amount: 4 });
});
adminCooldownsButton?.addEventListener("click", () => {
  playUiClickSound();
  runAdminAction("reset_cooldowns");
});
adminResetRoundButton?.addEventListener("click", () => {
  playUiClickSound();
  runAdminAction("reset_round");
});
muteAllToggle?.addEventListener("change", () => {
  ensureAudioContext();
  setSetting("muted", Boolean(muteAllToggle.checked));
});
lowGraphicsToggle?.addEventListener("change", () => {
  playUiClickSound();
  setSetting("lowGraphics", Boolean(lowGraphicsToggle.checked));
});
masterVolumeInput?.addEventListener("input", () => {
  ensureAudioContext();
  setSetting("masterVolume", Number(masterVolumeInput.value) / 100);
});
musicVolumeInput?.addEventListener("input", () => {
  ensureAudioContext();
  setSetting("musicVolume", Number(musicVolumeInput.value) / 100);
});
sfxVolumeInput?.addEventListener("input", () => {
  ensureAudioContext();
  setSetting("sfxVolume", Number(sfxVolumeInput.value) / 100);
});
adminPanel?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-action]");
  if (!button) {
    return;
  }

  playUiClickSound();
  const action = button.dataset.adminAction;
  const extra = {};
  if (button.dataset.playerId) {
    extra.targetPlayerId = button.dataset.playerId;
  }
  if (button.dataset.accountId) {
    extra.targetAccountId = button.dataset.accountId;
  }
  if (button.dataset.guestName) {
    extra.targetGuestName = button.dataset.guestName;
  }
  runAdminAction(action, extra);
});

window.addEventListener("keydown", (event) => handleKeyChange(event, true));
window.addEventListener("keyup", (event) => handleKeyChange(event, false));
window.addEventListener("resize", resizeCanvas);
window.visualViewport?.addEventListener("resize", resizeCanvas);

canvas.addEventListener("pointermove", (event) => {
  if (isOptionsMenuOpen()) {
    return;
  }
  updatePointerFromEvent(event);
  sendInput(inputState.attack);
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || !joinOverlay.classList.contains("hidden") || clientState.spectatorMode || isOptionsMenuOpen()) {
    return;
  }
  ensureAudioContext();
  updatePointerFromEvent(event);
  inputState.attack = true;
  sendInput(true);
});

canvas.addEventListener("pointerup", (event) => {
  if (event.button !== 0) {
    return;
  }
  updatePointerFromEvent(event);
  inputState.attack = false;
  sendInput(true);
});

canvas.addEventListener("mouseleave", () => {
  if (!inputState.attack) {
    return;
  }
  inputState.attack = false;
  sendInput(true);
});

window.addEventListener("pointerup", (event) => {
  if (event.button !== 0 || !inputState.attack) {
    return;
  }
  inputState.attack = false;
  sendInput(true);
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

resizeCanvas();
switchAuthMode("guest");
applySettingsToUi();
updateAudioMix();
renderAuthState();
fetchAvailableRooms();
restoreSession();
setInterval(sendInput, INPUT_SEND_INTERVAL_MS);
requestAnimationFrame(drawFrame);
