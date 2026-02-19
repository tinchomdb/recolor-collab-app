<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { getMetaOptions } from "../utils/api/tickets.api";
import AppButton from "../components/AppButton.vue";
import AppFormSelect from "../components/AppFormSelect.vue";
import AppSectionPanel from "../components/AppSectionPanel.vue";

const router = useRouter();
const { loginAsManager, loginAsOperator, loginAsPartner } = useAuth();

const partners = ref<string[]>([]);
const selectedPartner = ref("");
const loadingPartners = ref(false);

onMounted(async () => {
  loadingPartners.value = true;
  try {
    const meta = await getMetaOptions();
    partners.value = meta.partners;
    if (meta.partners.length > 0) {
      selectedPartner.value = meta.partners[0] ?? "";
    }
  } finally {
    loadingPartners.value = false;
  }
});

function handleLoginAsManager() {
  loginAsManager();
  router.push("/dashboard");
}

function handleLoginAsOperator() {
  loginAsOperator();
  router.push("/queue");
}

function handleLoginAsPartner() {
  if (!selectedPartner.value) return;
  loginAsPartner(selectedPartner.value);
  router.push("/my-tickets");
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">Recolour Desk</h1>
      <p class="login-subtitle">Select a role to continue</p>

      <AppSectionPanel title="Manager">
        <p class="role-description">
          Full access to the ticket queue, dashboard, approvals and partner
          overview.
        </p>
        <AppButton @click="handleLoginAsManager">Login as Manager</AppButton>
      </AppSectionPanel>

      <AppSectionPanel title="Operator">
        <p class="role-description">
          Access to the ticket queue, approved library and partner overview. Can
          create and send tickets but cannot approve or reject.
        </p>
        <AppButton @click="handleLoginAsOperator">Login as Operator</AppButton>
      </AppSectionPanel>

      <AppSectionPanel title="Partner">
        <p class="role-description">
          View and work on tickets assigned to your studio.
        </p>
        <div class="partner-form">
          <AppFormSelect
            v-model="selectedPartner"
            :options="partners"
            placeholder="Select partner…"
            :disabled="loadingPartners"
          />
          <AppButton
            :disabled="!selectedPartner || loadingPartners"
            @click="handleLoginAsPartner"
          >
            Login as Partner
          </AppButton>
        </div>
      </AppSectionPanel>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--space-4);
}

.login-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  max-width: 440px;
}

.login-title {
  text-align: center;
  margin: 0;
}

.login-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  margin: 0;
}

.role-description {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
  font: var(--font-body);
}

.partner-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
