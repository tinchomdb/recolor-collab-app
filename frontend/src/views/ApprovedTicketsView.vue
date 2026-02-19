<script setup lang="ts">
import { computed } from "vue";
import AppSectionPanel from "../components/AppSectionPanel.vue";
import TicketTable from "../components/TicketTable.vue";
import { useAuth } from "../composables/useAuth";
import { useTicketsStore } from "../stores/useTicketsStore";

interface Props {
  title?: string;
  usePartnerTitle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  usePartnerTitle: false,
});

const { partnerName } = useAuth();
const { approvedTickets, approvedViewMeta } = useTicketsStore();

const resolvedTitle = computed(() =>
  props.usePartnerTitle
    ? `Completed — ${partnerName.value}`
    : (props.title ?? ""),
);
</script>

<template>
  <AppSectionPanel :title="resolvedTitle">
    <TicketTable
      :tickets="approvedTickets"
      :columns="approvedViewMeta?.columns ?? []"
    />
  </AppSectionPanel>
</template>
