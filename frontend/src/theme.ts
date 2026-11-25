export type AppTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "finance:theme";

export function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;

  const themeColor = theme === "dark" ? "#0d0d0e" : "#f4f4f6";
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  // The iPhone status bar style is left alone (always "black-translucent" in index.html):
  // iOS reads it only when the app is added to the home screen.
}

export function saveTheme(theme: AppTheme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}
