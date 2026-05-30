export interface AppThemeColors {
  primary: string;
  accent: string;
  background: string;
  surfaceMuted: string;
  surface: string;
  surfaceLighter: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  glow: string;
}

export const themeColors: Record<"light" | "dark", AppThemeColors> = {
  light: {
    primary: "#D22730",
    accent: "#334155",
    background: "#F4F4F5",
    surfaceMuted: "#ECECF0",
    surface: "#FFFFFF",
    surfaceLighter: "#F4F4F5",
    text: "#09090B",
    muted: "#71717A",
    border: "#E4E4E7",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    glow: "rgba(210, 39, 48, 0.08)",
  },
  dark: {
    primary: "#F87171",
    accent: "#E2E8F0",
    background: "#2b2d31",
    surfaceMuted: "#313338",
    surface: "#383a40",
    surfaceLighter: "#404249",
    text: "#f2f3f5",
    muted: "#949ba4",
    border: "#1f2023",
    success: "#34D399",
    warning: "#FBBF24",
    danger: "#F87171",
    glow: "rgba(248, 113, 113, 0.12)",
  },
};
