import { Stack } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";

/**
 * Layout for all auth screens (login, register, forgot password, etc.)
 * No header is shown — the AuthHeader component handles branding.
 */
export default function AuthGroupLayout() {
  const { colors } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    />
  );
}
