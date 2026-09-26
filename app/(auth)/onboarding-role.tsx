import { Redirect } from "expo-router";

export default function RedirectToRegister() {
  return <Redirect href="/(auth)/register" />;
}
