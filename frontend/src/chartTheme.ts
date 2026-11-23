import { useEffect, useState } from "react";

// Shared chart colors for the "B 極簡黑白" style: ink for the main series,
// warm grey for the comparison series, lime only as the single accent.
const light = {
  ink: "#111111",
  muted: "#c9c8c0",
  accent: "#b5d62f",
  danger: "#b4412c",
  grid: "#e2e1da",
  categorical: ["#111111", "#c6e83a", "#8a8a84", "#c9c8c0", "#4a4a46", "#e2e1da"],
};

const dark: typeof light = {
  ink: "#f2f2ee",
  muted: "#5a5a55",
  accent: "#d7f75b",
  danger: "#f08a74",
  grid: "#2a2a28",
  categorical: ["#f2f2ee", "#d7f75b", "#8a8a84", "#5a5a55", "#bdbdb7", "#353532"],
};

export type ChartTheme = typeof light;

const isDark = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark");

export function chartThemeFor(mode: "light" | "dark"): ChartTheme {
  return mode === "dark" ? dark : light;
}

/** Chart palette that follows the app's light/dark switch. */
export function useChartTheme(): ChartTheme {
  const [darkMode, setDarkMode] = useState(isDark);
  useEffect(() => {
    const observer = new MutationObserver(() => setDarkMode(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return darkMode ? dark : light;
}
