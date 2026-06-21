import type { VPSNode } from './types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

type MessageHandler = (data: unknown) => void;
type StatusHandler = (connected: boolean) => void;

export function connectWS(onMessage: MessageHandler, onStatus: StatusHandler) {
  if (ws?.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[WS] Connected');
    onStatus(true);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('[WS] Parse error:', e);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected, reconnecting in 3s...');
    onStatus(false);
    reconnectTimer = setTimeout(() => connectWS(onMessage, onStatus), 3000);
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function disconnectWS() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}

export function sendCommand(targetId: string, command: string) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'command', targetId, command }));
  }
}
