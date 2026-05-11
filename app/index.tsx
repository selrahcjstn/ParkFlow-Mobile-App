import { useAuthStore } from "@/store/useAuthStore";
import { Redirect } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const { token, user, loadUser, isInitialized } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  // Show a blank screen (or a splash screen) while checking async storage
  if (!isInitialized) {
    return null;
  }

  // Once initialized, if there's no token, redirect to login
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  // If there's a token but no user, wait for the user to load
  // (though loadUser handles this together usually, just a safeguard)
  if (!user) {
    return null;
  }

  return <Redirect href="/(tabs)/home" />;
}