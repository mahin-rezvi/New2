import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        atlas: {
          bg: "var(--bg)",
          red: "var(--brand-red)",
          gold: "var(--accent-3)",
          mint: "var(--accent-2)",
          paper: "var(--text)",
          muted: "var(--muted)",
          panel: "var(--panel)",
        },
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
    },
  },
};

export default config;
