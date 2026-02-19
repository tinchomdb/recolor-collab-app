<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { useTheme } from "../composables/useTheme";
import { Role } from "@shared/constants";
import AppButton from "./AppButton.vue";
import IconMenu from "./icons/IconMenu.vue";
import IconSun from "./icons/IconSun.vue";
import IconMoon from "./icons/IconMoon.vue";

const route = useRoute();
const router = useRouter();
const { role, partnerName, isLoggedIn, logout } = useAuth();
const { theme, toggleTheme } = useTheme();

const isMenuOpen = ref(false);

interface NavItem {
  path: string;
  label: string;
  testId: string;
  roles: Role[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    testId: "menu-dashboard",
    roles: [Role.Manager],
  },
  {
    path: "/queue",
    label: "Queue",
    testId: "menu-queue",
    roles: [Role.Manager, Role.Operator],
  },
  {
    path: "/approved",
    label: "Approved Library",
    testId: "menu-approved",
    roles: [Role.Manager, Role.Operator],
  },
  {
    path: "/partners",
    label: "Partner Overview",
    testId: "menu-partners",
    roles: [Role.Manager, Role.Operator],
  },
  {
    path: "/my-tickets",
    label: "My Tickets",
    testId: "menu-my-tickets",
    roles: [Role.Partner],
  },
  {
    path: "/my-approved",
    label: "Approved Tickets",
    testId: "menu-my-approved",
    roles: [Role.Partner],
  },
];

const visibleNavItems = computed(() => {
  if (!role.value) return [];
  return ALL_NAV_ITEMS.filter((item) => item.roles.includes(role.value!));
});

const identityLabel = computed(() => {
  if (role.value === Role.Manager) return "Manager";
  if (role.value === Role.Operator) return "Operator";
  if (role.value === Role.Partner && partnerName.value)
    return partnerName.value;
  return "";
});

function navigate(path: string) {
  router.push(path);
  if (typeof window !== "undefined" && window.innerWidth <= 900) {
    isMenuOpen.value = false;
  }
}

function handleLogout() {
  logout();
  router.push("/login");
}
</script>

<template>
  <aside
    v-if="isLoggedIn"
    class="sidebar"
    :class="{ 'sidebar--mobile-open': isMenuOpen }"
  >
    <div class="sidebar-header">
      <div>
        <h2>Recolour Desk</h2>
        <span v-if="identityLabel" class="identity-label">{{
          identityLabel
        }}</span>
      </div>
      <AppButton
        variant="ghost"
        class="sidebar-toggle"
        aria-label="Toggle menu"
        @click="isMenuOpen = !isMenuOpen"
      >
        <IconMenu />
      </AppButton>
    </div>

    <nav class="sidebar-nav">
      <AppButton
        v-for="item in visibleNavItems"
        :key="item.path"
        :variant="route.path === item.path ? 'primary' : 'ghost'"
        align="start"
        class="sidebar-nav-button"
        :data-testid="item.testId"
        @click="navigate(item.path)"
      >
        {{ item.label }}
      </AppButton>

      <div class="sidebar-footer">
        <AppButton
          variant="ghost"
          align="start"
          class="sidebar-nav-button"
          :aria-label="
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          "
          @click="toggleTheme"
        >
          <template v-if="theme === 'dark'"> <IconSun /> Light Mode </template>
          <template v-else> <IconMoon /> Dark Mode </template>
        </AppButton>
        <AppButton
          variant="ghost"
          align="start"
          class="sidebar-nav-button"
          @click="handleLogout"
        >
          Logout
        </AppButton>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: var(--sidebar-width);
  border-right: var(--border-default);
  background: var(--color-bg-surface);
  padding: var(--space-4);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.sidebar-nav-button {
  width: 100%;
}

.sidebar-footer {
  margin-top: auto;
  border-top: var(--border-default);
  padding-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.identity-label {
  font: var(--font-label);
  color: var(--color-text-secondary);
}

.sidebar-toggle {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    min-width: 100%;
  }

  .sidebar-toggle {
    display: inline-flex;
  }

  .sidebar-nav {
    display: none;
  }

  .sidebar--mobile-open .sidebar-nav {
    display: flex;
  }

  .sidebar-footer {
    margin-top: var(--space-2);
  }
}
</style>
