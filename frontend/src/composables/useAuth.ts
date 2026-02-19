import { computed, ref } from "vue";
import {
  AUTH_PARTNER_PREFIX,
  AUTH_ROLE_MANAGER,
  AUTH_ROLE_OPERATOR,
  Role,
} from "@shared/constants";

const role = ref<Role | null>(null);
const partnerName = ref<string | null>(null);

export function getAuthToken(): string | null {
  if (role.value === Role.Manager) return AUTH_ROLE_MANAGER;
  if (role.value === Role.Operator) return AUTH_ROLE_OPERATOR;
  if (role.value === Role.Partner && partnerName.value)
    return `${AUTH_PARTNER_PREFIX}${partnerName.value}`;
  return null;
}

export function useAuth() {
  const isLoggedIn = computed(() => role.value !== null);

  const isManager = computed(() => role.value === Role.Manager);

  function loginAsManager() {
    role.value = Role.Manager;
    partnerName.value = null;
  }

  function loginAsOperator() {
    role.value = Role.Operator;
    partnerName.value = null;
  }

  function loginAsPartner(name: string) {
    role.value = Role.Partner;
    partnerName.value = name;
  }

  function logout() {
    role.value = null;
    partnerName.value = null;
  }

  return {
    role,
    partnerName,
    isLoggedIn,
    isManager,
    loginAsManager,
    loginAsOperator,
    loginAsPartner,
    logout,
  };
}
