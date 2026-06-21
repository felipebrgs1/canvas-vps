type VPSNode = {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: "online" | "offline" | "warning";
  location: string;
  os: string;
  stats: {
    cpu: number;
    ram: number;
    ramTotal: number;
    ramUsed: number;
    disk: number;
    diskTotal: number;
    diskUsed: number;
    diskRead: number;
    diskWrite: number;
    uptime: number;
    networkIn: number;
    networkOut: number;
    networkInSpeed: number;
    networkOutSpeed: number;
    processes: number;
  };
  lastSeen: number;
  x: number;
  y: number;
};

type Role = "agent" | "dashboard";
type Client = { role: Role | null; nodeId?: string };
const clients = new WeakMap<WebSocket, Client>();

const PORT = Number(process.env.PORT) || 3001;
const agents = new Map<string, { socket: WebSocket; node: VPSNode }>();
const dashboards = new Set<WebSocket>();

const send = (ws: WebSocket, payload: unknown) => {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
};

const broadcastToDashboards = (payload: unknown) => {
  for (const ws of dashboards) send(ws, payload);
};

const sendNodeList = (ws: WebSocket) => {
  const list = Array.from(agents.values()).map((a) => a.node);
  send(ws, { type: "snapshot", nodes: list });
  console.log(`[dashboard] sent snapshot with ${list.length} node(s)`);
};

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({ ok: true, agents: agents.size, dashboards: dashboards.size, uptime: process.uptime() }),
        { headers: { "content-type": "application/json" } }
      );
    }
    if (server.upgrade(req, { data: { role: null } })) return;
    return new Response("Canvas VPS WS Server", { status: 200 });
  },
  websocket: {
    open(ws) {
      clients.set(ws, { role: null });
      console.log(`[conn] open (total: ${agents.size + dashboards.size + 1})`);
    },
    message(ws, raw) {
      let msg: any;
      try {
        msg = JSON.parse(raw as string);
      } catch {
        return;
      }

      const client = clients.get(ws);
      if (!client) return;

      if (!client.role) {
        if (msg.type === "hello" && (msg.role === "agent" || msg.role === "dashboard")) {
          client.role = msg.role;
          if (msg.role === "agent") {
            client.nodeId = msg.nodeId;
            console.log(`[agent] hello nodeId=${msg.nodeId}`);
          } else {
            dashboards.add(ws);
            clients.set(ws, client);
            sendNodeList(ws);
            console.log(`[dashboard] connected (${dashboards.size} online)`);
          }
          return;
        }
        console.log(`[conn] closing: bad hello`);
        ws.close();
        return;
      }

      if (client.role === "agent") {
        if (msg.type === "register" && msg.node) {
          const node: VPSNode = msg.node;
          client.nodeId = node.id;
          agents.set(node.id, { socket: ws, node });
          broadcastToDashboards({ type: "register", node });
          console.log(`[agent] registered ${node.id} (${node.name}) → ${dashboards.size} dashboard(s)`);
        } else if (msg.type === "stats" && msg.id && msg.stats) {
          const entry = agents.get(msg.id);
          if (!entry) return;
          entry.node = { ...entry.node, stats: msg.stats, lastSeen: Date.now() };
          broadcastToDashboards({ type: "stats", id: msg.id, stats: msg.stats, lastSeen: entry.node.lastSeen });
        }
        return;
      }

      if (client.role === "dashboard") {
        if (msg.type === "command" && msg.targetId) {
          const target = agents.get(msg.targetId);
          if (target) {
            send(target.socket, { type: "command", command: msg.command, targetId: msg.targetId });
            console.log(`[dashboard] → ${msg.targetId}: ${msg.command}`);
          }
        }
      }
    },
    close(ws) {
      const client = clients.get(ws);
      if (!client) return;
      if (client.role === "dashboard") {
        dashboards.delete(ws);
        console.log(`[dashboard] disconnected (${dashboards.size} online)`);
      } else if (client.role === "agent" && client.nodeId) {
        const entry = agents.get(client.nodeId);
        if (entry?.socket === ws) {
          agents.delete(client.nodeId);
          broadcastToDashboards({ type: "offline", id: client.nodeId });
          console.log(`[agent] offline ${client.nodeId}`);
        }
      }
    },
  },
});

console.log(`canvas-vps server listening on ws://0.0.0.0:${server.port}`);
