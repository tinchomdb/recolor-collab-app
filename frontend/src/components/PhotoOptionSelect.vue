<script setup lang="ts">
import { computed, ref } from "vue";
import type { PhotoOption } from "@shared/types";
import { useClickOutside } from "../composables/useClickOutside";
import AppButton from "./AppButton.vue";
import IconChevronDown from "./icons/IconChevronDown.vue";

interface Props {
  modelValue?: string;
  options: PhotoOption[];
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "Select photo",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

useClickOutside(containerRef, () => {
  isOpen.value = false;
});

const selectedOption = computed(() => {
  return props.options.find((option) => option.id === props.modelValue);
});

function toggle() {
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
}

function select(value: string) {
  emit("update:modelValue", value);
  closeMenu();
}
</script>

<template>
  <div ref="containerRef" class="photo-select-dropdown">
    <AppButton
      variant="ghost"
      class="photo-select-trigger"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <template v-if="selectedOption">
        <img
          :src="selectedOption.thumbnailUrl"
          :alt="selectedOption.label"
          class="photo-select-thumb"
        />
        <span>{{ selectedOption.label }} - {{ selectedOption.id }}</span>
      </template>
      <span v-else>{{ placeholder }}</span>
      <IconChevronDown class="photo-select-chevron" />
    </AppButton>

    <div v-if="isOpen" class="photo-select-menu" role="listbox">
      <AppButton
        variant="ghost"
        align="start"
        class="photo-select-item"
        @click="select('')"
      >
        <span>{{ placeholder }}</span>
      </AppButton>
      <AppButton
        v-for="option in options"
        :key="option.id"
        variant="ghost"
        align="start"
        class="photo-select-item"
        @click="select(option.id)"
      >
        <img
          :src="option.thumbnailUrl"
          :alt="option.label"
          class="photo-select-thumb"
        />
        <span>{{ option.label }} - {{ option.id }}</span>
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.photo-select-dropdown {
  position: relative;
}

.photo-select-trigger {
  width: 100%;
  border: var(--border-default);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  justify-content: space-between;
}

.photo-select-menu {
  position: absolute;
  z-index: 30;
  top: calc(100% + var(--space-1));
  left: 0;
  right: 0;
  max-height: 240px;
  overflow: auto;
  border: var(--border-default);
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
}

.photo-select-item {
  width: 100%;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border: var(--border-none);
  border-bottom: var(--border-default);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-align: left;
  padding: var(--space-2);
}

.photo-select-item:last-child {
  border-bottom: var(--border-none);
}

.photo-select-item:hover {
  background: var(--color-bg-muted);
}

.photo-select-trigger:focus-visible,
.photo-select-item:focus-visible {
  outline: var(--outline-focus);
  outline-offset: var(--outline-focus-offset);
}

.photo-select-thumb {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: var(--border-default);
  object-fit: cover;
  flex-shrink: 0;
}

.photo-select-chevron {
  color: var(--color-text-secondary);
  margin-left: auto;
}
</style>
