import { Redirect } from "expo-router";

// Redirect to dashboard landing page for preview
// Change back to /(auth)/login when auth flow is wired
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}