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
    accent: "#E3E5E8",
    background: "#1E1F22",
    surfaceMuted: "#232428",
    surface: "#2B2D31",
    surfaceLighter: "#313338",
    text: "#F2F3F5",
    muted: "#B5BAC1",
    border: "#3A3C43",
    success: "#23A55A",
    warning: "#F0B232",
    danger: "#F87171",
    glow: "rgba(248, 113, 113, 0.12)",
  },
};
