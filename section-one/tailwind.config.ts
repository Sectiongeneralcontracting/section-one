import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // مأخوذة من هوية شعار Section (البرتقالي المعدني + الرمادي الغانميتال)
        primary: { DEFAULT: "#C9692E", light: "#E08A4F", dark: "#9A4E20" },
        steel: { DEFAULT: "#3A3E42", light: "#565B60", dark: "#25282B" },
        secondary: { DEFAULT: "#565B60" },
        surface: "#F6F5F2",
        surfaceDark: "#1C1E20",
        danger: "#B3261E",
        success: "#2E7D32",
        warning: "#C9692E",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        arabic: ["var(--font-arabic)"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" },
    },
  },
  plugins: [],
};
export default config;
