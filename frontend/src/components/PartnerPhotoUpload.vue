<script setup lang="ts">
import { ref } from "vue";
import type { PhotoOption } from "@shared/types";
import AppButton from "./AppButton.vue";
import ImageGallery from "./ImageGallery.vue";

interface Props {
  photos: PhotoOption[];
  disabled?: boolean;
  disabledReason?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  disabledReason: undefined,
});

const emit = defineEmits<{
  upload: [file: File];
  remove: [photoId: string];
}>();

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function openFilePicker() {
  fileInput.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploading.value = true;
  try {
    emit("upload", file);
  } finally {
    uploading.value = false;
    input.value = "";
  }
}
</script>

<template>
  <div class="partner-photo-upload">
    <div class="upload-actions">
      <input
        ref="fileInput"
        type="file"
        :accept="ACCEPTED_TYPES"
        class="file-input-hidden"
        @change="handleFileChange"
      />
      <AppButton
        variant="secondary"
        :disabled="disabled || uploading"
        @click="openFilePicker"
      >
        {{ uploading ? "Uploading…" : "Upload Photo" }}
      </AppButton>
      <span v-if="disabled && disabledReason" class="upload-hint">{{
        disabledReason
      }}</span>
    </div>

    <div v-if="photos.length > 0" class="photos-section">
      <ImageGallery
        :images="photos"
        :can-edit="!disabled"
        @remove="(id) => emit('remove', id)"
      />
    </div>

    <p v-else class="empty-text">No photos uploaded yet.</p>
  </div>
</template>

<style scoped>
.partner-photo-upload {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.upload-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.upload-hint {
  font: var(--font-body-sm);
  color: var(--color-text-secondary);
}

.file-input-hidden {
  display: none;
}

.photos-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.empty-text {
  margin: 0;
  color: var(--color-text-secondary);
  font: var(--font-body-sm);
}
</style>
