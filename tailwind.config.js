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
          primary: "#D22730", // BulSU red
          accent: "#334155", // Shifted from harsh black to professional deep slate

          // 🌫️ Elevated Surface Contrast
          background: "#F1F5F9", // Slate-100 (creates a better backdrop for white cards)
          surface: "#FFFFFF", // Crisp white (now pops dramatically against background)

          // 🖋️ Typography
          text: "#0F172A",
          muted: "#64748B",
          textInverse: "#F8FAFC",

          // 🧩 Borders / Dividers
          border: "#E2E8F0",

          // 🌿 Status
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",

          // ✨ Soft red ambient glow
          glow: "rgba(210, 39, 48, 0.08)",
        },

        dark: {
          // 🔴 Keep BulSU identity visible in dark
          primary: "#F87171",
          accent: "#E2E8F0", // Replaced jarring amber yellow with an elegant silver slate
          secondary: "#94A3B8",

          // 🌑 Premium dark layering (Much deeper background + lighter surfaces)
          background: "#030712", // True rich dark backdrop
          surface: "#1F2937", // Lifted gray-800 for instant card pop
          surfaceSoft: "#374151",

          // 🖋️ Typography
          text: "#F9FAFB",
          muted: "#9CA3AF",

          // 🧩 Borders
          border: "#374151",

          // 🌿 Status
          success: "#34D399",
          warning: "#FBBF24",
          danger: "#F87171",

          // ✨ Dark ambient red glow
          glow: "rgba(248, 113, 113, 0.12)",
        },
      },

      fontFamily: {
        light: ["Inter-Light"],     // 300 - Light clean descriptions
        regular: ["Inter-Regular"], // 400 - Standard text / inputs
        medium: ["Inter-Medium"],   // 500 - Tabs, buttons, soft headers
        bold: ["Inter-Bold"],       // 700 - Main component headers
        black: ["Inter-Black"],     // 900 - Numbers, badges, deep contrast impact
      },

      boxShadow: {
        soft: "0 2px 12px rgba(15, 23, 42, 0.03)",
        card: "0 8px 24px rgba(15, 23, 42, 0.05)", // Slightly deeper shadow spread to accentuate the pop
      },
    },
  },

  plugins: [],
};
