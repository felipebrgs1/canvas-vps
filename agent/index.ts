import { hostname, networkInterfaces, platform, release, cpus, totalmem, freemem, uptime, type } from "node:os";
import { readFileSync, readdirSync, statfsSync } from "node:fs";

const WS_URL = process.env.WS_URL || "ws://localhost:3001";
const NODE_ID = process.env.NODE_ID || `vps-${hostname()}`;
const NODE_NAME = process.env.NODE_NAME || hostname();
const NODE_LOCATION = process.env.NODE_LOCATION || "unknown";
const INTERVAL_MS = Number(process.env.INTERVAL_MS) || 2000;

type NetPrev = { rx: number; tx: number };
type DiskPrev = { read: number; write: number };
const netPrev = new Map<string, NetPrev>();
const diskPrev = new Map<string, DiskPrev>();
let cpuPrev: { idle: number; total: number } | null = null;

const osPretty = `${type()} ${release()}`.trim();

const ip = (() => {
  const ifs = networkInterfaces();
  for (const list of Object.values(ifs)) {
    for (const i of list ?? []) {
      if (i.family === "IPv4" && !i.internal) return i.address;
    }
  }
  return "0.0.0.0";
})();

const readProcStat = () => {
  const txt = readFileSync("/proc/stat", "utf8");
  const line = txt.split("\n").find((l) => l.startsWith("cpu "));
  if (!line) return { idle: 0, total: 0 };
  const parts = line.split(/\s+/).slice(1).map(Number);
  const idle = parts[3] + (parts[4] ?? 0);
  const total = parts.reduce((a, b) => a + b, 0);
  return { idle, total };
};

const cpuPercent = (): number => {
  const cur = readProcStat();
  if (!cpuPrev) {
    cpuPrev = cur;
    return 0;
  }
  const dTotal = cur.total - cpuPrev.total;
  const dIdle = cur.idle - cpuPrev.idle;
  cpuPrev = cur;
  if (dTotal <= 0) return 0;
  return Math.max(0, Math.min(100, ((dTotal - dIdle) / dTotal) * 100));
};

const memStats = () => {
  const total = totalmem();
  const used = total - freemem();
  return {
    ram: (used / total) * 100,
    ramTotal: Math.round(total / 1024 / 1024),
    ramUsed: Math.round(used / 1024 / 1024),
  };
};

const diskStats = () => {
  try {
    const s = statfsSync("/");
    const total = s.bsize * s.blocks;
    const free = s.bsize * s.bfree;
    const used = total - free;
    return {
      disk: (used / total) * 100,
      diskTotal: Math.round(total / 1024 / 1024 / 1024),
      diskUsed: Number((used / 1024 / 1024 / 1024).toFixed(2)),
    };
  } catch {
    return { disk: 0, diskTotal: 0, diskUsed: 0 };
  }
};

const netStats = () => {
  const txt = readFileSync("/proc/net/dev", "utf8");
  const lines = txt.split("\n").slice(2);
  let inSpeed = 0;
  let outSpeed = 0;
  let totalIn = 0;
  let totalOut = 0;

  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const name = line.slice(0, colon).trim();
    if (name === "lo") continue;
    const cols = line.slice(colon + 1).trim().split(/\s+/).map(Number);
    if (cols.length < 9) continue;
    const rx = cols[0];
    const tx = cols[8];
    totalIn += rx;
    totalOut += tx;
    const prev = netPrev.get(name);
    if (prev) {
      inSpeed += Math.max(0, rx - prev.rx);
      outSpeed += Math.max(0, tx - prev.tx);
    }
    netPrev.set(name, { rx, tx });
  }
  return {
    networkIn: totalIn,
    networkOut: totalOut,
    networkInSpeed: inSpeed / (INTERVAL_MS / 1000),
    networkOutSpeed: outSpeed / (INTERVAL_MS / 1000),
  };
};

