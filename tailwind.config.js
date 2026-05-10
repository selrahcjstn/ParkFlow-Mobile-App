/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        light: {
          primary: "#9D0215",     // Brand maroon – hero backgrounds, CTAs
          accent: "#1E3A5F",      // Deep navy – labels, headings, links (professional, non-error)
          secondary: "#475569",   // Slate 600 – secondary actions, subtitles
          background: "#F8F9FA",  // Clean off-white – main app background
          surface: "#FFFFFF",     // Pure white – cards and modals
          text: "#111827",        // Near-black – body text, high legibility
          muted: "#6B7280",       // Gray – disabled states, secondary text
          border: "#E5E7EB",      // Light gray – borders, separators
          success: "#10B981",     // Emerald – successful RFID scans
          warning: "#F59E0B",     // Amber – pending actions / alerts
          danger: "#EF4444",      // Red – errors only
        },

        dark: {
          primary: "#E85B6B",     // Brightened brand red for dark-mode contrast
          accent: "#60A5FA",      // Soft blue – dark-mode accent for labels/links
          secondary: "#94A3B8",   // Slate 400
          background: "#0F172A",  // Deep slate – modern dark-mode base
          surface: "#1E293B",     // Slightly lighter slate for cards
          text: "#F9FAFB",        // Off-white – body text
          muted: "#9CA3AF",       // Dimmed text
          border: "#334155",      // Subtle dark borders
          success: "#34D399",     // Bright emerald
          warning: "#FCD34D",     // Bright amber
          danger: "#F87171",      // Bright red – errors only
        },
      },
    },
  },
  plugins: [],
};