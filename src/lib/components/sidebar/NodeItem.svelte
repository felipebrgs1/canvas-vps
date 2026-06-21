<script lang="ts">
  import type { VPSNode } from '../../types';

  interface Props {
    node: VPSNode;
    selected: boolean;
    onclick: () => void;
  }

  let { node, selected, onclick }: Props = $props();

  const statusClass = $derived(
    node.status === 'online'
      ? 'bg-success'
      : node.status === 'warning'
        ? 'bg-warning'
        : 'bg-danger'
  );
</script>

<button
  {onclick}
  class="relative w-full flex items-center gap-2.5 pl-4 pr-3 py-1.5 rounded-md text-left transition-colors hover:bg-bg-hover/70 {selected ? 'bg-bg-hover' : ''}"
>
  {#if selected}
    <span class="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-accent"></span>
  {/if}
  <span
    class="w-1.5 h-1.5 rounded-full {statusClass} shrink-0"
    aria-label={node.status}
  ></span>
  <span class="text-[13px] truncate {selected ? 'text-text-primary font-medium' : 'text-text-primary/85'}">
    {node.name}
  </span>
</button>
