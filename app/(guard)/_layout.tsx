import { Stack } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function GuardGroupLayout() {
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
