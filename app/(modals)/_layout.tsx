import { Stack } from "expo-router";

/**
 * Layout for modal screens (confirmation dialogs, detail sheets, etc.)
 * Uses a transparent modal presentation so the content behind still shows.
 */
export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "transparentModal",
        animation: "fade",
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );
}
