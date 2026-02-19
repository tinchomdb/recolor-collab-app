<script setup lang="ts" generic="TRow extends Record<string, any>">
import type { ColumnDef } from "@shared/types";

interface Props {
  columns: ColumnDef[];
  rows: TRow[];
  rowKey?: string;
}

defineProps<Props>();
</script>

<template>
  <table class="app-data-table">
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="rows.length === 0">
        <td :colspan="columns.length" class="app-data-table__empty">
          <slot name="empty">No data available.</slot>
        </td>
      </tr>
      <tr v-for="(row, index) in rows" :key="rowKey ? row[rowKey] : index">
        <td v-for="col in columns" :key="col.key">
          <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
            {{ row[col.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.app-data-table {
  width: 100%;
  border-collapse: collapse;
}

.app-data-table th,
.app-data-table td {
  border: var(--border-default);
  text-align: left;
  padding: var(--space-2);
  vertical-align: top;
  background: var(--color-bg-surface);
}

.app-data-table th {
  font: var(--font-label);
  color: var(--color-text-secondary);
  background: var(--color-bg-muted);
}

.app-data-table__empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--space-4);
}
</style>
