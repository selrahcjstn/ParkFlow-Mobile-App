import { Stack } from "expo-router";

// Layout for guard scan screens — no native header; SubScreenLayout handles header UI.
export default function GuardScanLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
