<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "ghost" | "link";
  align?: "center" | "start" | "end";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  align: "center",
  type: "button",
  disabled: false,
});
</script>

<template>
  <button
    class="app-button"
    :class="[`app-button--${variant}`, `app-button--align-${align}`]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border: var(--border-width-default) solid transparent;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease,
    border-color 120ms ease;
}

.app-button--align-center {
  justify-content: center;
}

.app-button--align-start {
  justify-content: flex-start;
}

.app-button--align-end {
  justify-content: flex-end;
}

.app-button--primary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.app-button--primary:hover:enabled {
  background: var(--color-accent-hover);
}

.app-button--secondary {
  background: var(--color-bg-muted);
  color: var(--color-text-primary);
  border-color: var(--color-border-default);
}

.app-button--secondary:hover:enabled {
  background: var(--color-bg-surface);
}

.app-button--ghost {
  background: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-border-default);
}

.app-button--ghost:hover:enabled {
  background: var(--color-bg-muted);
}

.app-button--link {
  background: transparent;
  border-color: transparent;
  color: var(--color-accent);
  justify-content: flex-start;
  padding: 0;
}

.app-button--link:hover:enabled {
  background: transparent;
  color: var(--color-accent-hover);
}

.app-button:focus-visible {
  outline: var(--outline-focus);
  outline-offset: var(--outline-focus-offset);
}

.app-button:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}
</style>
