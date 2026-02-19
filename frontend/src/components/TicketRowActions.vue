<script setup lang="ts">
import { computed, ref } from "vue";
import type { Ticket } from "@shared/types";
import { WorkflowAction } from "@shared/constants";
import AppButton from "./AppButton.vue";
import AppModal from "./AppModal.vue";

/** Labels for each workflow action key. */
const ACTION_LABELS: Record<string, string> = {
  [WorkflowAction.Send]: "Send",
  [WorkflowAction.Receive]: "Receive",
  [WorkflowAction.Start]: "Start",
  [WorkflowAction.Complete]: "Complete",
  [WorkflowAction.Approve]: "Approve",
  [WorkflowAction.Reject]: "Reject",
};

interface Props {
  ticket: Ticket;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  action: [key: string, ticketId: string, reason?: string];
}>();

const rejectReason = ref("");
const isRejectModalOpen = ref(false);

const visibleActions = computed(() =>
  (props.ticket.availableActions ?? []).map((key) => ({
    key,
    label: ACTION_LABELS[key] ?? key,
    disabled:
      key === WorkflowAction.Complete &&
      props.ticket.partnerPhotos.length === 0,
  })),
);

function handleAction(key: string, ticketId: string) {
  if (key === WorkflowAction.Reject) {
    isRejectModalOpen.value = true;
  } else {
    emit("action", key, ticketId);
  }
}

function confirmReject() {
  if (!rejectReason.value.trim()) return;
  emit("action", WorkflowAction.Reject, props.ticket.id, rejectReason.value);
  rejectReason.value = "";
  isRejectModalOpen.value = false;
}

function closeRejectModal() {
  rejectReason.value = "";
  isRejectModalOpen.value = false;
}
</script>

<template>
  <div class="actions-row">
    <AppButton
      v-for="action in visibleActions"
      :key="action.key"
      :disabled="action.disabled"
      :title="
        action.disabled
          ? 'Upload at least one photo before completing'
          : undefined
      "
      @click="handleAction(action.key, ticket.id)"
    >
      {{ action.label }}
    </AppButton>
  </div>

  <AppModal
    :open="isRejectModalOpen"
    title="Reject Ticket"
    @close="closeRejectModal"
  >
    <div class="reject-modal-body">
      <input
        v-model="rejectReason"
        class="reject-input"
        placeholder="Reject reason"
      />
      <AppButton @click="confirmReject">Confirm Reject</AppButton>
    </div>
  </AppModal>
</template>

<style scoped>
.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.reject-modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.reject-input {
  min-width: var(--input-min-width);
}
</style>
