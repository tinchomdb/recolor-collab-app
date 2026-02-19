import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, beforeEach } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import NavigationShell from "./NavigationShell.vue";
import { useAuth } from "../composables/useAuth";

function createMockRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: "/dashboard", component: { template: "<div />" } },
      { path: "/queue", component: { template: "<div />" } },
      { path: "/approved", component: { template: "<div />" } },
      { path: "/partners", component: { template: "<div />" } },
      { path: "/my-tickets", component: { template: "<div />" } },
      { path: "/login", component: { template: "<div />" } },
    ],
  });
}

describe("NavigationShell", () => {
  beforeEach(() => {
    useAuth().logout();
  });

  it("shows manager menu entries when logged in as manager", async () => {
    useAuth().loginAsManager();
    const router = createMockRouter();
    await router.push("/queue");
    await router.isReady();

    const wrapper = mount(NavigationShell, {
      global: { plugins: [router] },
    });

    const text = wrapper.text();
    expect(text).toContain("Queue");
    expect(text).toContain("Approved Library");
    expect(text).toContain("Partner Overview");
    expect(text).not.toContain("My Tickets");
  });

  it("shows partner menu entries when logged in as partner", async () => {
    useAuth().loginAsPartner("Studio Alpha");
    const router = createMockRouter();
    await router.push("/my-tickets");
    await router.isReady();

    const wrapper = mount(NavigationShell, {
      global: { plugins: [router] },
    });

    const text = wrapper.text();
    expect(text).toContain("My Tickets");
    expect(text).toContain("Studio Alpha");
    expect(text).not.toContain("Queue");
  });

  it("navigates when clicking menu item", async () => {
    useAuth().loginAsManager();
    const router = createMockRouter();
    await router.push("/queue");
    await router.isReady();

    const wrapper = mount(NavigationShell, {
      global: { plugins: [router] },
    });

    await wrapper.get('[data-testid="menu-approved"]').trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/approved");
  });

  it("is hidden when not logged in", () => {
    const router = createMockRouter();

    const wrapper = mount(NavigationShell, {
      global: { plugins: [router] },
    });

    expect(wrapper.find("aside").exists()).toBe(false);
  });

  it("shows operator menu entries (no Dashboard)", async () => {
    useAuth().loginAsOperator();
    const router = createMockRouter();
    await router.push("/queue");
    await router.isReady();

    const wrapper = mount(NavigationShell, {
      global: { plugins: [router] },
    });

    const text = wrapper.text();
    expect(text).toContain("Queue");
    expect(text).toContain("Approved Library");
    expect(text).toContain("Partner Overview");
    expect(text).not.toContain("Dashboard");
    expect(text).not.toContain("My Tickets");
  });
});
