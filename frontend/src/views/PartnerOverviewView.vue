<script setup lang="ts">
import AppSectionPanel from "../components/AppSectionPanel.vue";
import AppDataTable from "../components/AppDataTable.vue";
import { useTicketsStore } from "../stores/useTicketsStore";

const { partnerOverview, partnerOverviewViewMeta } = useTicketsStore();
</script>

<template>
  <AppSectionPanel title="Partner Overview">
    <AppDataTable
      :columns="partnerOverviewViewMeta?.columns ?? []"
      :rows="partnerOverview"
      row-key="partner"
    />
  </AppSectionPanel>
</template>