const diskIoStats = () => {
  try {
    const txt = readFileSync("/proc/diskstats", "utf8");
    let readDelta = 0;
    let writeDelta = 0;
    for (const line of txt.split("\n")) {
      const p = line.trim().split(/\s+/);
      if (p.length < 14) continue;
      const name = p[2];
      if (/^(loop|ram|dm-)/.test(name)) continue;
      const sectorsRead = Number(p[5]);
      const sectorsWrite = Number(p[9]);
      const bytesRead = sectorsRead * 512;
      const bytesWrite = sectorsWrite * 512;
      const prev = diskPrev.get(name);
      if (prev) {
        readDelta += Math.max(0, bytesRead - prev.read);
        writeDelta += Math.max(0, bytesWrite - prev.write);
      }
      diskPrev.set(name, { read: bytesRead, write: bytesWrite });
    }
    return {
      diskRead: (readDelta / (INTERVAL_MS / 1000)),
      diskWrite: (writeDelta / (INTERVAL_MS / 1000)),
    };
  } catch {
    return { diskRead: 0, diskWrite: 0 };
  }
};

const processCount = (): number => {
  try {
    return readdirSync("/proc").filter((n) => /^\d+$/.test(n)).length;
  } catch {
    return 0;
  }
};

const collect = () => {
  const mem = memStats();
  const disk = diskStats();
  const net = netStats();
  const io = diskIoStats();
  return {
    cpu: cpuPercent(),
    ram: mem.ram,
    ramTotal: mem.ramTotal,
    ramUsed: mem.ramUsed,
    disk: disk.disk,
    diskTotal: disk.diskTotal,
    diskUsed: disk.diskUsed,
    diskRead: io.diskRead,
    diskWrite: io.diskWrite,
    uptime: uptime(),
    networkIn: net.networkIn,
    networkOut: net.networkOut,
    networkInSpeed: net.networkInSpeed,
    networkOutSpeed: net.networkOutSpeed,
    processes: processCount(),
  };
};

const buildNode = () => ({
  id: NODE_ID,
  name: NODE_NAME,
  ip,
  port: 22,
  status: "online" as const,
  location: NODE_LOCATION,
  os: osPretty,
  stats: collect(),
  lastSeen: Date.now(),
  x: 100,
  y: 100,
});

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let statsTimer: ReturnType<typeof setInterval> | null = null;

const send = (payload: unknown) => {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
};

const startStats = () => {
  if (statsTimer) clearInterval(statsTimer);
  cpuPrev = null;
  netPrev.clear();
  diskPrev.clear();
  statsTimer = setInterval(() => {
    try {
      send({ type: "stats", id: NODE_ID, stats: collect() });
    } catch (e) {
      console.error("[agent] stats error:", e);
    }
  }, INTERVAL_MS);
};

const connect = () => {
  console.log(`[agent] connecting to ${WS_URL} as ${NODE_ID}`);
  ws = new WebSocket(WS_URL);
  ws.addEventListener("open", () => {
    console.log("[agent] connected, registering");
    send({ type: "hello", role: "agent", nodeId: NODE_ID });
    send({ type: "register", node: buildNode() });
    startStats();
  });
  ws.addEventListener("message", (e) => {
    try {
      const msg = JSON.parse(e.data as string);
      if (msg.type === "command") {
        console.log(`[agent] command received: ${msg.command}`);
        if (msg.command === "reboot") {
          console.log("[agent] REBOOT in 2s");
          setTimeout(() => Bun.spawn(["shutdown", "-r", "now"]), 2000);
        } else if (msg.command === "shutdown") {
          console.log("[agent] SHUTDOWN in 2s");
          setTimeout(() => Bun.spawn(["shutdown", "-h", "now"]), 2000);
        } else if (msg.command === "update_stats") {
          send({ type: "stats", id: NODE_ID, stats: collect() });
        }
      }
    } catch (err) {
      console.error("[agent] msg error:", err);
    }
  });
  ws.addEventListener("close", () => {
    console.log("[agent] disconnected, retry in 3s");
    if (statsTimer) clearInterval(statsTimer);
    statsTimer = null;
    reconnectTimer = setTimeout(connect, 3000);
  });
  ws.addEventListener("error", (e) => {
    console.error("[agent] ws error", e);
    ws?.close();
  });
};

connect();
console.log(`canvas-vps agent ${NODE_ID} starting (cpu=${cpus().length} cores, mem=${(totalmem()/1024/1024/1024).toFixed(1)}GB)`);
