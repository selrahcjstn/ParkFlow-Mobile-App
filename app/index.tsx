import { HAS_SEEN_WALKTHROUGH_KEY } from "@/features/auth/pages/WalkthroughPage";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const { token, user, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState<boolean | null>(null);
  const [onboardingTarget, setOnboardingTarget] = useState<
    "profile" | "role" | "vehicle" | "schedule" | null
  >(null);

  useEffect(() => {
    const init = async () => {
      try {
        const seen = await AsyncStorage.getItem(HAS_SEEN_WALKTHROUGH_KEY);
        setHasSeenWalkthrough(seen === "true");
      } catch (_e) {
        setHasSeenWalkthrough(true);
      }

      try {
        const result = await loadUser();

        if (result.success) {
          const profileType = useAuthStore.getState().user?.profileType;

          if (profileType === "student" || profileType === "personnel") {
            await useVehicleStore.getState().loadVehicle();
          }
        } else if (result.currentOnboardingStep) {
          setOnboardingTarget(result.currentOnboardingStep as any);
        }
      } catch (err) {
        console.warn("[index] loadUser caught error:", err);
      }
      setLoading(false);
    };

    init();
  }, [loadUser]);

  if (loading) {
    return <View className="flex-1 bg-light-background dark:bg-dark-background" />;
  }

  if (!token || !user) {
    if (hasSeenWalkthrough === false) {
      return <Redirect href="/(auth)/walkthrough" />;
    }
    return <Redirect href="/(auth)/login" />;
  }

  if (onboardingTarget) {
    return <Redirect href="/(auth)/register" />;
  }

  if (user.profileType === "unassigned") {
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
