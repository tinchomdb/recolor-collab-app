<script setup lang="ts">
import AppSectionPanel from "../components/AppSectionPanel.vue";
import AppDataTable from "../components/AppDataTable.vue";
import { useTicketsStore } from "../stores/useTicketsStore";

const { dashboardStats: stats } = useTicketsStore();
</script>

<template>
  <template v-if="stats">
    <AppSectionPanel title="Dashboard">
      <div class="kpi-grid">
        <div
          v-for="card in stats.kpiCards"
          :key="card.label"
          class="kpi-card"
          :class="card.tone ? `kpi-card--${card.tone}` : ''"
        >
          <span class="kpi-value">{{ card.value }}</span>
          <span class="kpi-label">{{ card.label }}</span>
        </div>
      </div>
    </AppSectionPanel>

    <div class="dashboard-grid">
      <AppSectionPanel title="Status Breakdown">
        <div v-if="stats.statusBreakdown.length === 0" class="empty-message">
          No tickets yet.
        </div>
        <div
          v-for="row in stats.statusBreakdown"
          :key="row.label"
          class="breakdown-row"
        >
          <span class="breakdown-label">{{ row.label }}</span>
          <div class="breakdown-bar-track">
            <div class="breakdown-bar-fill" :style="{ width: `${row.pct}%` }" />
          </div>
          <span class="breakdown-count">{{ row.count }}</span>
        </div>
      </AppSectionPanel>

      <AppSectionPanel title="Priority Breakdown">
        <div v-if="stats.priorityBreakdown.length === 0" class="empty-message">
          No tickets yet.
        </div>
        <div
          v-for="row in stats.priorityBreakdown"
          :key="row.label"
          class="breakdown-row"
        >
          <span class="breakdown-label">{{ row.label }}</span>
          <div class="breakdown-bar-track">
            <div
              class="breakdown-bar-fill"
              :class="`breakdown-bar-fill--${row.label.toLowerCase()}`"
              :style="{ width: `${row.pct}%` }"
            />
          </div>
          <span class="breakdown-count">{{ row.count }}</span>
        </div>
      </AppSectionPanel>
    </div>

    <AppSectionPanel title="Partner Activity">
      <div v-if="stats.partnerOverview.length === 0" class="empty-message">
        No partner data.
      </div>
      <AppDataTable
        v-else
        :columns="stats.partnerOverviewColumns"
        :rows="stats.partnerOverview"
        row-key="partner"
      />
    </AppSectionPanel>
  </template>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-3);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-3);
  border: var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--color-bg-muted);
}

.kpi-value {
  font: var(--font-heading-1);
}

.kpi-label {
  font: var(--font-body-sm);
  color: var(--color-text-secondary);
  text-align: center;
}

.kpi-card--accent .kpi-value {
  color: var(--color-accent);
}

.kpi-card--success .kpi-value {
  color: var(--color-success);
}

.kpi-card--warning .kpi-value {
  color: var(--color-warning);
}

.kpi-card--error .kpi-value {
  color: var(--color-error);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4);
}

.breakdown-row {
  display: grid;
  grid-template-columns: 7rem 1fr 2.5rem;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
}

.breakdown-label {
  font: var(--font-body-sm);
  color: var(--color-text-secondary);
}

.breakdown-bar-track {
  height: 8px;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.breakdown-bar-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: var(--radius-sm);
  transition: width 300ms ease;
}

.breakdown-bar-fill--urgent {
  background: var(--color-error);
}

.breakdown-bar-fill--high {
  background: var(--color-warning);
}

.breakdown-bar-fill--medium {
  background: var(--color-accent);
}

.breakdown-bar-fill--low {
  background: var(--color-success);
}

.breakdown-count {
  text-align: right;
  font: var(--font-label);
}

.empty-message {
  color: var(--color-text-secondary);
}

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
