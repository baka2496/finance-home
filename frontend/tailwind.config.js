/** @type {import('tailwindcss').Config} */
// Design direction "A 清透卡片" (2026-11): light grey canvas, white cards with soft
// shadows, an indigo accent and tinted icons. Dark mode is "C 深色高級" (dark gradient,
// champagne gold), defined in src/index.css. Existing class names (forest, emerald,
// slate) are remapped here so every page follows the palette without per-page edits.
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", '"Chiron Hei HK"', '"Noto Sans TC"', "system-ui", "sans-serif"],
        display: ["Inter", '"Chiron Hei HK"', '"Noto Sans TC"', "sans-serif"],
      },
      colors: {
        ink: "#1d1d1f",
        canvas: "#f4f4f6",
        forest: "#1d1d1f",
        accent: {
          DEFAULT: "#5b6cf0",
          soft: "#eef0ff",
          strong: "#4453d6",
        },
        // Positive tone: calm green on a pale green tint.
        emerald: {
          50: "#e7f6ee",
          100: "#d0eedd",
          200: "#a6dfbf",
          300: "#6fc996",
          400: "#3fb072",
          500: "#23955a",
          600: "#1a7f4b",
          700: "#16693f",
          800: "#125533",
          900: "#0e4128",
          950: "#082917",
        },
        // Cool neutral greys, close to the ones iPhone apps use.
        slate: {
          50: "#f7f7f9",
          100: "#f0f0f3",
          200: "#e5e5ea",
          300: "#d1d1d6",
          400: "#aeaeb2",
          500: "#86868b",
          600: "#6e6e73",
          700: "#48484a",
          800: "#2c2c2e",
          900: "#1d1d1f",
          950: "#111111",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 4%), 0 8px 24px rgb(0 0 0 / 5%)",
        card: "0 1px 2px rgb(0 0 0 / 4%), 0 8px 24px rgb(0 0 0 / 5%)",
        lift: "0 2px 4px rgb(0 0 0 / 5%), 0 16px 36px rgb(0 0 0 / 10%)",
      },
    },
  },
  plugins: [],
};
