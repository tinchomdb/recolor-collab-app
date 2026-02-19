import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import { describe, expect, it } from "vitest";
import PhotoOptionSelect from "./PhotoOptionSelect.vue";

const options = [
  {
    id: "p1",
    label: "Photo 1",
    fileName: "photo-1.jpg",
    thumbnailUrl: "http://localhost:3001/api/assets/thumbnails/photo-1.jpg",
    imageUrl: "http://localhost:3001/api/assets/images/photo-1.jpg",
  },
  {
    id: "p2",
    label: "Photo 2",
    fileName: "photo-2.jpg",
    thumbnailUrl: "http://localhost:3001/api/assets/thumbnails/photo-2.jpg",
    imageUrl: "http://localhost:3001/api/assets/images/photo-2.jpg",
  },
];

describe("PhotoOptionSelect", () => {
  it("closes the dropdown after selecting an option", async () => {
    const wrapper = mount(PhotoOptionSelect, {
      props: {
        options,
        modelValue: "",
        placeholder: "Select photo",
      },
      attachTo: document.body,
    });

    await wrapper.get(".photo-select-trigger").trigger("click");
    expect(wrapper.find(".photo-select-menu").exists()).toBe(true);

    const optionButtons = wrapper.findAll(".photo-select-item");
    await optionButtons[1].trigger("click");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["p1"]);
    expect(wrapper.find(".photo-select-menu").exists()).toBe(false);

    wrapper.unmount();
  });

  it("closes the dropdown when clicking outside", async () => {
    const wrapper = mount(PhotoOptionSelect, {
      props: {
        options,
        modelValue: "",
        placeholder: "Select photo",
      },
      attachTo: document.body,
    });

    await wrapper.get(".photo-select-trigger").trigger("click");
    expect(wrapper.find(".photo-select-menu").exists()).toBe(true);

    document.body.click();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".photo-select-menu").exists()).toBe(false);

    wrapper.unmount();
  });

  it("closes after selecting when used inside a wrapping label", async () => {
    const Host = defineComponent({
      components: { PhotoOptionSelect },
      setup() {
        const value = ref("");
        return { value, options };
      },
      template: `
        <label>
          Photo
          <PhotoOptionSelect v-model="value" :options="options" placeholder="Select photo" />
        </label>
      `,
    });

    const wrapper = mount(Host, { attachTo: document.body });

    await wrapper.get(".photo-select-trigger").trigger("click");
    expect(wrapper.find(".photo-select-menu").exists()).toBe(true);

    const optionButtons = wrapper.findAll(".photo-select-item");
    await optionButtons[1].trigger("click");
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".photo-select-menu").exists()).toBe(false);

    wrapper.unmount();
  });
});
