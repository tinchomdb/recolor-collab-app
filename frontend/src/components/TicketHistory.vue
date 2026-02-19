<script setup lang="ts">
import { ref, computed } from "vue";
import type { HistoryEvent } from "@shared/types";
import { HistoryEventType } from "@shared/constants";

interface Props {
  history: HistoryEvent[];
  /** How many items to show before "Show more" */
  previewCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  previewCount: 5,
});

const isExpanded = ref(false);
const showAll = ref(false);

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
  if (!isExpanded.value) showAll.value = false;
}

const sorted = computed(() =>
  [...props.history].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  ),
);

const visibleItems = computed(() =>
  showAll.value ? sorted.value : sorted.value.slice(0, props.previewCount),
);

const hasMore = computed(() => sorted.value.length > props.previewCount);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function eventLabel(event: HistoryEvent): string {
  if (event.type === HistoryEventType.Created) {
    return "Ticket created";
  }
  if (event.type === HistoryEventType.Edited) {
    return event.field ? `${event.field} changed` : "Ticket updated";
  }
  if (
    event.type === HistoryEventType.StatusChanged &&
    event.fromStatus &&
    event.toStatus
  ) {
    return `${event.fromStatus} → ${event.toStatus}`;
  }
  return event.type;
}

function changeDetail(event: HistoryEvent): string | null {
  if (
    event.field &&
    event.oldValue !== undefined &&
    event.newValue !== undefined
  ) {
    return `${event.oldValue} → ${event.newValue}`;
  }
  return null;
}
</script>

<template>
  <div class="history-panel">
    <button
      class="history-toggle"
      :aria-expanded="isExpanded"
      @click="toggleExpanded"
    >
      <svg
        class="chevron"
        :class="{ 'chevron--open': isExpanded }"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="history-toggle-label">
        History
        <span class="history-count">({{ history.length }})</span>
      </span>
    </button>

    <Transition name="collapse">
      <ol v-if="isExpanded" class="history-list" aria-label="Ticket history">
        <li
          v-for="(event, idx) in visibleItems"
          :key="idx"
          class="history-item"
        >
          <span class="history-dot" aria-hidden="true" />
          <div class="history-content">
            <span class="history-event-label">{{ eventLabel(event) }}</span>
            <span v-if="changeDetail(event)" class="history-reason">
              {{ changeDetail(event) }}
            </span>
            <span v-if="event.reason" class="history-reason">
              — {{ event.reason }}
            </span>
            <div class="history-meta">
              <span class="history-actor">{{ event.actor }}</span>
              <span class="history-separator">·</span>
              <time :datetime="event.at" class="history-date">
                {{ formatDate(event.at) }}
              </time>
            </div>
          </div>
        </li>
      </ol>
    </Transition>

    <button
      v-if="isExpanded && hasMore"
      class="show-more-btn"
      @click="showAll = !showAll"
    >
      {{ showAll ? "Show less" : `Show all ${sorted.length} events` }}
    </button>
  </div>
</template>

<style scoped>
.history-panel {
  margin-top: var(--space-3);
}

.history-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: var(--border-none);
  cursor: pointer;
  padding: var(--space-2) 0;
  color: var(--color-text-primary);
  font: var(--font-label);
  width: 100%;
  text-align: left;
}

.history-toggle:hover {
  color: var(--color-accent);
}

.history-toggle:focus-visible {
  outline: var(--outline-focus);
  outline-offset: var(--outline-focus-offset);
  border-radius: var(--radius-sm);
}

.history-toggle-label {
  user-select: none;
}

.history-count {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-normal);
}

/* Chevron */
.chevron {
  flex-shrink: 0;
  transition: transform var(--transition-duration-fast) ease;
}

.chevron--open {
  transform: rotate(90deg);
}

/* Timeline list */
.history-list {
  list-style: none;
  margin: 0;
  padding: 0 0 0 var(--space-2);
  border-left: var(--timeline-border-width) solid var(--color-border-default);
  margin-left: var(--timeline-rail-offset);
}

.history-item {
  position: relative;
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) 0 var(--space-2) var(--space-3);
}

.history-dot {
  position: absolute;
  left: calc(
    -1 * var(--space-2) -
      calc(var(--timeline-dot-size) / 2 - var(--timeline-border-width) / 2)
  );
  top: calc(var(--space-2) + var(--timeline-dot-top-nudge));
  width: var(--timeline-dot-size);
  height: var(--timeline-dot-size);
  border-radius: 50%;
  background: var(--color-accent);
  border: var(--timeline-dot-border-width) solid var(--color-bg-surface);
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.history-event-label {
  font: var(--font-body-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.history-reason {
  font: var(--font-body-sm);
  color: var(--color-text-secondary);
}

.history-meta {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font: var(--font-body-sm);
  color: var(--color-text-secondary);
}

.history-actor {
  text-transform: capitalize;
}

.history-separator {
  opacity: var(--opacity-muted);
}

.history-date {
  white-space: nowrap;
}

/* Show more */
.show-more-btn {
  background: none;
  border: var(--border-none);
  cursor: pointer;
  color: var(--color-accent);
  font: var(--font-body-sm);
  padding: var(--space-1) 0 var(--space-1)
    calc(var(--timeline-rail-offset) + var(--space-2) + var(--space-3));
  margin-top: 0;
}

.show-more-btn:hover {
  text-decoration: underline;
}

.show-more-btn:focus-visible {
  outline: var(--outline-focus);
  outline-offset: var(--outline-focus-offset);
  border-radius: var(--radius-sm);
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    opacity var(--transition-duration-fast) ease,
    max-height var(--transition-duration-normal) ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
}
</style>
