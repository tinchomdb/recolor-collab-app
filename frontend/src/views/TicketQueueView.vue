<script setup lang="ts">
import { computed, ref } from "vue";
import TicketFilters from "../components/TicketFilters.vue";
import AppFormSelect from "../components/AppFormSelect.vue";
import TicketTable from "../components/TicketTable.vue";
import TicketEditorForm from "../components/TicketEditorForm.vue";
import AppSectionPanel from "../components/AppSectionPanel.vue";
import AppButton from "../components/AppButton.vue";
import AppModal from "../components/AppModal.vue";
import { useAuth } from "../composables/useAuth";
import { useTicketsStore } from "../stores/useTicketsStore";
import { useFilterService } from "../composables/useFilterService";
import { useSortService } from "../composables/useSortService";
import type { CreateTicketInput } from "@shared/types";
import { WorkflowAction } from "@shared/constants";

interface Props {
  title?: string;
  canCreate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  canCreate: false,
});

const { partnerName } = useAuth();

const resolvedTitle = computed(
  () => props.title ?? `My Tickets — ${partnerName.value}`,
);

const {
  tickets,
  metadata,
  ticketsViewMeta,
  setError,
  loadQueue,
  create,
  send,
  receive,
  start,
  complete,
  approve,
  reject,
} = useTicketsStore();

const actionMap: Record<string, (id: string, reason?: string) => void> = {
  [WorkflowAction.Send]: send,
  [WorkflowAction.Receive]: receive,
  [WorkflowAction.Start]: start,
  [WorkflowAction.Complete]: complete,
  [WorkflowAction.Approve]: approve,
  [WorkflowAction.Reject]: reject,
};

function handleAction(key: string, ticketId: string, reason?: string) {
  actionMap[key]?.(ticketId, reason);
}

const { filterDefinitions, currentFilters, applyFilter, clearFilters } =
  useFilterService(ticketsViewMeta);

const { sortDefinition, currentSort, applySort } =
  useSortService(ticketsViewMeta);

async function reload() {
  await loadQueue(currentFilters.value, currentSort.value);
}

async function handleFilterChange(update: Record<string, string>) {
  applyFilter(update);
  await reload();
}

async function handleSortChange(value: string) {
  applySort(value);
  await reload();
}

async function handleClear() {
  clearFilters(); // sort intentionally left unchanged
  await reload();
}

const isCreateModalOpen = ref(false);

async function handleCreate(payload: CreateTicketInput) {
  await create(payload);
  isCreateModalOpen.value = false;
}
</script>

<template>
  <AppModal
    v-if="canCreate"
    :open="isCreateModalOpen"
    title="Create Ticket"
    @close="isCreateModalOpen = false"
  >
    <TicketEditorForm
      v-if="metadata"
      :partners="metadata.partners"
      :priorities="metadata.priorities"
      :style-options="metadata.styleOptions"
      :photo-options="metadata.photoOptions"
      submit-label="Create Ticket"
      @submit="handleCreate"
      @validation-error="setError"
    />
  </AppModal>

  <AppSectionPanel :title="resolvedTitle">
    <template v-if="canCreate" #header-actions>
      <AppButton @click="isCreateModalOpen = true">Create Ticket</AppButton>
    </template>

    <TicketFilters
      :filters="filterDefinitions"
      @change="handleFilterChange"
      @clear="handleClear"
    />

    <div v-if="sortDefinition" class="sort-row">
      <AppFormSelect
        :model-value="sortDefinition.value"
        :options="sortDefinition.options"
        :default-value="sortDefinition.defaultValue"
        @update:model-value="handleSortChange"
      />
    </div>

    <TicketTable
      :tickets="tickets"
      :columns="ticketsViewMeta?.columns ?? []"
      @action="handleAction"
    />
  </AppSectionPanel>
</template>

<style scoped>
.sort-row {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-3);
}
</style>
