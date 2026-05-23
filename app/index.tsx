import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

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
    return <Redirect href="/(users)/(tabs)/home" />;
  }

  // guard app
  if (user.profileType === "guard") {
    return <Redirect href="/(guard)/(tabs)/home" />;
  }

  // invalid profile
  return <Redirect href="/(auth)/login" />;
}
