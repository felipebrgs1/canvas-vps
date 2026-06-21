<script lang="ts">
  import { nodes, selectedNodeId, selectNode, wsConnected } from '../state.svelte';
  import SidebarHeader from './sidebar/SidebarHeader.svelte';
  import NodeItem from './sidebar/NodeItem.svelte';
  import AddNodeModal from './AddNodeModal.svelte';
  import type { VPSNode } from '../types';
  import { Plus } from '@lucide/svelte';

  let collapsed = $state(false);
  let showAdd = $state(false);

  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

  type Group = { label: string; status: VPSNode['status']; nodes: VPSNode[] };

  const groups: Group[] = $derived.by(() => {
    const list = $nodes;
    const all: Group[] = [
      { label: 'Atenção', status: 'warning', nodes: list.filter((n) => n.status === 'warning') },
      { label: 'Online', status: 'online', nodes: list.filter((n) => n.status === 'online') },
      { label: 'Offline', status: 'offline', nodes: list.filter((n) => n.status === 'offline') },
    ];
    return all.filter((g) => g.nodes.length > 0);
  });

  const statusClass = $derived($wsConnected ? 'bg-success' : 'bg-danger');
</script>

<aside
  class="flex flex-col h-full bg-bg-secondary border-r border-border transition-[width] duration-200 ease-out shrink-0 {collapsed ? 'w-14' : 'w-60'}"
>
  <SidebarHeader {collapsed} ontoggle={() => (collapsed = !collapsed)} />

  {#if !collapsed}
    <div class="px-4 py-2 flex items-center justify-between border-b border-border shrink-0">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full {statusClass}"></span>
        <span class="text-[10px] text-text-secondary uppercase tracking-wider">
          {$wsConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
      <button
        onclick={() => (showAdd = true)}
        class="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        title="Adicionar VPS"
      >
        <Plus class="w-3 h-3" /> Add VPS
      </button>
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto {collapsed ? 'py-2' : 'py-3'}">
    {#if $nodes.length === 0}
      {#if collapsed}
        <div class="flex justify-center">
          <span class="w-1.5 h-1.5 rounded-full bg-text-secondary/30"></span>
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center px-4 py-10 text-center">
          <div class="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center mb-3">
            <Plus class="w-4 h-4 text-text-secondary" />
          </div>
          <p class="text-xs text-text-secondary">Nenhum node conectado</p>
          <p class="text-[10px] text-text-secondary/60 mt-1">Instale o agent para começar</p>
        </div>
      {/if}
    {:else if collapsed}
      <div class="flex flex-col items-center gap-1">
        {#each $nodes as node (node.id)}
          {@const isSelected = $selectedNodeId === node.id}
          {@const dot = node.status === 'online' ? 'bg-success' : node.status === 'warning' ? 'bg-warning' : 'bg-danger'}
          <button
            onclick={() => selectNode(node.id)}
            title={node.name}
            aria-label={node.name}
            aria-pressed={isSelected}
            class="w-8 h-8 rounded-md flex items-center justify-center transition-colors {isSelected ? 'bg-bg-hover' : 'hover:bg-bg-hover/70'}"
          >
            <span class="w-2 h-2 rounded-full {dot}"></span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="px-2 space-y-5">
        {#each groups as group (group.status)}
          <div>
            <div class="flex items-center justify-between px-2 mb-1.5">
              <span class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                {group.label}
              </span>
              <span class="text-[10px] text-text-secondary/60 font-mono tabular-nums">
                {group.nodes.length}
              </span>
            </div>
            <div class="space-y-0.5">
              {#each group.nodes as node (node.id)}
                <NodeItem
                  {node}
                  selected={$selectedNodeId === node.id}
                  onclick={() => selectNode(node.id)}
                />
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if !collapsed}
    <div class="px-4 py-2.5 border-t border-border shrink-0">
      <p class="text-[10px] text-text-secondary/50 text-center">
        Scroll para zoom &middot; Arrastar fundo para pan
      </p>
    </div>
  {/if}
</aside>

<AddNodeModal open={showAdd} {wsUrl} onclose={() => (showAdd = false)} />
