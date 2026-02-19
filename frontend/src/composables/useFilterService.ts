import { computed, reactive, type Ref } from "vue";
import type { TicketFilters, ViewMeta } from "@shared/types";
import type { DropdownInputDef } from "../types/components";

interface FilterState {
  values: Record<string, string>;
}

/**
 * Pure state manager for filter selections derived from backend-provided
 * `ViewMeta`. Async reload is the caller's responsibility. Sort state is
 * managed separately by `useSortService`.
 */
export function useFilterService(viewMeta: Ref<ViewMeta | null>) {
  const state = reactive<FilterState>({
    values: {},
  });

  /** Filter definitions enriched with the current active value. */
  const filterDefinitions = computed<DropdownInputDef[]>(() => {
    const meta = viewMeta.value;
    if (!meta) return [];

    return meta.filters.map((filter) => ({
      key: filter.key,
      options: filter.options,
      value: state.values[filter.key] ?? "",
      placeholder: filter.placeholder,
    }));
  });

  /** Parsed typed filters for use in API calls. */
  const currentFilters = computed<TicketFilters>(() => {
    const filters: TicketFilters = {};
    if (state.values.status)
      filters.status = state.values.status as TicketFilters["status"];
    if (state.values.priority)
      filters.priority = state.values.priority as TicketFilters["priority"];
    if (state.values.partner) filters.partner = state.values.partner;
    return filters;
  });

  /** Apply a single filter change (e.g. `{ status: "Pending" }`). */
  function applyFilter(update: Record<string, string>) {
    for (const [key, value] of Object.entries(update)) {
      state.values[key] = value;
    }
  }

  /** Reset all filter selections to empty. */
  function clearFilters() {
    for (const key of Object.keys(state.values)) {
      state.values[key] = "";
    }
  }

  return {
    filterDefinitions,
    currentFilters,
    applyFilter,
    clearFilters,
  };
}
