<script lang="ts">
  import { PanelLeftClose, PanelLeftOpen } from '@lucide/svelte';

  interface Props {
    collapsed: boolean;
    ontoggle: () => void;
  }

  let { collapsed, ontoggle }: Props = $props();
</script>

<div class="h-14 flex items-center {collapsed ? 'justify-center' : 'justify-between px-3'} border-b border-border shrink-0">
  {#if !collapsed}
    <div class="flex items-center gap-2 min-w-0">
      <div class="w-6 h-6 rounded-md bg-accent flex items-center justify-center shrink-0">
        <span class="text-bg-primary text-[11px] font-bold leading-none">C</span>
      </div>
      <span class="text-sm font-semibold tracking-tight truncate">Canvas VPS</span>
    </div>
  {/if}
  <button
    onclick={ontoggle}
    class="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0"
    aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
    title={collapsed ? 'Expandir' : 'Recolher'}
  >
    {#if collapsed}
      <PanelLeftOpen class="w-4 h-4" />
    {:else}
      <PanelLeftClose class="w-4 h-4" />
    {/if}
  </button>
</div>
