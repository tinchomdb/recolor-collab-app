<script setup lang="ts">
import AppButton from "./AppButton.vue";

interface Props {
  open: boolean;
  title: string;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
      @keydown.escape="emit('close')"
    >
      <div class="modal-card">
        <header class="modal-header">
          <h2>{{ title }}</h2>
          <AppButton variant="ghost" @click="emit('close')">Close</AppButton>
        </header>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-backdrop);
  display: grid;
  place-items: center;
  z-index: 20;
  padding: var(--space-4);
}

.modal-card {
  width: min(920px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: var(--color-bg-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}
</style>
