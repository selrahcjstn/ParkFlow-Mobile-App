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

  if (loading) {
    return <View />;
  }

  // no token
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  // failed loading user
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // student/personnel app
  if (user.profileType === "student" || user.profileType === "personnel") {
    return <Redirect href="/(tabs)/home" />;
  }

  // guard app
  if (user.profileType === "guard") {
    return <Redirect href="/(guard)/guard-dashboard" />;
  }

  // invalid profile
  return <Redirect href="/(auth)/login" />;
}
