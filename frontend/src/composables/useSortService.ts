import { computed, reactive, type Ref } from "vue";
import type { TicketSort, ViewMeta } from "@shared/types";
import type { DropdownInputDef } from "../types/components";

interface SortState {
  value: string;
}

/**
 * Pure state manager for sort selection derived from backend-provided
 * `ViewMeta`. Async reload is the caller's responsibility.
 */
export function useSortService(viewMeta: Ref<ViewMeta | null>) {
  /** Default sort string from backend meta (e.g. "createdAt:desc"). */
  const defaultSort = computed(() => viewMeta.value?.defaultSort ?? "");

  const state = reactive<SortState>({
    value: "",
  });

  /** The active sort combo string, falling back to the meta default. */
  const sortValue = computed(() => state.value || defaultSort.value);

  /**
   * The sort input definition enriched with the current value, or `null`
   * when the backend provides no sort options.
   */
  const sortDefinition = computed<DropdownInputDef | null>(() => {
    const meta = viewMeta.value;
    if (!meta || meta.sortOptions.length === 0) return null;

    return {
      key: "sort",
      options: meta.sortOptions,
      value: sortValue.value,
      defaultValue: defaultSort.value,
    };
  });

  /** Parsed typed sort for use in API calls. */
  const currentSort = computed<TicketSort>(() => {
    const str = sortValue.value;
    if (!str) return {};
    const [sortBy, sortOrder] = str.split(":");
    return {
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    };
  });

  /** Apply a new sort combo string. */
  function applySort(value: string) {
    state.value = value;
  }

  return {
    sortDefinition,
    currentSort,
    applySort,
  };
}
