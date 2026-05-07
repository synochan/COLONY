const AUTH_TOKEN_KEY = "colony_auth_token";

const adminPageStatus = document.getElementById("adminPageStatus");
const adminPageAccess = document.getElementById("adminPageAccess");
const adminPageAccessMessage = document.getElementById("adminPageAccessMessage");
const adminPageDashboard = document.getElementById("adminPageDashboard");
const adminPageRefreshButton = document.getElementById("adminPageRefreshButton");
const pageAdminNetworkDashboard = document.getElementById("pageAdminNetworkDashboard");
const pageAdminPlayersDashboard = document.getElementById("pageAdminPlayersDashboard");
const pageAdminAccountsDashboard = document.getElementById("pageAdminAccountsDashboard");
const pageAdminGuestsDashboard = document.getElementById("pageAdminGuestsDashboard");
const pageAdminTestBuildButton = document.getElementById("pageAdminTestBuildButton");
const pageAdminGodModeButton = document.getElementById("pageAdminGodModeButton");
const pageAdminHealButton = document.getElementById("pageAdminHealButton");
const pageAdminScoreButton = document.getElementById("pageAdminScoreButton");
const pageAdminWorkersButton = document.getElementById("pageAdminWorkersButton");
const pageAdminCooldownsButton = document.getElementById("pageAdminCooldownsButton");
const pageAdminResetRoundButton = document.getElementById("pageAdminResetRoundButton");

const state = {
  authToken: localStorage.getItem(AUTH_TOKEN_KEY) || "",
  profile: null,
  dashboard: null,
  timer: null
};

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

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (state.authToken) {
    headers.Authorization = `Bearer ${state.authToken}`;
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

function setStatus(text, isError = false) {
  adminPageStatus.textContent = text;
  adminPageStatus.classList.toggle("error", Boolean(isError));
}

function setAccessMessage(html) {
  adminPageAccessMessage.innerHTML = html;
}

function renderDashboard() {
  const hasAccess = Boolean(state.profile?.isAdmin);
  adminPageAccess.classList.toggle("hidden", hasAccess);
  adminPageDashboard.classList.toggle("hidden", !hasAccess);
  if (!hasAccess) {
    return;
  }

  const dashboard = state.dashboard || {};
  const network = dashboard.network || {};
  const metrics = [
    ["Online", network.onlinePlayers ?? 0],
    ["Spectators", network.spectators ?? 0],
    ["Sessions", network.sessions ?? 0],
    ["Tick / Broadcast", `${network.tickRate ?? 0} / ${network.broadcastRate ?? 0}`],
    ["Heap / RSS", `${network.heapUsedMb ?? 0}MB / ${network.rssMb ?? 0}MB`],
    ["Uptime", formatDuration(network.uptimeSec)],
    ["Food / Growth", `${network.foods ?? 0} / ${network.growthNodes ?? 0}`],
    ["Leaderboard Ver", network.leaderboardVersion ?? 0]
  ];
  pageAdminNetworkDashboard.innerHTML = metrics
    .map(
      ([label, value]) => `
        <div class="admin-metric">
          <strong>${escapeHtml(label)}</strong>
          <span class="admin-metric-value">${escapeHtml(value)}</span>
        </div>
      `
    )
    .join("");

  const players = Array.isArray(dashboard.players) ? dashboard.players : [];
  pageAdminPlayersDashboard.innerHTML = players.length
    ? players
        .map((entry) => {
          const isAdmin = Boolean(entry.isAdmin);
          const badge = isAdmin ? '<span class="admin-badge">Admin</span>' : "";
          const actions = isAdmin
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
              ${actions}
            </div>
          `;
        })
        .join("")
    : '<div class="admin-empty"><strong>No live players.</strong> The arena is empty right now.</div>';

  const accounts = Array.isArray(dashboard.accounts) ? dashboard.accounts : [];
  pageAdminAccountsDashboard.innerHTML = accounts.length
    ? accounts
        .map((account) => {
          const badge = account.role === "admin" ? '<span class="admin-badge">Admin</span>' : "";
          const unban = account.banned
            ? `<div class="admin-actions"><button type="button" class="admin-action" data-admin-action="unban_account" data-account-id="${escapeHtml(account.id)}">Unban Account</button></div>`
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
              ${unban}
            </div>
          `;
        })
        .join("")
    : '<div class="admin-empty"><strong>No saved accounts.</strong></div>';

  const bannedGuests = Array.isArray(dashboard.bannedGuests) ? dashboard.bannedGuests : [];
  pageAdminGuestsDashboard.innerHTML = bannedGuests.length
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

async function loadProfile() {
  if (!state.authToken) {
    state.profile = null;
    setStatus("Admin session not found. Log in from the main page first.", true);
    setAccessMessage('<strong>Admin session required.</strong> Go back to the main game page, log in as the admin account, then reopen this dashboard.');
    renderDashboard();
    return;
  }

  try {
    const payload = await apiRequest("/auth/me");
    state.profile = payload.profile;
    if (!state.profile?.isAdmin) {
      setStatus("This session is not an admin session.", true);
      setAccessMessage('<strong>Admin session required.</strong> Log in with the admin account from the main game page to unlock this dashboard.');
      renderDashboard();
      return;
    }
    setStatus(`Signed in as ${state.profile.displayName}. Live admin controls are ready.`);
    renderDashboard();
    await fetchDashboard();
    startPolling();
  } catch (error) {
    setStatus(error.message, true);
    setAccessMessage(`<strong>Unable to verify admin session.</strong> ${escapeHtml(error.message)}`);
    renderDashboard();
  }
}

async function fetchDashboard() {
  if (!state.profile?.isAdmin) {
    return;
  }
  try {
    const payload = await apiRequest("/admin/dashboard");
    state.dashboard = payload;
    renderDashboard();
  } catch (error) {
    setStatus(error.message, true);
  }
}

function startPolling() {
  if (state.timer) {
    return;
  }
  state.timer = setInterval(fetchDashboard, 2500);
}

async function runAdminAction(action, extra = {}) {
  try {
    const payload = await apiRequest("/admin/action", {
      method: "POST",
      body: { action, ...extra }
    });
    if (payload.profile) {
      state.profile = payload.profile;
    }
    if (payload.dashboard) {
      state.dashboard = payload.dashboard;
    }
    setStatus(`Admin action "${action}" completed.`);
    renderDashboard();
  } catch (error) {
    setStatus(error.message, true);
  }
}

adminPageRefreshButton?.addEventListener("click", fetchDashboard);
pageAdminTestBuildButton?.addEventListener("click", () => runAdminAction("apply_test_build"));
pageAdminGodModeButton?.addEventListener("click", () => runAdminAction("toggle_god_mode"));
pageAdminHealButton?.addEventListener("click", () => runAdminAction("heal_refill"));
pageAdminScoreButton?.addEventListener("click", () => runAdminAction("add_score", { amount: 5000 }));
pageAdminWorkersButton?.addEventListener("click", () => runAdminAction("spawn_workers", { amount: 4 }));
pageAdminCooldownsButton?.addEventListener("click", () => runAdminAction("reset_cooldowns"));
pageAdminResetRoundButton?.addEventListener("click", () => runAdminAction("reset_round"));

adminPageDashboard?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-action]");
  if (!button) {
    return;
  }
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
  runAdminAction(button.dataset.adminAction, extra);
});

loadProfile();
