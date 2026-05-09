const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { WebSocket } = require("ws");

const PORT = 4311;
const HOST = `http://127.0.0.1:${PORT}`;
const WS_HOST = `ws://127.0.0.1:${PORT}`;
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "colony-smoke-"));
const dataDir = path.join(tempRoot, "data");
fs.mkdirSync(dataDir, { recursive: true });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${HOST}/healthz`);
      if (response.ok) {
        return;
      }
    } catch {}
    await wait(250);
  }
  throw new Error("Server did not become healthy in time.");
}

async function request(pathname, { method = "GET", token = "", csrfToken = "", body } = {}) {
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }
  const response = await fetch(`${HOST}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${pathname} failed: ${payload.error || response.status}`);
  }
  return payload;
}

function connectWebSocket(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timeout = setTimeout(() => {
      socket.terminate();
      reject(new Error(`WebSocket timeout for ${url}`));
    }, 6000);

    socket.once("message", (raw) => {
      clearTimeout(timeout);
      try {
        const payload = JSON.parse(raw.toString("utf8"));
        resolve({ socket, payload });
      } catch (error) {
        reject(error);
      }
    });
    socket.once("error", reject);
  });
}

function waitForSocketMessage(socket, predicate, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for WebSocket message."));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      socket.off("message", onMessage);
      socket.off("error", onError);
    }

    function onError(error) {
      cleanup();
      reject(error);
    }

    function onMessage(raw) {
      let payload;
      try {
        payload = JSON.parse(raw.toString("utf8"));
      } catch {
        return;
      }
      if (predicate(payload)) {
        cleanup();
        resolve(payload);
      }
    }

    socket.on("message", onMessage);
    socket.once("error", onError);
  });
}

async function main() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "AdminPass1234"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  try {
    await waitForHealth();

    const register = await request("/auth/register", {
      method: "POST",
      body: {
        username: "smoketest",
        password: "SmokeTest123",
        starterSkin: "ember"
      }
    });

    const authMe = await request("/auth/me", {
      token: register.authToken
    });

    const roomsPayload = await request("/rooms");
    if (roomsPayload.serverRegion !== "singapore" || roomsPayload.supportedRegions.length !== 1 || roomsPayload.supportedRegions[0] !== "singapore") {
      throw new Error("Room regions should only expose the configured server region.");
    }

    const join = await request("/join", {
      method: "POST",
      token: register.authToken,
      csrfToken: authMe.csrfToken,
      body: {
        roomMode: "public",
        roomRegion: "singapore"
      }
    });

    const playerWs = await connectWebSocket(`${WS_HOST}?playerId=${encodeURIComponent(join.playerId)}`);
    playerWs.socket.close();
    await wait(250);

    const customJoin = await request("/join", {
      method: "POST",
      token: register.authToken,
      csrfToken: authMe.csrfToken,
      body: {
        roomMode: "custom",
        roomRegion: "singapore",
        roomName: "Smoke Movement",
        roomConfig: {
          maxPlayers: 8,
          foodTarget: 160,
          growthNodeTarget: 8,
          roundScoreTarget: 6000
        }
      }
    });

    const customWs = await connectWebSocket(`${WS_HOST}?playerId=${encodeURIComponent(customJoin.playerId)}`);
    const initialCustomState = await waitForSocketMessage(customWs.socket, (payload) => payload.type === "state" && payload.you === customJoin.playerId);
    const initialPlayer = initialCustomState.players.find((player) => player.id === customJoin.playerId);
    if (!initialPlayer) {
      throw new Error("Custom room player missing from initial state.");
    }
    customWs.socket.send(
      JSON.stringify({
        type: "input",
        inputSeq: 1,
        x: 1,
        y: 0,
        boost: false,
        hatch: false,
        merge: false,
        split: false,
        attack: false,
        pointerX: initialPlayer.x + 300,
        pointerY: initialPlayer.y
      })
    );
    const movedCustomState = await waitForSocketMessage(
      customWs.socket,
      (payload) => {
        if (payload.type !== "state" || payload.you !== customJoin.playerId) {
          return false;
        }
        const player = payload.players.find((entry) => entry.id === customJoin.playerId);
        return player && player.x > initialPlayer.x + 4;
      },
      7000
    );
    const movedPlayer = movedCustomState.players.find((player) => player.id === customJoin.playerId);
    if (!movedPlayer || movedPlayer.x <= initialPlayer.x + 4) {
      throw new Error("Custom room player did not move after input.");
    }
    customWs.socket.close();
    await wait(250);

    const spectate = await request("/spectate", {
      method: "POST",
      token: register.authToken,
      csrfToken: authMe.csrfToken,
      body: {
        roomMode: "custom",
        roomRegion: "singapore",
        roomName: "Smoke Custom",
        roomConfig: {
          maxPlayers: 12,
          foodTarget: 320,
          growthNodeTarget: 16,
          roundScoreTarget: 9000
        }
      }
    });

    const spectatorWs = await connectWebSocket(`${WS_HOST}?spectatorId=${encodeURIComponent(spectate.spectatorId)}`);
    spectatorWs.socket.close();

    const adminLogin = await request("/auth/login", {
      method: "POST",
      body: {
        username: "admin",
        password: "AdminPass1234"
      }
    });

    const adminMe = await request("/auth/me", {
      token: adminLogin.authToken
    });

    await request("/admin/dashboard", {
      token: adminLogin.authToken
    });

    await request("/admin/action", {
      method: "POST",
      token: adminLogin.authToken,
      csrfToken: adminMe.csrfToken,
      body: {
        action: "reset_round"
      }
    });

    console.log("Smoke tests passed.");
  } finally {
    child.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
