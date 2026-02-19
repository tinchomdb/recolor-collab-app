<script setup lang="ts">
interface Props {
  title?: string;
}

defineProps<Props>();
</script>

<template>
  <section class="panel">
    <div v-if="title || $slots['header-actions']" class="panel-header">
      <h2 v-if="title">{{ title }}</h2>
      <slot name="header-actions" />
    </div>
    <slot />
  </section>
</template>

<style scoped>
.panel {
  background: var(--color-bg-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}
</style>
