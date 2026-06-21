<script lang="ts">
  import { X, Copy, Check, Terminal } from '@lucide/svelte';

  type Props = { open: boolean; wsUrl: string; onclose: () => void };
  let { open, wsUrl, onclose }: Props = $props();

  const newId = () => `vps-${Math.random().toString(36).slice(2, 8)}`;
  const newName = () => `Server ${Math.floor(Math.random() * 99) + 1}`;

  let name = $state('');
  let location = $state('');
  let nodeId = $state('');
  let copied = $state(false);

  $effect(() => {
    if (open) {
      name = newName();
      location = '';
      nodeId = newId();
      copied = false;
    }
  });

  const command = $derived(
    `WS_URL=${wsUrl} \\\n  NODE_ID=${nodeId} \\\n  NODE_NAME="${name}" \\\n  NODE_LOCATION="${location || 'unknown'}" \\\n  bun run agent/index.ts`
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = command;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    onclick={onclose}
    onkeydown={(e) => e.key === 'Escape' && onclose()}
    role="button"
    tabindex="-1"
  >
    <div
      class="bg-bg-secondary border border-border rounded-xl w-full max-w-lg mx-4 shadow-2xl"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="flex items-center justify-between p-4 border-b border-border">
        <div class="flex items-center gap-2">
          <Terminal class="w-4 h-4 text-accent" />
          <h2 class="text-sm font-bold">Adicionar VPS</h2>
        </div>
        <button onclick={onclose} class="p-1.5 hover:bg-bg-hover rounded-lg">
          <X class="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      <div class="p-4 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Nome</span>
            <input
              bind:value={name}
              class="mt-1 w-full px-2.5 py-1.5 text-xs bg-bg-card border border-border rounded-lg focus:outline-none focus:border-accent"
            />
          </label>
          <label class="block">
            <span class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Local</span>
            <input
              bind:value={location}
              placeholder="São Paulo, BR"
              class="mt-1 w-full px-2.5 py-1.5 text-xs bg-bg-card border border-border rounded-lg focus:outline-none focus:border-accent"
            />
          </label>
        </div>

        <div>
          <span class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Node ID</span>
          <code class="mt-1 block px-2.5 py-1.5 text-xs font-mono bg-bg-card border border-border rounded-lg text-text-secondary">
            {nodeId}
          </code>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Comando</span>
            <button
              onclick={copy}
              class="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-md transition-colors {copied ? 'bg-success/10 text-success' : 'bg-bg-card border border-border hover:bg-bg-hover'}"
            >
              {#if copied}
                <Check class="w-3 h-3" /> Copiado
              {:else}
                <Copy class="w-3 h-3" /> Copiar
              {/if}
            </button>
          </div>
          <pre class="px-3 py-2.5 text-[11px] font-mono bg-bg-card border border-border rounded-lg overflow-x-auto whitespace-pre">WS_URL={wsUrl} \
  NODE_ID={nodeId} \
  NODE_NAME="{name}" \
  NODE_LOCATION="{location || 'unknown'}" \
  bun run agent/index.ts</pre>
        </div>

        <p class="text-[10px] text-text-secondary/70 leading-relaxed">
          Rode o comando na VPS. O node aparece automaticamente quando o agent conectar.
          Requer <code class="px-1 py-0.5 bg-bg-card rounded text-accent">bun</code> instalado.
        </p>
      </div>
    </div>
  </div>
{/if}
