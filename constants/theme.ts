/** Design tokens from tailwind.config.js — use Tailwind classes in UI; use lightColors for icon props. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindConfig = require("../tailwind.config");

export const lightColors = tailwindConfig.theme.extend.colors.light as {
  primary: string;
  accent: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
};

export type LightColorKey = keyof typeof lightColors;
