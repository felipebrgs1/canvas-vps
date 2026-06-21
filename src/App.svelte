<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import Canvas from './lib/components/Canvas.svelte';
  import StatsPanel from './lib/components/StatsPanel.svelte';
  import { selectedNodeId, addNode, updateNode, wsConnected } from './lib/state.svelte';
  import { connectWS, disconnectWS } from './lib/websocket';
  import type { VPSNode } from './lib/types';

  onMount(() => {
    connectWS(
      (data) => {
        const msg = data as Record<string, unknown>;
        if (msg.type === 'snapshot' && Array.isArray(msg.nodes)) {
          (msg.nodes as VPSNode[]).forEach((n) => addNode(n));
        } else if (msg.type === 'register' && msg.node) {
          addNode(msg.node as VPSNode);
        } else if (msg.type === 'stats' && msg.id && msg.stats) {
          updateNode(msg.id as string, { stats: msg.stats as VPSNode['stats'], lastSeen: Date.now() });
        } else if (msg.type === 'offline' && msg.id) {
          import('./lib/state.svelte').then((s) => s.removeNode(msg.id as string));
        }
      },
      (connected) => { wsConnected.set(connected); }
    );

    return () => {
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
