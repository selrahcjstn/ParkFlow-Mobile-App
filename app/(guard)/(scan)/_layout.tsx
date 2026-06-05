import { Stack } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";

// Layout for guard scan screens — no native header; SubScreenLayout handles header UI.
export default function GuardScanLayout() {
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
