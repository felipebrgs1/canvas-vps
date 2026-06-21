import { writable, get } from 'svelte/store';
import type { VPSNode, Connection } from './types';

export const nodes = writable<VPSNode[]>([]);
export const connections = writable<Connection[]>([]);
export const selectedNodeId = writable<string | null>(null);
export const wsConnected = writable<boolean>(false);

export function addNode(node: VPSNode) {
  const current = get(nodes);
  if (current.some((n) => n.id === node.id)) return;
  nodes.set([...current, node]);
}

export function updateNode(id: string, data: Partial<VPSNode>) {
  const current = get(nodes);
  nodes.set(current.map((n) => (n.id === id ? { ...n, ...data } : n)));
}

export function removeNode(id: string) {
  nodes.update((n) => n.filter((x) => x.id !== id));
  connections.update((c) => c.filter((x) => x.from !== id && x.to !== id));
  const sel = get(selectedNodeId);
  if (sel === id) selectedNodeId.set(null);
}

export function selectNode(id: string | null) {
  selectedNodeId.set(id);
}

export function moveNode(id: string, x: number, y: number) {
  nodes.update((current) =>
    current.map((n) => (n.id === id ? { ...n, x, y } : n))
  );
}

export function addConnection(from: string, to: string) {
  const current = get(connections);
  if (current.some((c) => c.id === `${from}-${to}`)) return;
  connections.set([...current, { id: `${from}-${to}`, from, to }]);
}

export function removeConnection(id: string) {
  connections.update((c) => c.filter((x) => x.id !== id));
}
