import { useEffect, useState } from "react";

// Shared chart colors. Light mode is "A 清透卡片" (indigo main series, soft lavender
// comparison, friendly category tints); dark mode is "C 深色高級" (champagne gold).
const light = {
  ink: "#5b6cf0",
  muted: "#d3d7f6",
  accent: "#1a7f4b",
  danger: "#d4553f",
  grid: "#ececf0",
  categorical: ["#5b6cf0", "#f29a3a", "#2fb36f", "#ef6f8e", "#30a9c4", "#a07be8"],
};

const dark: typeof light = {
  ink: "#d9bf8c",
  muted: "#4a453e",
  accent: "#9fd3a8",
  danger: "#f08a74",
  grid: "#2a2825",
  categorical: ["#d9bf8c", "#9fd3a8", "#8fb3e0", "#e59b8c", "#b9a3d9", "#e0c46c"],
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
