<script lang="ts">
  import { formatBytes, formatUptime } from '../utils';
  import { Server, Wifi, WifiOff, Cpu, MemoryStick, HardDrive, ArrowDown, ArrowUp } from '@lucide/svelte';

  let { node, isSelected, onmousedown }: { node: any; isSelected: boolean; onmousedown: (e: MouseEvent) => void } = $props();

  const statusDot = $derived(
    node.status === 'online' ? 'bg-success' :
    node.status === 'warning' ? 'bg-warning' : 'bg-danger'
  );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="absolute select-none cursor-move w-56 bg-bg-card rounded-xl border shadow-sm {isSelected ? 'border-border-active shadow-md ring-1 ring-border-active/20' : 'border-border hover:shadow-md'}"
  style="left: {node.x}px; top: {node.y}px"
  {onmousedown}
>
  <div class="px-3 py-2.5 flex items-center gap-2">
    <div class="relative shrink-0">
      <div class="w-7 h-7 rounded-md bg-bg-primary border border-border flex items-center justify-center">
        <Server class="w-3.5 h-3.5 text-text-secondary" />
      </div>
      <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-bg-card {statusDot}"></div>
    </div>
    <div class="flex-1 min-w-0">
      <div class="text-xs font-semibold truncate">{node.name}</div>
      <div class="text-[10px] text-text-secondary font-mono">{node.ip}:{node.port}</div>
    </div>
    {#if node.status === 'online'}
      <Wifi class="w-3 h-3 text-success shrink-0" />
    {:else}
      <WifiOff class="w-3 h-3 text-danger shrink-0" />
    {/if}
  </div>

  <div class="px-3 pb-2.5 space-y-1.5">
    {#each [{ icon: Cpu, label: 'CPU', value: node.stats.cpu }, { icon: MemoryStick, label: 'RAM', value: node.stats.ram }, { icon: HardDrive, label: 'Disk', value: node.stats.disk }] as bar}
      {@const color = bar.value > 90 ? 'bg-danger' : bar.value > 70 ? 'bg-warning' : 'bg-accent'}
      <div class="flex items-center gap-2">
        <span class="text-text-secondary/60 w-3"><bar.icon class="w-3 h-3" /></span>
        <span class="text-[10px] text-text-secondary w-7">{bar.label}</span>
        <div class="flex-1 h-1 bg-bg-primary rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500 {color}" style="width: {Math.min(bar.value, 100)}%"></div>
        </div>
        <span class="text-[10px] w-8 text-right font-mono">{bar.value.toFixed(0)}%</span>
      </div>
    {/each}
  </div>

  <div class="px-3 py-2 border-t border-border/50 bg-bg-primary/30 rounded-b-xl">
    <div class="flex justify-between text-[10px]">
      <div class="flex items-center gap-1 text-success">
        <ArrowDown class="w-2.5 h-2.5" />
        <span>{formatBytes(node.stats.networkInSpeed)}/s</span>
      </div>
      <div class="flex items-center gap-1 text-accent">
        <ArrowUp class="w-2.5 h-2.5" />
        <span>{formatBytes(node.stats.networkOutSpeed)}/s</span>
      </div>
      <div class="flex items-center gap-1 text-warning">
        <HardDrive class="w-2.5 h-2.5" />
        <span>R:{formatBytes(node.stats.diskRead)}/s</span>
      </div>
      <div class="flex items-center gap-1 text-warning">
        <HardDrive class="w-2.5 h-2.5" />
        <span>W:{formatBytes(node.stats.diskWrite)}/s</span>
      </div>
    </div>
  </div>

  <div class="px-3 py-1.5 border-t border-border/50 text-[9px] text-text-secondary/70 flex items-center justify-between">
    <span>Up {formatUptime(node.stats.uptime)}</span>
    <span>{node.stats.processes} procs</span>
  </div>
</div>
