<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import Canvas from './lib/components/Canvas.svelte';
  import StatsPanel from './lib/components/StatsPanel.svelte';
  import { nodes, selectedNodeId, addNode, updateNode, wsConnected } from './lib/state.svelte';
  import { mockNodes } from './lib/mockData';
  import { connectWS, disconnectWS } from './lib/websocket';
  import type { VPSNode } from './lib/types';

  onMount(() => {
    mockNodes.forEach((node) => addNode(node));

    const interval = setInterval(() => {
      mockNodes.forEach((node) => {
        const cpuVariance = (Math.random() - 0.5) * 10;
        const ramVariance = (Math.random() - 0.5) * 5;
        updateNode(node.id, {
          stats: {
            ...node.stats,
            cpu: Math.max(0, Math.min(100, node.stats.cpu + cpuVariance)),
            ram: Math.max(0, Math.min(100, node.stats.ram + ramVariance)),
            networkInSpeed: node.stats.networkInSpeed * (0.8 + Math.random() * 0.4),
            networkOutSpeed: node.stats.networkOutSpeed * (0.8 + Math.random() * 0.4),
            diskRead: node.stats.diskRead * (0.7 + Math.random() * 0.6),
            diskWrite: node.stats.diskWrite * (0.7 + Math.random() * 0.6),
          },
          lastSeen: Date.now(),
        });
      });
    }, 2000);

    connectWS(
      (data) => {
        const msg = data as { type: string; node?: VPSNode; id?: string; stats?: VPSNode['stats'] };
        if (msg.type === 'register' && msg.node) {
          addNode(msg.node);
        } else if (msg.type === 'stats' && msg.id && msg.stats) {
          updateNode(msg.id, { stats: msg.stats, lastSeen: Date.now() });
        }
      },
      (connected) => { wsConnected.set(connected); }
    );

    return () => {
      clearInterval(interval);
      disconnectWS();
    };
  });
</script>

<div class="flex h-screen overflow-hidden">
  <Sidebar />
  <Canvas />
  {#if $selectedNodeId}
    <StatsPanel />
  {/if}
</div>
