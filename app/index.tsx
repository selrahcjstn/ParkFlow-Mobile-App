import { Redirect } from "expo-router";

// Just bounce straight to the login screen when the app opens
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}