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
          // 🔴 Primary - True BulSU Red
          primary: "#D22730",
          // 🟡 Accent - True BulSU Gold
          accent: "#FDB813",
          secondary: "#52525B",

          // 🏢 Premium White Canvas Layering
          // Making background pure white gives you that clean, high-end look from the reference image.
          background: "#FFFFFF",
          surface: "#F4F4F5", // Perfect for pill tracks and layout backdrops
          surfaceSoft: "#FAFAFA", // For extremely subtle nested surfaces

          text: "#18181B", // Deep neutral text, perfectly crisp
          muted: "#71717A", // Neutral gray for secondary text

          // 🧩 Border - Ultra-thin, light neutral divider
          border: "#E4E4E7",

          // 🌿 Status colors
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",

          // ✨ Subtle highlight glow matching BulSU Red
          glow: "rgba(210, 39, 48, 0.08)",
        },
        dark: {
          primary: "#EF4444",
          accent: "#FCD34D",
          secondary: "#A1A1AA",
          background: "#09090B",
          surface: "#18181B",
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
