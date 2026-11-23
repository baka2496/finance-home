/** @type {import('tailwindcss').Config} */
// Design direction "B 極簡黑白" (2026-11): ink-black on warm paper, thin hairlines,
// one lime accent. Existing class names (forest, emerald, slate) are remapped here so
// every page follows the same palette without per-page color edits.
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", '"Noto Sans TC"', "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', "Inter", '"Noto Sans TC"', "sans-serif"],
      },
      colors: {
        ink: "#111111",
        canvas: "#fafaf8",
        forest: "#111111",
        mint: "#d7f75b",
        lime: {
          DEFAULT: "#d7f75b",
          soft: "#eefbc0",
        },
        // Positive / accent tone: olive text on pale lime, readable on paper.
        emerald: {
          50: "#f4f9e0",
          100: "#e9f4c2",
          200: "#d8ec8f",
          300: "#c2dd5e",
          400: "#a3c23a",
          500: "#7f9c22",
          600: "#5f7a12",
          700: "#4a600b",
          800: "#384a08",
          900: "#283506",
          950: "#182104",
        },
        // Warm neutral greys that sit on the paper background.
        slate: {
          50: "#f6f5f1",
          100: "#efeee9",
          200: "#e2e1da",
          300: "#cfcec6",
          400: "#9e9d96",
          500: "#6b6b66",
          600: "#55554f",
          700: "#3f3f3b",
          800: "#2a2a27",
          900: "#1a1a18",
          950: "#111111",
        },
      },
      borderRadius: {
        xl: "0.625rem",
        "2xl": "0.75rem",
        "3xl": "1rem",
      },
      boxShadow: {
        soft: "none",
      },
    },
  },
  plugins: [],
};
