import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import TicketEditorForm from "./TicketEditorForm.vue";
import type { PhotoOption, Priority } from "@shared/types";

const photoOptions: PhotoOption[] = [
  {
    id: "p1",
    label: "Photo 1",
    fileName: "p1.jpg",
    thumbnailUrl: "/thumbs/p1.jpg",
    imageUrl: "/images/p1.jpg",
  },
  {
    id: "p2",
    label: "Photo 2",
    fileName: "p2.jpg",
    thumbnailUrl: "/thumbs/p2.jpg",
    imageUrl: "/images/p2.jpg",
  },
];

const partners = ["Studio Alpha", "Studio Beta"];
const styleOptions = ["Night Sky - AOP White Dots", "Hedge Green - solid"];

const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];

function mountForm(propsOverrides = {}) {
  return mount(TicketEditorForm, {
    props: {
      partners,
      styleOptions,
      photoOptions,
      priorities,
      ...propsOverrides,
    },
    attachTo: document.body,
  });
}

describe("TicketEditorForm", () => {
  it("disables the submit button when required fields are empty", async () => {
    const wrapper = mountForm();

    const submitButton = wrapper.find(".form-actions button");
    expect(submitButton.attributes("disabled")).toBeDefined();
    expect(wrapper.emitted("submit")).toBeFalsy();

    wrapper.unmount();
  });

  it("emits submit with correct payload when form is valid", async () => {
    const wrapper = mountForm();

    // Fill instructions
    const textarea = wrapper.find("textarea");
    await textarea.setValue("Keep clipping path\nAdjust colors");

    // Click "Add Photo" to show the dropdown
    const addButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Add Photo");
    await addButton!.trigger("click");
    await nextTick();

    // Select a photo: open the dropdown and pick the first real option (index 1, since 0 is placeholder)
    await wrapper.find(".photo-select-trigger").trigger("click");
    const items = wrapper.findAll(".photo-select-item");
    expect(items.length).toBeGreaterThan(1);
    await items[1]!.trigger("click");

    await nextTick();

    await wrapper.find(".form-actions button").trigger("click");

    const submitEvents = wrapper.emitted("submit");
    expect(submitEvents).toBeTruthy();
    expect(submitEvents!.length).toBe(1);

    const payload = submitEvents![0]![0] as Record<string, unknown>;
    expect(payload).toHaveProperty("style");
    expect(payload).toHaveProperty("priority");
    expect(payload).toHaveProperty("partner");
    expect(payload).toHaveProperty("instructions");
    expect(payload).toHaveProperty("referencePhotos");
    expect((payload.instructions as string[]).length).toBeGreaterThan(0);
    expect((payload.referencePhotos as unknown[]).length).toBeGreaterThan(0);
    expect((payload.referencePhotos as Array<{ id: string }>)[0]!.id).toBe(
      "p1",
    );

    wrapper.unmount();
  });

  it("initializes form from initial prop", async () => {
    const wrapper = mountForm({
      initial: {
        style: "Hedge Green - solid",
        priority: "High",
        partner: "Studio Beta",
        instructions: ["Instruction one", "Instruction two"],
        referencePhotos: [photoOptions[0]],
      },
    });

    await nextTick();

    const textarea = wrapper.find("textarea");
    expect((textarea.element as HTMLTextAreaElement).value).toContain(
      "Instruction one",
    );
    expect((textarea.element as HTMLTextAreaElement).value).toContain(
      "Instruction two",
    );

    wrapper.unmount();
  });

  it("adds and removes reference photos via gallery", async () => {
    const wrapper = mountForm();

    // Initially no photos — gallery should not be present
    expect(wrapper.find(".gallery").exists()).toBe(false);

    // Click "Add Photo" to open the dropdown
    const addButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Add Photo");
    expect(addButton).toBeTruthy();
    await addButton!.trigger("click");
    await nextTick();

    // The photo select dropdown should appear
    expect(wrapper.find(".photo-select-dropdown").exists()).toBe(true);

    // Open the dropdown and pick the first photo
    await wrapper.find(".photo-select-trigger").trigger("click");
    const items = wrapper.findAll(".photo-select-item");
    expect(items.length).toBeGreaterThan(1);
    await items[1]!.trigger("click");
    await nextTick();

    // Gallery should now show one photo
    expect(wrapper.findAll(".gallery-card").length).toBe(1);

    // The add-photo dropdown should have closed
    expect(wrapper.find(".photo-add-row").exists()).toBe(false);

    // Remove the photo via the gallery remove button
    const removeBtn = wrapper.find(".gallery-remove-btn");
    expect(removeBtn.exists()).toBe(true);
    await removeBtn.trigger("click");
    await nextTick();

    // Gallery should be gone
    expect(wrapper.find(".gallery").exists()).toBe(false);

    wrapper.unmount();
  });

  it("shows the provided submit label", () => {
    const wrapper = mountForm({ submitLabel: "Create Ticket" });

    const submitButton = wrapper.find(".form-actions button");
    expect(submitButton.text()).toBe("Create Ticket");

    wrapper.unmount();
  });
});
