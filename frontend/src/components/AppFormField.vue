<script setup lang="ts">
interface Props {
  label: string;
  required?: boolean;
}

withDefaults(defineProps<Props>(), {
  required: false,
});
</script>

<template>
  <label class="form-field">
    <span class="form-field__label">
      {{ label
      }}<span v-if="required" class="form-field__required" aria-hidden="true">
        *</span
      >
    </span>
    <slot />
  </label>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-field__required {
  color: var(--color-error);
  margin-left: var(--space-1);
}
</style>
