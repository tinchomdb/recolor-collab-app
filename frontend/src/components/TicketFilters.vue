<script setup lang="ts">
import { computed } from "vue";
import type { DropdownInputDef } from "../types/components";
import AppButton from "./AppButton.vue";
import AppFormSelect from "./AppFormSelect.vue";

interface Props {
  filters: DropdownInputDef[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  change: [update: Record<string, string>];
  clear: [];
}>();

const hasActiveFilters = computed(() =>
  props.filters.some((f) => f.value !== ""),
);

function onFilterChange(key: string, value: string) {
  emit("change", { [key]: value });
}
</script>

<template>
  <div class="filters-row">
    <AppFormSelect
      v-for="filter in filters"
      :key="filter.key"
      :model-value="filter.value"
      :options="filter.options"
      :placeholder="filter.placeholder"
      highlight
      @update:model-value="(v) => onFilterChange(filter.key, v)"
    />

    <AppButton
      variant="secondary"
      :disabled="!hasActiveFilters"
      @click="emit('clear')"
    >
      Clear Filters
    </AppButton>
  </div>
</template>

<style scoped>
.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-3);
}
</style>
