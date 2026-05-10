import { Stack } from "expo-router";

/**
 * Layout for all auth screens (login, register, forgot password, etc.)
 * No header is shown — the AuthHeader component handles branding.
 */
export default function AuthGroupLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
