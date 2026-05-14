import { useAuthStore } from "@/store/useAuthStore";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function Index() {
  const { token, user, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      setLoading(false);
    };

    init();
  }, []);

  // still loading auth state
  if (loading) {
    return <View />;
  }

  // not logged in
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  // user not loaded properly
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // student
  if (user.profileType === "student" || user.profileType !== "personnel") {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
