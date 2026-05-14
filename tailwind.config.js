/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        light: {
          primary: "#9D0215",
          accent: "#1E3A5F",
          secondary: "#475569",
          background: "#F8F9FA",
          surface: "#FFFFFF",
          text: "#111827",
          muted: "#6B7280",
          border: "#E5E7EB",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },

        dark: {
          primary: "#E85B6B",
          accent: "#60A5FA",
          secondary: "#94A3B8",
          background: "#0F172A",
          surface: "#1E293B",
          text: "#F9FAFB",
          muted: "#9CA3AF",
          border: "#334155",
          success: "#34D399",
          warning: "#FCD34D",
          danger: "#F87171",
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
