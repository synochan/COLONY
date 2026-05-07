const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const statusText = document.getElementById("statusText");
const playerStats = document.getElementById("playerStats");
const leaderboard = document.getElementById("leaderboard");
const joinOverlay = document.getElementById("joinOverlay");
const cardChoiceOverlay = document.getElementById("cardChoiceOverlay");
const cardChoiceTitle = document.getElementById("cardChoiceTitle");
const cardChoiceText = document.getElementById("cardChoiceText");
const cardChoiceGrid = document.getElementById("cardChoiceGrid");
const cardChoiceHint = document.getElementById("cardChoiceHint");
const authMessage = document.getElementById("authMessage");
const authUnauthed = document.getElementById("authUnauthed");
const authAuthed = document.getElementById("authAuthed");
const profileSummary = document.getElementById("profileSummary");
const ownedSkinGrid = document.getElementById("ownedSkinGrid");
const registerStarterSkins = document.getElementById("registerStarterSkins");
const guestStarterSkins = document.getElementById("guestStarterSkins");
const enterArenaButton = document.getElementById("enterArenaButton");
const logoutButton = document.getElementById("logoutButton");
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
const STARTER_SKINS = ["ember", "tide", "moss"];
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

const clientState = {
  authToken: localStorage.getItem(AUTH_TOKEN_KEY) || "",
  profile: null,
  authMode: "guest",
  playerId: null,
  socket: null,
  snapshot: null,
  cardSelectionPending: false,
  connected: false,
  camera: { x: 0, y: 0, zoom: BASE_WORLD_ZOOM },
  worldPointer: { x: 0, y: 0 },
  pointerInitialized: false,
  registerStarterSkin: STARTER_SKINS[0],
  guestStarterSkin: STARTER_SKINS[0]
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
  statusText.textContent = text;
}

function setAuthMessage(text, isError = false) {
  authMessage.textContent = text || "";
  authMessage.classList.toggle("error", Boolean(isError));
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

function getYou() {
  return clientState.snapshot?.players.find((player) => player.id === clientState.playerId) || null;
}

function computeInputVector() {
  return {
    x: (inputState.right ? 1 : 0) - (inputState.left ? 1 : 0),
    y: (inputState.down ? 1 : 0) - (inputState.up ? 1 : 0)
  };
}

function updatePointerFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  inputState.pointerX = event.clientX - rect.left;
  inputState.pointerY = event.clientY - rect.top;
  clientState.worldPointer = screenToWorld(inputState.pointerX, inputState.pointerY);
  clientState.pointerInitialized = true;
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
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

function clearToken() {
  clientState.authToken = "";
  localStorage.removeItem(AUTH_TOKEN_KEY);
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
      <span class="profile-badge">${profile.mode === "account" ? `Hive ${modeLabel}` : modeLabel}</span>
    </div>
    <p>Selected skin: <strong style="color:${skin.primary}">${skin.name}</strong></p>
    <p>Unlocked skins: ${profile.ownedSkins.length} / ${Object.keys(SKINS).length}</p>
    <p>${progress}</p>
    <p>Hive cards: ${profile.activeCards.length}${profile.pendingCardChoices.length ? ` | Pending picks ${profile.pendingCardChoices.length}` : ""}</p>
    <div class="card-tag-list">
      ${
        profile.activeCards.length
          ? profile.activeCards
              .map(
                (card) =>
                  `<span class="card-tag ${card.rarity}">${card.title}</span>`
              )
              .join("")
          : '<span class="card-tag empty">No hive cards yet</span>'
      }
    </div>
  `;
}

function getPendingCardChoice() {
  return clientState.profile?.pendingCardChoices?.[0] || null;
}

function renderCardChoiceOverlay() {
  const profile = clientState.profile;
  const pendingChoice = getPendingCardChoice();
  const shouldShow = Boolean(profile && pendingChoice);

  cardChoiceOverlay.classList.toggle("hidden", !shouldShow);
  if (!shouldShow) {
    cardChoiceGrid.innerHTML = "";
    cardChoiceHint.textContent = "";
    clientState.cardSelectionPending = false;
    return;
  }

  cardChoiceTitle.textContent = `Level ${pendingChoice.rewardLevel} reward: choose 1 ${CARD_RARITY_LABELS[pendingChoice.rarity]} card`;
  cardChoiceText.textContent =
    profile.mode === "account"
      ? "This choice is permanent for the account and its buffs apply to your hive immediately."
      : "Guests cannot claim hive cards.";
  cardChoiceHint.textContent = clientState.cardSelectionPending
    ? "Locking in your hive upgrade..."
    : "Pick 1 of the 3 cards below.";
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
          <span class="card-choice-rarity">${CARD_RARITY_LABELS[card.rarity]}</span>
          <strong>${card.title}</strong>
          <span>${card.description}</span>
        </button>
      `
    )
    .join("");
}

