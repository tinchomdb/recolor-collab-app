import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { Role } from "@shared/constants";

import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import TicketQueueView from "../views/TicketQueueView.vue";
import ApprovedTicketsView from "../views/ApprovedTicketsView.vue";
import PartnerOverviewView from "../views/PartnerOverviewView.vue";
import TicketDetailsView from "../views/TicketDetailsView.vue";

declare module "vue-router" {
  interface RouteMeta {
    roles?: Role[];
    public?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { public: true },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardView,
      meta: { roles: [Role.Manager] },
    },
    {
      path: "/queue",
      name: "queue",
      component: TicketQueueView,
      props: { title: "Queue", canCreate: true },
      meta: { roles: [Role.Manager, Role.Operator] },
    },
    {
      path: "/approved",
      name: "approved",
      component: ApprovedTicketsView,
      props: { title: "Approved Library" },
      meta: { roles: [Role.Manager, Role.Operator] },
    },
    {
      path: "/partners",
      name: "partners",
      component: PartnerOverviewView,
      meta: { roles: [Role.Manager, Role.Operator] },
    },
    {
      path: "/tickets/:id",
      name: "ticketDetails",
      component: TicketDetailsView,
      meta: { roles: [Role.Manager, Role.Operator, Role.Partner] },
    },
    {
      path: "/my-tickets",
      name: "myTickets",
      component: TicketQueueView,
      meta: { roles: [Role.Partner] },
    },
    {
      path: "/my-approved",
      name: "myApproved",
      component: ApprovedTicketsView,
      props: { usePartnerTitle: true },
      meta: { roles: [Role.Partner] },
    },
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/login",
    },
  ],
});

const DEFAULT_ROUTES: Record<Role, string> = {
  [Role.Manager]: "/dashboard",
  [Role.Operator]: "/queue",
  [Role.Partner]: "/my-tickets",
};

router.beforeEach((to) => {
  const { role, isLoggedIn } = useAuth();

  if (to.meta.public) {
    if (isLoggedIn.value && role.value) {
      return DEFAULT_ROUTES[role.value];
    }
    return;
  }

  const allowedRoles = to.meta.roles;
  if (!allowedRoles) return;

  if (!isLoggedIn.value) {
    return "/login";
  }

  if (role.value && !allowedRoles.includes(role.value)) {
    return DEFAULT_ROUTES[role.value];
  }
});

export default router;
