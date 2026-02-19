import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TicketFilters from "./TicketFilters.vue";
import type { DropdownInputDef } from "../types/components";

const filters: DropdownInputDef[] = [
  {
    key: "status",
    options: [
      { label: "Pending", value: "Pending" },
      { label: "Sent", value: "Sent" },
      { label: "Completed", value: "Completed" },
    ],
    value: "",
    placeholder: "All Statuses",
  },
  {
    key: "priority",
    options: [
      { label: "Low", value: "Low" },
      { label: "Medium", value: "Medium" },
      { label: "High", value: "High" },
    ],
    value: "",
    placeholder: "All Priorities",
  },
];

function mountFilters(props: { filters: DropdownInputDef[] }) {
  return mount(TicketFilters, { props });
}

describe("TicketFilters", () => {
  it("renders a select for each filter definition", () => {
    const wrapper = mountFilters({ filters });

    const selects = wrapper.findAll("select");
    expect(selects.length).toBe(filters.length);

    wrapper.unmount();
  });

  it("emits change with the updated key-value pair when a select changes", async () => {
    const wrapper = mountFilters({ filters });

    const selects = wrapper.findAll("select");
    await selects[0].setValue("Sent");

    expect(wrapper.emitted("change")).toBeTruthy();
    expect(wrapper.emitted("change")![0][0]).toEqual({ status: "Sent" });

    wrapper.unmount();
  });

  it("emits clear when Clear Filters button is clicked", async () => {
    const activeFilters: DropdownInputDef[] = [
      { ...filters[0], value: "Sent" },
      { ...filters[1], value: "" },
    ];

    const wrapper = mountFilters({ filters: activeFilters });

    const clearButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Clear Filters");
    expect(clearButton).toBeTruthy();
    await clearButton!.trigger("click");

    expect(wrapper.emitted("clear")).toBeTruthy();

    wrapper.unmount();
  });

  it("disables Clear Filters when no filters are active", () => {
    const wrapper = mountFilters({ filters });

    const clearButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Clear Filters");
    expect(clearButton).toBeTruthy();
    expect((clearButton!.element as HTMLButtonElement).disabled).toBe(true);

    wrapper.unmount();
  });

  it("enables Clear Filters when at least one filter is active", () => {
    const activeFilters: DropdownInputDef[] = [
      { ...filters[0], value: "Pending" },
      { ...filters[1], value: "" },
    ];

    const wrapper = mountFilters({ filters: activeFilters });

    const clearButton = wrapper
      .findAll("button")
      .find((btn) => btn.text() === "Clear Filters");
    expect((clearButton!.element as HTMLButtonElement).disabled).toBe(false);

    wrapper.unmount();
  });
});
