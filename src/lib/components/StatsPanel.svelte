<script lang="ts">
  import { nodes, selectedNodeId, selectNode, removeNode } from '../state.svelte';
  import { formatBytes, formatUptime, getStatusColor, getBarColor } from '../utils';
  import { sendCommand } from '../websocket';
  import { X, Server, Cpu, MemoryStick, HardDrive, Network, Clock, Terminal, Trash2, Download, ArrowDown, ArrowUp, Activity } from '@lucide/svelte';

  const node = $derived($nodes.find((n) => n.id === $selectedNodeId));

  function handleShell() { if (node) sendCommand(node.id, 'open_shell'); }
  function handleReboot() { if (node && confirm(`Reboot ${node.name}?`)) sendCommand(node.id, 'reboot'); }
  function handleShutdown() { if (node && confirm(`Desligar ${node.name}?`)) sendCommand(node.id, 'shutdown'); }
  function handleUpdate() { if (node) sendCommand(node.id, 'update_stats'); }
  function handleRemove() { if (node && confirm(`Remover ${node.name} do canvas?`)) { removeNode(node.id); selectNode(null); } }
</script>

{#if node}
  <aside class="w-80 bg-bg-secondary border-l border-border flex flex-col h-full overflow-y-auto">
    <div class="p-4 border-b border-border flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center">
          <Server class="w-4 h-4 text-accent" />
        </div>
        <div>
          <h2 class="text-sm font-bold">{node.name}</h2>
          <div class="text-[10px] text-text-secondary font-mono">{node.ip}:{node.port}</div>
        </div>
      </div>
      <button onclick={() => selectNode(null)} class="p-1.5 hover:bg-bg-hover rounded-lg transition-colors">
        <X class="w-4 h-4 text-text-secondary" />
      </button>
    </div>

    <div class="p-4 border-b border-border">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-2 h-2 rounded-full {node.status === 'online' ? 'bg-success' : node.status === 'warning' ? 'bg-warning' : 'bg-danger'}"></div>
        <span class="text-xs font-medium capitalize {getStatusColor(node.status)}">{node.status}</span>
      </div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div class="flex justify-between"><span class="text-text-secondary">Local</span><span class="font-medium">{node.location}</span></div>
        <div class="flex justify-between"><span class="text-text-secondary">OS</span><span class="font-medium">{node.os}</span></div>
        <div class="flex justify-between"><span class="text-text-secondary">Uptime</span><span class="font-medium">{formatUptime(node.stats.uptime)}</span></div>
        <div class="flex justify-between"><span class="text-text-secondary">Procs</span><span class="font-medium">{node.stats.processes}</span></div>
        <div class="flex justify-between"><span class="text-text-secondary">Último</span><span class="font-medium">{new Date(node.lastSeen).toLocaleTimeString()}</span></div>
      </div>
    </div>

    <div class="p-4 border-b border-border space-y-3.5">
      <h3 class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Recursos</h3>
      {#each [{ icon: Cpu, label: 'CPU', value: node.stats.cpu }, { icon: MemoryStick, label: 'RAM', value: node.stats.ram, detail: `${formatBytes(node.stats.ramUsed * 1024 * 1024)} / ${formatBytes(node.stats.ramTotal * 1024 * 1024)}` }, { icon: HardDrive, label: 'Disco', value: node.stats.disk, detail: `${formatBytes(node.stats.diskUsed * 1024 * 1024 * 1024)} / ${formatBytes(node.stats.diskTotal * 1024 * 1024 * 1024)}` }] as bar}
        <div>
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1.5 text-xs">
              <span class="text-text-secondary"><bar.icon class="w-3.5 h-3.5" /></span>
              {bar.label}
            </div>
            <span class="text-xs font-mono font-medium">{bar.value.toFixed(1)}%</span>
          </div>
          <div class="h-1.5 bg-bg-card rounded-full overflow-hidden border border-border/50">
            <div class="h-full rounded-full transition-all duration-500 {getBarColor(bar.value)}" style="width: {Math.min(bar.value, 100)}%"></div>
          </div>
          {#if bar.detail}
            <div class="text-[10px] text-text-secondary mt-1 text-right">{bar.detail}</div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="p-4 border-b border-border space-y-3">
      <h3 class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Rede</h3>
      <div class="grid grid-cols-2 gap-2">
        {#each [{ icon: ArrowDown, cls: 'text-success', label: 'Download', val: `${formatBytes(node.stats.networkInSpeed)}/s` }, { icon: ArrowUp, cls: 'text-accent', label: 'Upload', val: `${formatBytes(node.stats.networkOutSpeed)}/s` }, { icon: ArrowDown, cls: 'text-success/40', label: 'Total IN', val: formatBytes(node.stats.networkIn) }, { icon: ArrowUp, cls: 'text-accent/40', label: 'Total OUT', val: formatBytes(node.stats.networkOut) }] as stat}
          <div class="bg-bg-card rounded-lg p-2.5 border border-border">
            <div class="flex items-center gap-1.5 mb-1">
              <stat.icon class="w-3.5 h-3.5 {stat.cls}" />
              <span class="text-[10px] text-text-secondary">{stat.label}</span>
            </div>
            <span class="text-xs font-mono font-semibold">{stat.val}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="p-4 border-b border-border space-y-3">
      <h3 class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Disco I/O</h3>
      <div class="grid grid-cols-2 gap-2">
        {#each [{ icon: Activity, cls: 'text-success', label: 'Leitura', val: `${formatBytes(node.stats.diskRead)}/s` }, { icon: Activity, cls: 'text-warning', label: 'Escrita', val: `${formatBytes(node.stats.diskWrite)}/s` }] as stat}
          <div class="bg-bg-card rounded-lg p-2.5 border border-border">
            <div class="flex items-center gap-1.5 mb-1">
              <stat.icon class="w-3.5 h-3.5 {stat.cls}" />
              <span class="text-[10px] text-text-secondary">{stat.label}</span>
            </div>
            <span class="text-xs font-mono font-semibold">{stat.val}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="p-4 space-y-1.5">
      <h3 class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Ações</h3>
      {#each [{ icon: Download, label: 'Atualizar Stats', onclick: handleUpdate }, { icon: Terminal, label: 'Shell Remota', onclick: handleShell, disabled: true }, { icon: Clock, label: 'Reiniciar', onclick: handleReboot, disabled: true }, { icon: Network, label: 'Desligar', onclick: handleShutdown, danger: true, disabled: true }] as action}
        <button
          onclick={action.onclick}
          disabled={action.disabled}
          class="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors {action.disabled ? 'opacity-35 cursor-not-allowed border-border bg-bg-card text-text-secondary' : action.danger ? 'border-danger/20 bg-danger/5 text-danger hover:bg-danger/10' : 'border-border bg-bg-card text-text-primary hover:bg-bg-hover'}"
        >
          <action.icon class="w-3.5 h-3.5" />
          {action.label}
        </button>
      {/each}
      <div class="pt-2 mt-2 border-t border-border">
        <button
          onclick={handleRemove}
          class="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-danger/20 bg-danger/5 text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5" />
          Remover do Canvas
        </button>
      </div>
    </div>
  </aside>
{/if}
