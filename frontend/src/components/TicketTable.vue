<script setup lang="ts">
import { useRouter } from "vue-router";
import type { Ticket, ColumnDef } from "@shared/types";
import AppButton from "./AppButton.vue";
import AppDataTable from "./AppDataTable.vue";
import TicketRowActions from "./TicketRowActions.vue";

interface Props {
  tickets: Ticket[];
  columns: ColumnDef[];
}

defineProps<Props>();

const emit = defineEmits<{
  action: [key: string, ticketId: string, reason?: string];
}>();

const router = useRouter();

function openDetails(ticketId: string) {
  router.push(`/tickets/${ticketId}`);
}
</script>

<template>
  <AppDataTable :columns="columns" :rows="tickets" row-key="id">
    <template #cell-id="{ row }">
      <AppButton variant="link" @click="openDetails(row.id)">
        {{ row.id }}
      </AppButton>
    </template>
    <template #cell-status="{ row }">
      {{ row.status }}
    </template>
    <template #cell-approvedDate="{ row }">
      {{
        row.approvedDate ? new Date(row.approvedDate).toLocaleDateString() : "—"
      }}
    </template>
    <template #cell-actions="{ row }">
      <TicketRowActions
        :ticket="row"
        @action="
          (key, ticketId, reason) => emit('action', key, ticketId, reason)
        "
      />
    </template>
  </AppDataTable>
</template>
