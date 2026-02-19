<script setup lang="ts">
import { onMounted, watch } from "vue";
import NavigationShell from "./components/NavigationShell.vue";
import { useAuth } from "./composables/useAuth";
import { useTicketsStore } from "./stores/useTicketsStore";

import { useTheme } from "./composables/useTheme";

useTheme();

const { isLoggedIn } = useAuth();

const { loading, error, loadAll } = useTicketsStore();

watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) loadAll();
});

onMounted(() => {
  if (isLoggedIn.value) loadAll();
});
</script>

<template>
  <div class="layout">
    <NavigationShell />

    <main class="content">
      <header class="page-header">
        <h1>Recolour Ticket Workflow</h1>
        <p v-if="loading" class="status-message">Loading...</p>
        <p v-if="error" class="status-error">{{ error }}</p>
      </header>

      <router-view />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.content {
  flex: 1;
  min-width: 0;
  padding: var(--space-4);
}

.page-header {
  margin-bottom: var(--space-4);
}

.status-message {
  color: var(--color-text-secondary);
}

.status-error {
  color: var(--color-error);
}

@media (max-width: 900px) {
  .layout {
    flex-direction: column;
  }
}
</style>
