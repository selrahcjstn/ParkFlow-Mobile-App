import { useAuthStore } from "@/features/auth/store/auth.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const { token, user, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const result = await loadUser();

      if (result.success) {
        const profileType = useAuthStore.getState().user?.profileType;

        if (profileType === "student" || profileType === "personnel") {
          await useVehicleStore.getState().loadVehicle();
        }
      }
      setLoading(false);
    };

    init();
  }, [loadUser]);

  if (loading) {
    return <View className="flex-1 bg-light-background" />;
  }

  if (!token || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.profileType === "student" || user.profileType === "personnel") {
    return <Redirect href="/(users)/(tabs)/home" />;
  }

  if (user.profileType === "guard") {
    return <Redirect href="/(guard)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
