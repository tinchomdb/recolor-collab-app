import { ref, watchEffect } from "vue";

type Theme = "light" | "dark";

const STORAGE_KEY = "app-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const theme = ref<Theme>(getInitialTheme());

watchEffect(() => {
  const root = document.documentElement;
  if (theme.value === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem(STORAGE_KEY, theme.value);
});

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === "light" ? "dark" : "light";
  }

  return { theme, toggleTheme };
}
