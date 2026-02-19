<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { CreateTicketInput } from "@shared/types";
import { TicketStatus, Role } from "@shared/constants";
import { useAuth } from "../composables/useAuth";
import { useTicketsStore } from "../stores/useTicketsStore";
import AppButton from "../components/AppButton.vue";
import ImageGallery from "../components/ImageGallery.vue";
import PartnerPhotoUpload from "../components/PartnerPhotoUpload.vue";
import AppSectionPanel from "../components/AppSectionPanel.vue";
import TicketEditorForm from "../components/TicketEditorForm.vue";
import TicketHistory from "../components/TicketHistory.vue";

const route = useRoute();
const router = useRouter();
const { isManager, role } = useAuth();

const isPartner = computed(() => role.value === Role.Partner);

const {
  tickets,
  approvedTickets,
  metadata,
  setError,
  update,
  uploadPhoto,
  removePhoto,
} = useTicketsStore();

const isEditing = ref(false);

const ticketId = computed(() => route.params.id as string);

const ticket = computed(() => {
  return [...tickets.value, ...approvedTickets.value].find(
    (t) => t.id === ticketId.value,
  );
});

const canUploadPhotos = computed(() => {
  if (!isPartner.value || !ticket.value) return false;
  return ticket.value.status === TicketStatus.InProgress;
});

const showPartnerPhotosUpload = computed(() => {
  if (!isPartner.value || !ticket.value) return false;
  const status = ticket.value.status;
  return (
    status === TicketStatus.Sent ||
    status === TicketStatus.Received ||
    status === TicketStatus.InProgress
  );
});

function goBack() {
  router.back();
}

async function handleSave(data: CreateTicketInput) {
  if (!ticketId.value) return;
  await update(ticketId.value, data);
  isEditing.value = false;
}

async function handlePhotoUpload(file: File) {
  if (!ticketId.value) return;
  await uploadPhoto(ticketId.value, file);
}

async function handlePhotoRemove(photoId: string) {
  if (!ticketId.value) return;
  await removePhoto(ticketId.value, photoId);
}
</script>

<template>
  <AppSectionPanel title="Ticket Details">
    <template #header-actions>
      <div class="header-actions">
        <AppButton
          v-if="isManager && ticket && !isEditing"
          variant="secondary"
          @click="isEditing = true"
        >
          Edit
        </AppButton>
        <AppButton
          v-if="isEditing"
          variant="secondary"
          @click="isEditing = false"
        >
          Cancel Edit
        </AppButton>
        <AppButton variant="secondary" @click="goBack">Back</AppButton>
      </div>
    </template>

    <template v-if="ticket && metadata">
      <dl class="details-meta">
        <div class="details-meta-row">
          <dt>Ticket ID</dt>
          <dd>{{ ticket.id }}</dd>
        </div>
        <div class="details-meta-row">
          <dt>Status</dt>
          <dd>{{ ticket.status }}</dd>
        </div>
      </dl>

      <template v-if="!isEditing">
        <h3 class="section-heading">Main Details</h3>
        <dl class="details-meta">
          <div class="details-meta-row">
            <dt>Style</dt>
            <dd>{{ ticket.style }}</dd>
          </div>
          <div class="details-meta-row">
            <dt>Priority</dt>
            <dd>{{ ticket.priority }}</dd>
          </div>
          <div class="details-meta-row">
            <dt>Partner</dt>
            <dd>{{ ticket.partner }}</dd>
          </div>
          <div class="details-meta-row">
            <dt>Instructions</dt>
            <dd>
              <ul v-if="ticket.instructions.length" class="instructions-list">
                <li
                  v-for="(instruction, idx) in ticket.instructions"
                  :key="idx"
                >
                  {{ instruction }}
                </li>
              </ul>
              <span v-else class="text-secondary">None</span>
            </dd>
          </div>
          <div class="details-meta-row">
            <dt>Reference Assets</dt>
            <dd>
              <ImageGallery
                v-if="ticket.referencePhotos.length > 0"
                :images="ticket.referencePhotos"
              />
              <span v-else class="text-secondary">None</span>
            </dd>
          </div>
          <div class="details-meta-row">
            <dt>Created</dt>
            <dd>{{ new Date(ticket.createdAt).toLocaleString() }}</dd>
          </div>
          <div class="details-meta-row">
            <dt>Updated</dt>
            <dd>{{ new Date(ticket.updatedAt).toLocaleString() }}</dd>
          </div>
        </dl>

        <h3 class="section-heading">Partner Photos</h3>
        <div class="section-content">
          <PartnerPhotoUpload
            v-if="showPartnerPhotosUpload"
            :photos="ticket.partnerPhotos"
            :disabled="!canUploadPhotos"
            disabled-reason="Ticket must be In Progress to upload photos"
            @upload="handlePhotoUpload"
            @remove="handlePhotoRemove"
          />
          <template v-else>
            <ImageGallery
              v-if="ticket.partnerPhotos.length > 0"
              :images="ticket.partnerPhotos"
            />
            <span v-else class="text-secondary">None</span>
          </template>
        </div>

        <h3 class="section-heading">History</h3>
        <TicketHistory v-if="ticket.history.length" :history="ticket.history" />
        <span v-else class="text-secondary">No history yet.</span>
      </template>

      <template v-else>
        <TicketEditorForm
          :partners="metadata.partners"
          :priorities="metadata.priorities"
          :style-options="metadata.styleOptions"
          :photo-options="metadata.photoOptions"
          :initial="{
            style: ticket.style,
            priority: ticket.priority,
            partner: ticket.partner,
            instructions: ticket.instructions,
            referencePhotos: ticket.referencePhotos,
          }"
          submit-label="Save Changes"
          @submit="handleSave"
          @validation-error="(message) => setError(message)"
        />
      </template>
    </template>

    <p v-else class="empty-message">No ticket selected.</p>
  </AppSectionPanel>
</template>

<style scoped>
.header-actions {
  display: flex;
  gap: var(--space-2);
}

.details-meta {
  margin: 0 0 var(--space-3);
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.details-meta-row {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  min-width: 0;
}

.details-meta-row dt {
  color: var(--color-text-secondary);
  font: var(--font-label);
  min-width: 120px;
}

.details-meta-row dd {
  margin: 0;
  min-width: 0;
}

.instructions-list {
  margin: 0;
  padding-left: var(--space-3);
}

.text-secondary {
  color: var(--color-text-secondary);
}

.section-heading {
  margin: var(--space-4) 0 var(--space-2);
  padding-bottom: var(--space-1);
  border-bottom: var(--border-default);
  font: var(--font-heading-sm);
  color: var(--color-text-primary);
}

.section-heading:first-of-type {
  margin-top: var(--space-2);
}

.section-content {
  margin-bottom: var(--space-2);
}

.empty-message {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
