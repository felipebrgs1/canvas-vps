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
        const msg = data as { type: string; node?: VPSNode; id?: string; stats?: VPSNode['stats'] };
        if (msg.type === 'snapshot' && Array.isArray((msg as { nodes?: VPSNode[] }).nodes)) {
          (msg as { nodes: VPSNode[] }).nodes.forEach((n) => addNode(n));
        } else if (msg.type === 'register' && msg.node) {
          addNode(msg.node);
        } else if (msg.type === 'stats' && msg.id && msg.stats) {
          updateNode(msg.id, { stats: msg.stats, lastSeen: Date.now() });
        } else if (msg.type === 'offline' && (msg as { id?: string }).id) {
          const id = (msg as { id: string }).id;
          import('./lib/state.svelte').then((s) => s.removeNode(id));
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
