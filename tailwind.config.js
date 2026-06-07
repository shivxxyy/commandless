/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Near-black surfaces with a faint cool/green undertone.
        graphite: {
          950: "#050706",
          900: "#080a09",
          850: "#0c0f0e",
          800: "#101413",
          750: "#161b19",
          700: "#1d2421",
          600: "#28302c",
        },
        // Brand green scale (confident, not neon). The legacy "neon" keys are
        // kept and remapped to green so existing usages recolor cleanly.
        accent: {
          50: "#e9f7ef",
          300: "#5fd394",
          400: "#3fc07d",
          500: "#27a35f",
          600: "#1f8b4f",
          700: "#176b3d",
        },
        neon: {
          blue: "#27a35f",
          violet: "#3fc07d",
          cyan: "#5fd394",
        },
        risk: {
          safe: "#34c77b",
          "safe-dim": "#0d2c1d",
          medium: "#d6a23a",
          "medium-dim": "#2e2611",
          danger: "#e0625c",
          "danger-dim": "#2e1513",
        },
        ink: {
          DEFAULT: "#e6ebe8",
          soft: "#9aa6a0",
          faint: "#5f6b65",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        // Tighter, more serious. Not flat, but squared-off.
        lg: "0.5rem",
        xl: "0.625rem",
        "2xl": "0.75rem",
      },
      boxShadow: {
        glass: "0 12px 40px -16px rgba(0,0,0,0.7)",
        "glow-blue": "0 0 0 1px rgba(39,163,95,0.22)",
        "glow-run": "0 0 0 1px rgba(39,163,95,0.28), 0 0 26px -6px rgba(39,163,95,0.22)",
      },
      backgroundImage: {
        // A near-solid green with a subtle vertical sheen (no rainbow).
        "neon-gradient": "linear-gradient(180deg, #2eaa64 0%, #218a4f 100%)",
        "panel-sheen": "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};
