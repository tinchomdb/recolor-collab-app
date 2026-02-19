import type { Ref } from "vue";
import { onBeforeUnmount, onMounted } from "vue";

export function useClickOutside(
  target: Ref<HTMLElement | null>,
  handler: () => void,
) {
  function onDocumentClick(event: MouseEvent) {
    if (!target.value) {
      return;
    }

    if (event.target instanceof Node && !target.value.contains(event.target)) {
      handler();
    }
  }

  onMounted(() => {
    document.addEventListener("click", onDocumentClick);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("click", onDocumentClick);
  });
}
