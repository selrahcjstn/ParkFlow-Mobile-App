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
          surfaceMuted: "#E4E4E7", // TIER 2: Unselected Cards (Zinc-200 - Fixed! Darker & distinct)
          surface: "#FFFFFF", // TIER 3: Active Card / Main Pass (Pure Crisp White)

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
          primary: "#F87171",
          accent: "#E2E8F0",
          secondary: "#94A3B8",

          // 🌑 PREMIUM METALLIC DARK HIERARCHY (Zero Blue/Purple undertones)
          background: "#09090B", // TIER 1: True Rich Ink Black (Zinc-950)
          surfaceMuted: "#18181B", // TIER 2: Unselected Cards (Zinc-900)
          surface: "#27272A", // TIER 3: Active Card / Main Pass (Zinc-800)

          // 🖋️ Typography
          text: "#FAFAFA",
          muted: "#A1A1AA",

          // 🧩 Borders
          border: "#27272A",

          // 🌿 Status
          success: "#34D399",
          warning: "#FBBF24",
          danger: "#F87171",
          glow: "rgba(248, 113, 113, 0.12)",
        },
      },

      fontFamily: {
        regular: ["AvenirRegular"],
        book: ["AvenirBook"],
        light: ["AvenirLight"],
        heavy: ["AvenirHeavy"],
        black: ["AvenirBlack"],
      },
      borderRadius: {
        card: "16px", // Custom utility: class="rounded-card" (Equal to 2xl)
        button: "12px", // Custom utility: class="rounded-button" (Perfect for CTAs)
        pill: "9999px", // Custom utility: class="rounded-pill"
      },

      boxShadow: {
        soft: "0 2px 10px rgba(15, 23, 42, 0.04)",
        card: "0 4px 20px rgba(15, 23, 42, 0.06)",
      },
    },
  },

  plugins: [],
};
