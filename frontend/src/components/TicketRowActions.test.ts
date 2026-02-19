import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { nextTick } from "vue";
import TicketRowActions from "./TicketRowActions.vue";
import type { Ticket } from "@shared/types";

const baseTicket: Ticket = {
  id: "t1",
  style: "Night Sky",
  priority: "High",
  partner: "Studio Alpha",
  instructions: ["Keep clipping path"],
  referencePhotos: [],
  partnerPhotos: [],
  status: "Pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
  availableActions: [],
};

function mountActions(ticket: Ticket) {
  return mount(TicketRowActions, {
    props: { ticket },
    global: { stubs: { Teleport: true } },
  });
}

describe("TicketRowActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("shows Send button when availableActions includes send", () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Pending",
      availableActions: ["send"],
    });

    expect(wrapper.text()).toContain("Send");
    expect(wrapper.text()).not.toContain("Approve");
    expect(wrapper.text()).not.toContain("Reject");

    wrapper.unmount();
  });

  it("calls send action when Send button is clicked", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Pending",
      availableActions: ["send"],
    });

    const sendButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Send");
    expect(sendButton).toBeTruthy();
    await sendButton!.trigger("click");

    expect(wrapper.emitted("action")?.[0]).toEqual(["send", "t1"]);

    wrapper.unmount();
  });

  it("shows Approve and Reject when availableActions includes both", () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Completed",
      availableActions: ["approve", "reject"],
    });

    expect(wrapper.text()).toContain("Approve");
    expect(wrapper.text()).toContain("Reject");

    wrapper.unmount();
  });

  it("opens reject modal and emits action with reason on confirm", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Completed",
      availableActions: ["approve", "reject"],
    });

    // Modal input should not be visible yet
    expect(wrapper.find(".reject-input").exists()).toBe(false);

    // Click Reject to open the modal
    const rejectButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Reject");
    await rejectButton!.trigger("click");
    await nextTick();

    // Modal is now open with the input
    const input = wrapper.find(".reject-input");
    expect(input.exists()).toBe(true);
    await input.setValue("Color is wrong");

    // Click confirm
    const confirmButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Confirm Reject");
    await confirmButton!.trigger("click");

    expect(wrapper.emitted("action")?.[0]).toEqual([
      "reject",
      "t1",
      "Color is wrong",
    ]);

    wrapper.unmount();
  });

  it("clears reject reason and closes modal after confirming", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Completed",
      availableActions: ["approve", "reject"],
    });

    const rejectButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Reject");
    await rejectButton!.trigger("click");
    await nextTick();

    const input = wrapper.find(".reject-input");
    await input.setValue("Bad quality");

    const confirmButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Confirm Reject");
    await confirmButton!.trigger("click");
    await nextTick();

    // Modal should be closed — input no longer in DOM
    expect(wrapper.find(".reject-input").exists()).toBe(false);

    wrapper.unmount();
  });

  it("shows no actions when availableActions is empty", () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Approved",
      availableActions: [],
    });

    expect(wrapper.text()).not.toContain("Approve");
    expect(wrapper.text()).not.toContain("Send");

    wrapper.unmount();
  });

  it("does not emit action when confirm is clicked with empty reason", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Completed",
      availableActions: ["approve", "reject"],
    });

    const rejectButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Reject");
    await rejectButton!.trigger("click");
    await nextTick();

    // Click confirm without entering a reason
    const confirmButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Confirm Reject");
    await confirmButton!.trigger("click");

    expect(wrapper.emitted("action")).toBeUndefined();

    wrapper.unmount();
  });

  it("does not emit action when reason is only whitespace", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Completed",
      availableActions: ["approve", "reject"],
    });

    const rejectButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Reject");
    await rejectButton!.trigger("click");
    await nextTick();

    const input = wrapper.find(".reject-input");
    await input.setValue("   ");

    const confirmButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Confirm Reject");
    await confirmButton!.trigger("click");

    expect(wrapper.emitted("action")).toBeUndefined();

    wrapper.unmount();
  });

  it("shows Receive button and emits action on click", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Sent",
      availableActions: ["receive"],
    });

    const btn = wrapper.findAll("button").find((b) => b.text() === "Receive");
    expect(btn).toBeTruthy();
    await btn!.trigger("click");

    expect(wrapper.emitted("action")?.[0]).toEqual(["receive", "t1"]);
    wrapper.unmount();
  });

  it("shows Start button and emits action on click", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Received",
      availableActions: ["start"],
    });

    const btn = wrapper.findAll("button").find((b) => b.text() === "Start");
    expect(btn).toBeTruthy();
    await btn!.trigger("click");

    expect(wrapper.emitted("action")?.[0]).toEqual(["start", "t1"]);
    wrapper.unmount();
  });

  it("shows Complete button and emits action on click", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "In Progress",
      partnerPhotos: [
        {
          id: "p1",
          label: "Photo",
          fileName: "p1.jpg",
          imageUrl: "/img/p1.jpg",
          thumbnailUrl: "/thumb/p1.jpg",
        },
      ],
      availableActions: ["complete"],
    });

    const btn = wrapper.findAll("button").find((b) => b.text() === "Complete");
    expect(btn).toBeTruthy();
    expect(btn!.attributes("disabled")).toBeUndefined();
    await btn!.trigger("click");

    expect(wrapper.emitted("action")?.[0]).toEqual(["complete", "t1"]);
    wrapper.unmount();
  });

  it("disables Complete button when no partner photos uploaded", () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "In Progress",
      partnerPhotos: [],
      availableActions: ["complete"],
    });

    const btn = wrapper.findAll("button").find((b) => b.text() === "Complete");
    expect(btn).toBeTruthy();
    expect(btn!.attributes("disabled")).toBeDefined();
    wrapper.unmount();
  });

  it("emits approve action on Approve button click", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Completed",
      availableActions: ["approve", "reject"],
    });

    const btn = wrapper.findAll("button").find((b) => b.text() === "Approve");
    expect(btn).toBeTruthy();
    await btn!.trigger("click");

    expect(wrapper.emitted("action")?.[0]).toEqual(["approve", "t1"]);
    wrapper.unmount();
  });

  it("closes reject modal without emitting when cancelled", async () => {
    const wrapper = mountActions({
      ...baseTicket,
      status: "Completed",
      availableActions: ["approve", "reject"],
    });

    // Open reject modal
    const rejectButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Reject");
    await rejectButton!.trigger("click");
    await nextTick();

    expect(wrapper.find(".reject-input").exists()).toBe(true);

    // Enter a reason then close via the modal's close event
    const input = wrapper.find(".reject-input");
    await input.setValue("Some reason");

    // Find and trigger the modal close (AppModal emits close)
    const modal = wrapper.findComponent({ name: "AppModal" });
    modal.vm.$emit("close");
    await nextTick();

    // Modal should be closed, no action emitted
    expect(wrapper.find(".reject-input").exists()).toBe(false);
    expect(wrapper.emitted("action")).toBeUndefined();
    wrapper.unmount();
  });
});
