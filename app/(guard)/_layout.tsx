import { Stack } from "expo-router";

export default function GuardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="scan-qr" />
      <Stack.Screen name="search-parkee" />
    </Stack>
  );
}
