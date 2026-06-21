<script lang="ts">
  import { nodes, selectedNodeId, selectNode, wsConnected } from '../state.svelte';
  import { Server, Cpu, HardDrive, MemoryStick, Plus } from '@lucide/svelte';

  const onlineCount = $derived($nodes.filter((n) => n.status === 'online').length);
  const warningCount = $derived($nodes.filter((n) => n.status === 'warning').length);
</script>

<aside class="w-64 bg-bg-secondary border-r border-border flex flex-col h-full">
  <div class="p-5 border-b border-border">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-base font-bold tracking-tight">Canvas VPS</h1>
      <div class="flex items-center gap-1.5">
        <div class="w-1.5 h-1.5 rounded-full {$wsConnected ? 'bg-success' : 'bg-danger'}"></div>
        <span class="text-[10px] text-text-secondary uppercase tracking-wide">
          {$wsConnected ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>

    <div class="flex gap-1.5">
      <div class="flex-1 bg-bg-card rounded-md px-2.5 py-1.5 border border-border">
        <div class="text-[10px] text-text-secondary">Total</div>
        <div class="text-sm font-semibold">{$nodes.length}</div>
      </div>
      <div class="flex-1 bg-bg-card rounded-md px-2.5 py-1.5 border border-border">
        <div class="text-[10px] text-success">Ativos</div>
        <div class="text-sm font-semibold text-success">{onlineCount}</div>
      </div>
      {#if warningCount > 0}
        <div class="flex-1 bg-bg-card rounded-md px-2.5 py-1.5 border border-border">
          <div class="text-[10px] text-warning">Alerta</div>
          <div class="text-sm font-semibold text-warning">{warningCount}</div>
        </div>
      {/if}
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-2">
    {#if $nodes.length === 0}
      <div class="text-center py-8 px-4">
        <div class="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center mx-auto mb-3">
          <Plus class="w-4 h-4 text-text-secondary" />
        </div>
        <p class="text-xs text-text-secondary leading-relaxed">Nenhum node conectado</p>
        <p class="text-[10px] text-text-secondary/60 mt-1">Instale o agent para começar</p>
      </div>
    {/if}

    <div class="space-y-1">
      {#each $nodes as node (node.id)}
        <button
          onclick={() => selectNode(node.id)}
          class="w-full text-left rounded-lg px-3 py-2.5 transition-colors {$selectedNodeId === node.id ? 'bg-bg-card border border-border-active/30 shadow-sm' : 'hover:bg-bg-hover border border-transparent'}"
        >
          <div class="flex items-center gap-2.5">
            <div class="relative shrink-0">
              <div class="w-8 h-8 rounded-md bg-bg-card border border-border flex items-center justify-center">
                <Server class="w-3.5 h-3.5 text-text-secondary" />
              </div>
              <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-bg-secondary {node.status === 'online' ? 'bg-success' : node.status === 'warning' ? 'bg-warning' : 'bg-danger'}"></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-medium truncate">{node.name}</div>
              <div class="text-[10px] text-text-secondary font-mono truncate">{node.ip}</div>
            </div>
          </div>

          <div class="flex gap-3 mt-2 ml-[42px]">
            {#each [{ icon: Cpu, value: node.stats.cpu }, { icon: MemoryStick, value: node.stats.ram }, { icon: HardDrive, value: node.stats.disk }] as stat}
              {@const color = stat.value > 90 ? 'text-danger' : stat.value > 70 ? 'text-warning' : 'text-text-secondary'}
              <div class="flex items-center gap-1 {color}">
                <stat.icon class="w-2.5 h-2.5" />
                <span class="text-[9px] font-mono">{stat.value.toFixed(0)}%</span>
              </div>
            {/each}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <div class="p-3 border-t border-border">
    <div class="text-[10px] text-text-secondary/60 text-center">
      Scroll para zoom · Arrastar fundo para pan
    </div>
  </div>
</aside>
