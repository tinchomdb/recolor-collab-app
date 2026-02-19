<script setup lang="ts">
import { computed } from "vue";
import type { SelectOption } from "@shared/types";

interface Props {
  modelValue?: string;
  options: readonly (string | SelectOption)[];
  placeholder?: string;
  defaultValue?: string;
  highlight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: undefined,
  defaultValue: "",
  highlight: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const resolvedOptions = computed<SelectOption[]>(() =>
  props.options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt,
  ),
);

const isActive = computed(
  () => props.highlight && props.modelValue !== props.defaultValue,
);

function onChange(event: Event) {
  emit("update:modelValue", (event.target as HTMLSelectElement).value);
}
</script>

<template>
  <select
    class="app-form-select"
    :class="{ 'app-form-select--active': isActive }"
    :value="modelValue"
    @change="onChange"
  >
    <option v-if="placeholder" value="">{{ placeholder }}</option>
    <option v-for="opt in resolvedOptions" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>

<style scoped>
.app-form-select {
  font: inherit;
  border-radius: var(--radius-sm);
  border: var(--border-default);
  padding: var(--space-2);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
}

.app-form-select:focus-visible {
  outline: var(--outline-focus);
  outline-offset: var(--outline-focus-offset);
}

.app-form-select--active {
  border-color: var(--color-accent);
  background: var(--color-bg-muted);
}
</style>
