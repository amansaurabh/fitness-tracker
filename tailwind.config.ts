import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0B0E",
        surface: "#14161C",
        "surface-raised": "#1B1E26",
        border: "rgba(255, 255, 255, 0.08)",
        lime: {
          DEFAULT: "#CBFF4D",
          glow: "rgba(203, 255, 77, 0.4)",
          subtle: "rgba(203, 255, 77, 0.12)",
        },
        violet: {
          DEFAULT: "#7B6CFF",
          glow: "rgba(123, 108, 255, 0.35)",
          subtle: "rgba(123, 108, 255, 0.15)",
        },
        coral: {
          DEFAULT: "#FF6E52",
          glow: "rgba(255, 110, 82, 0.3)",
          subtle: "rgba(255, 110, 82, 0.15)",
        },
        text: {
          DEFAULT: "#F3F4F0",
          dim: "#8A8D98",
          dimmer: "#565962",
        },
      },
      fontFamily: {
        space: ["var(--font-space)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glowLime: "0 0 20px rgba(203, 255, 77, 0.4)",
        glowViolet: "0 0 20px rgba(123, 108, 255, 0.35)",
        glowCoral: "0 0 20px rgba(255, 110, 82, 0.3)",
        card: "0 20px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      borderRadius: {
        "card-lg": "28px",
        "card-md": "24px",
        "card-sm": "20px",
      },
    },
  },
  plugins: [],
};

export default config;