function renderAuthState() {
  if (clientState.connected) {
    joinOverlay.classList.add("hidden");
    renderCardChoiceOverlay();
    return;
  }

  joinOverlay.classList.remove("hidden");
  const isAuthed = Boolean(clientState.profile);
  authUnauthed.classList.toggle("hidden", isAuthed);
  authAuthed.classList.toggle("hidden", !isAuthed);
  renderSkinGrid(registerStarterSkins, STARTER_SKINS, clientState.registerStarterSkin);
  renderSkinGrid(guestStarterSkins, STARTER_SKINS, clientState.guestStarterSkin);

  if (isAuthed) {
    renderProfileSummary();
    renderSkinGrid(ownedSkinGrid, Object.keys(SKINS), clientState.profile.selectedSkin, clientState.profile.ownedSkins);
  }

  switchAuthMode(clientState.authMode);
  renderCardChoiceOverlay();
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
    storeToken(payload.authToken);
    clientState.profile = payload.profile;
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
    storeToken(payload.authToken);
    clientState.profile = payload.profile;
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
    storeToken(payload.authToken);
    clientState.profile = payload.profile;
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
    renderAuthState();
  } catch (error) {
    setAuthMessage(error.message, true);
  }
}

async function selectCard(cardId, rewardLevel) {
  try {
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
    clientState.profile = payload.profile;
  } catch (error) {
    setAuthMessage(error.message, true);
  } finally {
    clientState.cardSelectionPending = false;
    renderAuthState();
    renderStats();
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

  clearToken();
  clientState.profile = null;
  clientState.playerId = null;
  clientState.snapshot = null;
  clientState.connected = false;
  setAuthMessage("Signed out.");
  renderAuthState();
}

function sendInput() {
  if (!clientState.socket || clientState.socket.readyState !== WebSocket.OPEN) {
    return;
  }

  const { x, y } = computeInputVector();
  clientState.socket.send(
    JSON.stringify({
      type: "input",
      x,
      y,
      boost: inputState.boost,
      hatch: inputState.hatch,
      merge: inputState.merge,
      attack: inputState.attack,
      pointerX: clientState.worldPointer.x,
      pointerY: clientState.worldPointer.y
    })
  );

  inputState.hatch = false;
  inputState.merge = false;
}

function renderBackground() {
  context.clearRect(0, 0, viewport.width, viewport.height);

  const gradient = context.createLinearGradient(0, 0, 0, viewport.height);
  gradient.addColorStop(0, "#2f275f");
  gradient.addColorStop(1, "#0f0b24");
  context.fillStyle = gradient;
  context.fillRect(0, 0, viewport.width, viewport.height);

  context.strokeStyle = "rgba(255,255,255,0.05)";
  context.lineWidth = 1;

  for (let x = -48; x < viewport.width + 48; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, viewport.height);
    context.stroke();
  }

  for (let y = -48; y < viewport.height + 48; y += 48) {
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

function renderTerrainDecals() {
  for (let i = 0; i < 26; i += 1) {
    const worldX = 120 + (i * 173) % 2600;
    const worldY = 100 + (i * 199) % 1600;
    const screen = worldToScreen(worldX, worldY);

    context.beginPath();
    context.fillStyle = "rgba(99, 224, 171, 0.08)";
    context.arc(screen.x, screen.y, scaleWorld(16 + (i % 3) * 7), 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.strokeStyle = "rgba(153, 255, 214, 0.12)";
    context.lineWidth = Math.max(1, scaleWorld(2));
    context.arc(screen.x, screen.y, scaleWorld(28 + (i % 4) * 5), 0, Math.PI * 2);
    context.stroke();
  }
}

function renderFoods(foods) {
  for (const food of foods) {
    const screen = worldToScreen(food.x, food.y);
    context.beginPath();
    context.fillStyle = "#ffd166";
    context.shadowColor = "rgba(255, 209, 102, 0.45)";
    context.shadowBlur = Math.max(6, scaleWorld(16));
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

  context.beginPath();
  context.fillStyle = skin.primary;
  context.shadowColor = isYou ? skin.glow : `${skin.primary}88`;
  context.shadowBlur = Math.max(8, scaleWorld(isYou ? 28 : 18));
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
    context.fillText(`Lv ${player.level} | HP ${player.health}/${player.healthMax}`, screen.x, infoY);
    renderEnemyCardIcons(player, screen.x, infoY + Math.max(6, scaleWorld(8)));
  }

  if (isYou) {
    const commandScreen = worldToScreen(player.commandX, player.commandY);
    context.beginPath();
    context.strokeStyle = `${skin.secondary}55`;
    context.lineWidth = Math.max(1, scaleWorld(2));
    context.arc(screen.x, screen.y, scaleWorld(player.commandRange), 0, Math.PI * 2);
    context.stroke();

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

  for (const player of snapshot.players) {
    const skin = getSkin(player.skinId);
    const x = left + (player.x / snapshot.config.mapWidth) * width;
    const y = top + (player.y / snapshot.config.mapHeight) * height;
    context.beginPath();
    context.fillStyle = skin.primary;
    context.arc(x, y, player.id === clientState.playerId ? 5 : 4, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "rgba(255,255,255,0.84)";
  context.font = "700 11px Manrope";
  context.textAlign = "left";
  context.fillText("Arena map", left + 10, top + 15);
}

function renderOverlay() {
  const you = getYou();
  const round = clientState.snapshot?.round;
  if (!you) {
    context.fillStyle = "rgba(255,255,255,0.92)";
    context.font = "800 28px Cinzel";
    context.textAlign = "center";
    const message = clientState.profile
      ? "Press Play Now to enter the world"
      : "Create an account or continue as a guest";
    context.fillText(message, viewport.width / 2, viewport.height / 2);
    return;
  }

  const profile = clientState.profile;
  context.fillStyle = "rgba(255,255,255,0.92)";
  context.font = "800 18px Cinzel";
  context.textAlign = "left";
  context.fillText(`Score ${you.score}`, 20, 32);
  context.font = "700 15px Manrope";
  context.fillText(`Health ${you.health}/${you.healthMax} | Radius ${you.radius} | Command ${you.commandRange}`, 20, 54);
  const mergeCooldown = Math.max(0, Math.ceil((you.mergeCooldownMs || 0) / 1000));
  const mergeStatus = mergeCooldown > 0 ? `Merge ${mergeCooldown}s` : "Merge Ready";
  context.fillText(`Workers ${you.workers.length}/${you.maxWorkers} | Eggs ${you.eggs}/${you.maxEggs} | ${mergeStatus}`, 20, 76);
  if (profile) {
    const identityLabel = profile.mode === "account" ? `Hive Lv ${profile.level}` : "Guest";
    const skin = getSkin(profile.selectedSkin);
    context.fillText(`${identityLabel} | Skin ${skin.name}`, 20, 98);
    if (profile.pendingCardChoices.length) {
      context.fillText(`Card Pick Ready | Lv ${profile.pendingCardChoices[0].rewardLevel} ${CARD_RARITY_LABELS[profile.pendingCardChoices[0].rarity]}`, 20, 120);
    } else if (profile.mode === "account" && profile.nextCardRewardLevel) {
      context.fillText(`Next card reward at Hive Lv ${profile.nextCardRewardLevel}`, 20, 120);
    }
  }
  if (round) {
    context.fillText(`Round ${round.number} | Target ${clientState.snapshot.config.roundScoreTarget} score`, 20, 142);
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
    context.fillText("Colony collapsed", viewport.width / 2, viewport.height / 2 - 12);
    context.font = "700 18px Manrope";
    context.fillText(`Respawning in ${you.respawnTimer.toFixed(1)}s`, viewport.width / 2, viewport.height / 2 + 22);
  }
}

function drawFrame() {
  renderBackground();

  const snapshot = clientState.snapshot;
  if (snapshot) {
    const you = getYou();
    if (you) {
      clientState.camera.x += (you.x - clientState.camera.x) * 0.14;
      clientState.camera.y += (you.y - clientState.camera.y) * 0.14;
      const desiredZoom = desiredZoomForPlayer(you);
      clientState.camera.zoom += (desiredZoom - clientState.camera.zoom) * 0.08;
    }

    renderWorldBounds(snapshot);
    renderTerrainDecals();
    renderFoods(snapshot.foods);
    for (const player of snapshot.players) {
      renderPlayer(player, player.id === clientState.playerId);
    }
    renderMiniMap(snapshot);
  }

  renderOverlay();
  requestAnimationFrame(drawFrame);
}

function renderStats() {
  const snapshot = clientState.snapshot;
  playerStats.innerHTML = "";
  leaderboard.innerHTML = "";

  if (!snapshot) {
    return;
  }

  for (const entry of snapshot.leaderboard) {
    const item = document.createElement("li");
    item.textContent = `${entry.name} - ${entry.score} pts - ${entry.workers} workers`;
    leaderboard.appendChild(item);
  }
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
      body: {
        authToken: clientState.authToken
      }
    });

    clientState.playerId = payload.playerId;
    clientState.profile = payload.profile;
    connectSocket();
  } catch (error) {
    setAuthMessage(error.message, true);
    enterArenaButton.disabled = false;
  }
}

function connectSocket() {
  clientState.pointerInitialized = false;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  clientState.socket = new WebSocket(`${protocol}://${window.location.host}?playerId=${clientState.playerId}`);

  clientState.socket.addEventListener("open", () => {
    clientState.connected = true;
    joinOverlay.classList.add("hidden");
    setStatus("Move with WASD, hatch with Space, merge with Q, and raid with E.");
    enterArenaButton.disabled = false;
  });

  clientState.socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "state") {
      clientState.snapshot = payload;
      if (payload.profile) {
        clientState.profile = payload.profile;
      }
      const you = getYou();
      if (you && !clientState.pointerInitialized) {
        clientState.worldPointer = { x: you.commandX, y: you.commandY };
      }
      renderStats();
      renderAuthState();
    }
  });

  clientState.socket.addEventListener("close", () => {
    clientState.connected = false;
    clientState.playerId = null;
    clientState.snapshot = null;
    joinOverlay.classList.remove("hidden");
    setStatus("Connection closed. Re-enter from your account or guest profile when you're ready.");
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
  } else if (key === "e") {
    inputState.attack = isPressed;
  } else if (key === " ") {
    if (isPressed) {
      inputState.hatch = true;
    }
    event.preventDefault();
  } else {
    return;
  }

  sendInput();
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

cardChoiceGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-card-id]");
  if (!button || clientState.cardSelectionPending) {
    return;
  }

  selectCard(button.dataset.cardId, Number(button.dataset.rewardLevel));
});

for (const button of authModeButtons) {
  button.addEventListener("click", () => {
    switchAuthMode(button.dataset.authMode);
    setAuthMessage("");
  });
}

guestButton.addEventListener("click", continueAsGuest);
registerButton.addEventListener("click", registerAccount);
loginButton.addEventListener("click", loginAccount);
enterArenaButton.addEventListener("click", joinGame);
logoutButton.addEventListener("click", logout);

window.addEventListener("keydown", (event) => handleKeyChange(event, true));
window.addEventListener("keyup", (event) => handleKeyChange(event, false));
window.addEventListener("resize", resizeCanvas);
window.visualViewport?.addEventListener("resize", resizeCanvas);

canvas.addEventListener("mousemove", (event) => {
  updatePointerFromEvent(event);
  sendInput();
});

resizeCanvas();
switchAuthMode("guest");
renderAuthState();
restoreSession();
setInterval(sendInput, 50);
requestAnimationFrame(drawFrame);
