import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF6FF",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        success: "#16A34A",
        warning: "#D97706",
        error: "#DC2626",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        serif: ["Crimson Text", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
