<script setup lang="ts">
import { ref } from "vue";
import AppButton from "./AppButton.vue";
import AppModal from "./AppModal.vue";
import IconTrash from "./icons/IconTrash.vue";
import type { GalleryImage } from "../types/components";

interface Props {
  images: GalleryImage[];
  canEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
});

const emit = defineEmits<{
  remove: [id: string];
}>();

const selectedImage = ref<GalleryImage | null>(null);

function openPreview(image: GalleryImage) {
  selectedImage.value = image;
}

function closePreview() {
  selectedImage.value = null;
}

function handleRemove(image: GalleryImage) {
  if (image.id) {
    emit("remove", image.id);
  }
}
</script>

<template>
  <div v-if="images.length > 0" class="gallery">
    <figure
      v-for="(image, index) in images"
      :key="image.id ?? index"
      class="gallery-card"
    >
      <button
        v-if="canEdit && image.id"
        type="button"
        class="gallery-remove-btn"
        aria-label="Remove photo"
        @click.stop="handleRemove(image)"
      >
        <IconTrash />
      </button>
      <AppButton
        variant="link"
        class="gallery-image-button"
        @click="openPreview(image)"
      >
        <img
          :src="image.thumbnailUrl"
          :alt="image.label"
          class="gallery-thumb"
        />
      </AppButton>
      <figcaption>{{ image.label }}</figcaption>
    </figure>

    <AppModal
      :open="Boolean(selectedImage)"
      :title="selectedImage?.label || 'Image Preview'"
      @close="closePreview"
    >
      <img
        v-if="selectedImage?.imageUrl"
        :src="selectedImage.imageUrl"
        :alt="selectedImage.label"
        class="gallery-full-image"
      />
    </AppModal>
  </div>
</template>

<style scoped>
.gallery {
  display: flex;
  overflow-x: auto;
  gap: var(--space-2);
}

.gallery-card {
  position: relative;
  flex: 0 0 auto;
  width: 128px;
  margin: 0;
  border: var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--color-bg-surface);
  padding: var(--space-2);
  overflow: hidden;
}

.gallery-remove-btn {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-error);
  color: var(--color-text-inverse);
  cursor: pointer;
  z-index: 1;
  transition: opacity 120ms ease;
  opacity: 0.85;
}

.gallery-remove-btn:hover {
  opacity: 1;
}

.gallery-remove-btn:focus-visible {
  outline: var(--outline-focus);
  outline-offset: var(--outline-focus-offset);
}

.gallery-thumb {
  width: 100%;
  height: 88px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: var(--border-default);
}

.gallery-image-button {
  display: block;
  width: 100%;
  border: var(--border-none);
  background: transparent;
  padding: 0;
}

.gallery-image-button:focus-visible {
  outline: var(--outline-focus);
  outline-offset: var(--outline-focus-offset);
}

figcaption {
  margin-top: var(--space-1);
  font: var(--font-body-sm);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-full-image {
  display: block;
  width: 100%;
  max-height: 72vh;
  object-fit: contain;
  border-radius: var(--radius-sm);
  border: var(--border-default);
}
</style>
