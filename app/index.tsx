import { useAuthStore } from "@/store/useAuthStore";
import { Redirect } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const { token, user, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user) {
    return null;
  }

  return <Redirect href="/(tabs)/home" />;
}