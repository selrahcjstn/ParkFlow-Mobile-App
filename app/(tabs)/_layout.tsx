import { Tabs } from "expo-router";

/**
 * Bottom tab navigator for the main app area.
 * Screens go here once the user is authenticated.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {/* Tab screens will live here */}
    </Tabs>
  );
}
