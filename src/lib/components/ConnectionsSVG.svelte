<script lang="ts">
  import type { VPSNode, Connection } from '../types';

  let { nodes, connections }: { nodes: VPSNode[]; connections: Connection[] } = $props();
</script>

{#each connections as conn (conn.id)}
  {@const from = nodes.find((n) => n.id === conn.from)}
  {@const to = nodes.find((n) => n.id === conn.to)}
  {#if from && to}
    {@const x1 = from.x + 112}
    {@const y1 = from.y + 60}
    {@const x2 = to.x + 112}
    {@const y2 = to.y + 60}
    {@const midX = (x1 + x2) / 2}
    <path
      d="M {x1} {y1} C {midX} {y1}, {midX} {y2}, {x2} {y2}"
      fill="none"
      stroke="var(--color-accent)"
      stroke-width="2"
      stroke-dasharray="6 3"
      opacity="0.4"
    />
  {/if}
{/each}
