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
          // 🔴 Primary - Back to True BulSU Red (No more pink/rose)
          primary: "#D22730",

          // 🟡 Accent - True BulSU Gold
          accent: "#FDB813",

          secondary: "#52525B",

          // 🧱 Background layering - Perfectly neutral gray (no blue tint!)
          // This is the absolute secret to making borderless #FFFFFF cards pop.
          background: "#F4F4F5",
          surface: "#FFFFFF",
          surfaceSoft: "#FAFAFA", // Great for nested flat elements

          text: "#18181B", // Deep neutral text, perfectly crisp
          muted: "#71717A", // Neutral gray for secondary text

          // 🧩 Border - Extremely subtle neutral
          border: "#E4E4E7",

          // 🌿 Status colors
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",

          // ✨ Subtle highlight glow matching BulSU Red
          glow: "rgba(210, 39, 48, 0.08)",
        },

        dark: {
          primary: "#EF4444", // Brightened BulSU red for dark mode contrast
          accent: "#FCD34D",
          secondary: "#A1A1AA",

          // For dark mode borderless, use deep pitch neutral (Zinc-950)
          background: "#09090B",
          surface: "#18181B", // Zinc-900 surface (separates cleanly from bg without lines)
          surfaceSoft: "#27272A",

          text: "#FAFAFA",
          muted: "#A1A1AA",

          border: "#27272A",

          success: "#34D399",
          warning: "#FCD34D",
          danger: "#F87171",

          glow: "rgba(239, 68, 68, 0.10)",
        },
      },

      fontFamily: {
        regular: ["AvenirRegular"],
        book: ["AvenirBook"],
        light: ["AvenirLight"],
        heavy: ["AvenirHeavy"],
        black: ["AvenirBlack"],
      },
    },
  },
  plugins: [],
};
