/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./layouts/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        light: {
          primary: "#D22730", // BulSU red (pops beautifully against true neutral gray)
          accent: "#334155",

          // 🌫️ THE TRUE NEUTRAL 3-TIER HIERARCHY (Zero Blue Tint)
          background: "#F4F4F5", // TIER 1: Base Canvas (Pure neutral Zinc-100)
          surfaceMuted: "#ECECF0", // TIER 2: Unselected Cards (Zinc-200 - Fixed! Darker & distinct)
          surface: "#FFFFFF", // TIER 3: Active Card / Main Pass (Pure Crisp White)
          surfaceLighter: "#F4F4F5",

          // 🖋️ Typography
          text: "#09090B", // Near black (Zinc-950)
          muted: "#71717A", // Muted gray (Zinc-500)
          textInverse: "#FAFAFA",

          // 🧩 Borders / Dividers
          border: "#E4E4E7",

          // 🌿 Status
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          glow: "rgba(210, 39, 48, 0.08)",
        },

        dark: {
          // Brand
          primary: "#F87171",
          accent: "#E2E8F0",
          secondary: "#94A3B8",

          // Background hierarchy
          background: "#AA1F22", // Main app background
          surfaceMuted: "#232428", // Secondary sections
          surface: "#2B2D31", // Cards
          surfaceLighter: "#313338", // Elevated cards, modals

          // Typography
          text: "#F2F3F5",
          muted: "#B5BAC1",

          // Borders
          border: "#3A3C43",

          // Status
          success: "#34D399",
          warning: "#FBBF24",
          danger: "#F87171",

          glow: "rgba(248, 113, 113, 0.12)",
        },
      },

      fontFamily: {
        regular: ["Inter-Regular"],
        book: ["Inter-Medium"],
        light: ["Inter-Light"],
        heavy: ["Inter-Bold"],
        black: ["Inter-Black"],
      },
      borderRadius: {
        card: "16px",
        button: "8px",
        pill: "9999px",
      },

      boxShadow: {
        soft: "0 2px 10px rgba(15, 23, 42, 0.04)",
        card: "0 4px 20px rgba(15, 23, 42, 0.06)",
      },
    },
  },

  plugins: [],
};
