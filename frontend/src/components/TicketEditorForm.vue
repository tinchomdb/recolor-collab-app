<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { CreateTicketInput, PhotoOption, Priority } from "@shared/types";
import { DEFAULT_PRIORITY } from "@shared/constants";
import AppButton from "./AppButton.vue";
import AppFormSelect from "./AppFormSelect.vue";
import AppFormField from "./AppFormField.vue";
import ImageGallery from "./ImageGallery.vue";
import type { GalleryImage } from "../types/components";
import PhotoOptionSelect from "./PhotoOptionSelect.vue";
import AppSectionPanel from "./AppSectionPanel.vue";

interface TicketEditorInitial {
  style: string;
  priority: Priority;
  partner: string;
  instructions: string[];
  referencePhotos: PhotoOption[];
}

interface Props {
  partners: string[];
  priorities: Priority[];
  styleOptions: string[];
  photoOptions: PhotoOption[];
  initial?: TicketEditorInitial;
  submitLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initial: undefined,
  submitLabel: "Save",
});

const emit = defineEmits<{
  submit: [payload: CreateTicketInput];
  validationError: [message: string];
}>();

const state = reactive({
  selectedPhotoIds: [] as string[],
  style: "",
  priority: DEFAULT_PRIORITY,
  partner: "",
  instructionsRaw: "",
});

const isAddingPhoto = ref(false);
const pendingPhotoId = ref("");

function resolvePhotoIds(photos: PhotoOption[]) {
  return photos.map((photo) => photo.id);
}

function applyInitial(initial?: TicketEditorInitial) {
  if (!initial) {
    state.selectedPhotoIds = [];
    state.style = props.styleOptions[0] ?? "";
    state.priority = DEFAULT_PRIORITY;
    state.partner = props.partners[0] ?? "";
    state.instructionsRaw = "";
    return;
  }

  state.selectedPhotoIds = resolvePhotoIds(initial.referencePhotos);
  state.style = initial.style;
  state.priority = initial.priority;
  state.partner = initial.partner;
  state.instructionsRaw = initial.instructions.join("\n");
}

watch(
  () => [props.initial, props.partners, props.styleOptions] as const,
  () => {
    applyInitial(props.initial);
  },
  { immediate: true, deep: true },
);

const selectedPhotoOptions = computed<GalleryImage[]>(() => {
  return state.selectedPhotoIds
    .map((id) => props.photoOptions.find((option) => option.id === id))
    .filter((option): option is PhotoOption => Boolean(option))
    .map((option) => ({
      id: option.id,
      thumbnailUrl: option.thumbnailUrl,
      imageUrl: option.imageUrl,
      label: option.id,
    }));
});

function showAddPhoto() {
  pendingPhotoId.value = "";
  isAddingPhoto.value = true;
}

function handlePhotoSelected(id: string) {
  if (id && !state.selectedPhotoIds.includes(id)) {
    state.selectedPhotoIds.push(id);
  }
  pendingPhotoId.value = "";
  isAddingPhoto.value = false;
}

function cancelAddPhoto() {
  pendingPhotoId.value = "";
  isAddingPhoto.value = false;
}

const isFormValid = computed(() => {
  const hasInstructions = state.instructionsRaw
    .split("\n")
    .some((line) => line.trim().length > 0);
  return Boolean(state.style && state.partner && hasInstructions);
});

function removePhotoById(id: string) {
  const index = state.selectedPhotoIds.indexOf(id);
  if (index !== -1) {
    state.selectedPhotoIds.splice(index, 1);
  }
}

function submit() {
  const selectedIds = state.selectedPhotoIds.filter(Boolean);
  const instructions = state.instructionsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!state.style || !state.partner || instructions.length === 0) {
    emit("validationError", "Please complete all required fields.");
    return;
  }

  const referencePhotos = selectedIds
    .map((id) => props.photoOptions.find((option) => option.id === id))
    .filter((option): option is PhotoOption => Boolean(option));

  emit("submit", {
    style: state.style,
    priority: state.priority,
    partner: state.partner,
    instructions,
    ...(referencePhotos.length > 0 ? { referencePhotos } : {}),
  });
}
</script>

<template>
  <AppSectionPanel>
    <div class="field-columns">
      <AppFormField label="Desired Color / Pattern" required>
        <AppFormSelect v-model="state.style" :options="styleOptions" />
      </AppFormField>

      <AppFormField label="Priority">
        <AppFormSelect v-model="state.priority" :options="priorities" />
      </AppFormField>

      <AppFormField label="Partner" required>
        <AppFormSelect v-model="state.partner" :options="partners" />
      </AppFormField>
    </div>

    <div class="photo-section">
      <ImageGallery
        v-if="selectedPhotoOptions.length > 0"
        :images="selectedPhotoOptions"
        :can-edit="true"
        @remove="removePhotoById"
      />
      <p v-else class="empty-text">No reference photos selected.</p>

      <div v-if="isAddingPhoto" class="photo-add-row">
        <PhotoOptionSelect
          v-model="pendingPhotoId"
          :options="photoOptions"
          placeholder="Select photo"
          @update:model-value="handlePhotoSelected"
        />
        <AppButton variant="ghost" @click="cancelAddPhoto">Cancel</AppButton>
      </div>

      <AppButton v-if="!isAddingPhoto" variant="secondary" @click="showAddPhoto"
        >Add Photo</AppButton
      >
    </div>

    <AppFormField label="Instructions" required>
      <textarea
        v-model="state.instructionsRaw"
        rows="5"
        placeholder="Instruction lines (one per line)"
      />
    </AppFormField>

    <div class="form-actions">
      <AppButton :disabled="!isFormValid" @click="submit">{{
        submitLabel
      }}</AppButton>
    </div>
  </AppSectionPanel>
</template>

<style scoped>
.field-columns {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.photo-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-3) 0;
}

.photo-add-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}

.photo-add-row :deep(.photo-select-dropdown) {
  flex: 1;
  min-width: 0;
}

.empty-text {
  margin: 0;
  color: var(--color-text-secondary);
  font: var(--font-body-sm);
}

.form-actions {
  margin-top: var(--space-4);
}

@media (max-width: 900px) {
  .field-columns {
    gap: var(--space-2);
  }
}
</style>
