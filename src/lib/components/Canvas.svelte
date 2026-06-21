<script lang="ts">
  import { nodes, connections, selectedNodeId, selectNode, moveNode } from '../state.svelte';
  import VPSCard from './VPSCard.svelte';
  import ConnectionsSVG from './ConnectionsSVG.svelte';

  let canvasEl: HTMLDivElement;
  let pan = $state({ x: 0, y: 0 });
  let zoom = $state(1);
  let dragNode: { id: string; offsetX: number; offsetY: number } | null = $state(null);
  let panDrag: { startX: number; startY: number; originX: number; originY: number } | null = $state(null);
  let raf = 0;

  function handleNodeMouseDown(id: string, e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const currentNodes = $nodes;
    const node = currentNodes.find((n) => n.id === id);
    if (!node || !canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;
    dragNode = { id, offsetX: canvasX - node.x, offsetY: canvasY - node.y };
    selectNode(id);
  }

  function handlePanMouseDown(e: MouseEvent) {
    e.preventDefault();
    selectNode(null);
    panDrag = { startX: e.clientX, startY: e.clientY, originX: pan.x, originY: pan.y };
  }

  function handleMouseMove(e: MouseEvent) {
    if (dragNode && canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      const x = canvasX - dragNode.offsetX;
      const y = canvasY - dragNode.offsetY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        moveNode(dragNode!.id, x, y);
      });
      return;
    }

    if (panDrag) {
      const dx = e.clientX - panDrag.startX;
      const dy = e.clientY - panDrag.startY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        pan.x = panDrag!.originX + dx;
        pan.y = panDrag!.originY + dy;
      });
    }
  }

  function handleMouseUp() {
    dragNode = null;
    panDrag = null;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.min(3, Math.max(0.2, zoom * delta));
  }
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={canvasEl}
  class="flex-1 relative overflow-hidden bg-bg-primary"
  style="cursor: {panDrag ? 'grabbing' : 'grab'}"
>
  <div
    class="absolute inset-0 pointer-events-none"
    style="background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px); background-size: {24 * zoom}px {24 * zoom}px; background-position: {pan.x}px {pan.y}px"
  ></div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="absolute inset-0 z-10"
    onmousedown={handlePanMouseDown}
    onwheel={handleWheel}
  ></div>

  <div
    class="absolute inset-0 z-20 pointer-events-none"
    style="transform: translate({pan.x}px, {pan.y}px) scale({zoom}); transform-origin: 0 0"
  >
    <svg class="absolute inset-0 w-full h-full pointer-events-none">
      <ConnectionsSVG nodes={$nodes} connections={$connections} />
    </svg>

    {#if $nodes.length === 0}
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="text-center text-text-secondary">
          <div class="text-6xl mb-4 opacity-20">🖥</div>
          <p class="text-lg font-medium">Canvas vazio</p>
          <p class="text-sm mt-1 opacity-60">Conecte uma VPS para começar</p>
        </div>
      </div>
    {/if}

    {#each $nodes as node (node.id)}
      <div class="pointer-events-auto">
        <VPSCard
          {node}
          isSelected={$selectedNodeId === node.id}
          onmousedown={(e: MouseEvent) => handleNodeMouseDown(node.id, e)}
        />
      </div>
    {/each}
  </div>
</div>
