import { HAS_SEEN_WALKTHROUGH_KEY } from "@/features/auth/pages/WalkthroughPage";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { AppButton } from "@/components/ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const { token, user, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState("");
  const [retry, setRetry] = useState(0);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState<boolean | null>(null);
  const [onboardingTarget, setOnboardingTarget] = useState<
    "profile" | "role" | "vehicle" | "schedule" | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      setInitializationError("");
      setOnboardingTarget(null);
      try {
        const seen = await AsyncStorage.getItem(HAS_SEEN_WALKTHROUGH_KEY);
        setHasSeenWalkthrough(seen === "true");
      } catch (_e) {
        setHasSeenWalkthrough(true);
      }

      try {
        const result = await loadUser();
        if (cancelled) return;

        if (result.success) {
          const profileType = useAuthStore.getState().user?.profileType;

          if (profileType === "student" || profileType === "personnel") {
            await useVehicleStore.getState().loadVehicle();
          }
        } else if (result.currentOnboardingStep) {
          setOnboardingTarget(result.currentOnboardingStep as any);
        } else if (useAuthStore.getState().token && !useAuthStore.getState().user) {
          setInitializationError(result.message || "Could not check your account. Please try again.");
        }
      } catch (err) {
        console.warn("[index] loadUser caught error:", err);
        if (!cancelled) setInitializationError("Could not check your account. Please try again.");
      }
      if (!cancelled) setLoading(false);
    };

    init();
    return () => { cancelled = true; };
  }, [loadUser, retry]);

  if (loading) {
    return <View className="flex-1 bg-light-background dark:bg-dark-background" />;
  }

  if (initializationError) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background px-6">
        <View className="w-full max-w-md gap-4">
          <Text className="text-center text-light-text dark:text-dark-text">{initializationError}</Text>
          <AppButton label="Try Again" onPress={() => setRetry(value => value + 1)} />
        </View>
      </View>
    );
  }

  if (token && onboardingTarget) {
    return <Redirect href="/(auth)/register" />;
  }

  if (!token || !user) {
    if (hasSeenWalkthrough === false) {
      return <Redirect href="/(auth)/walkthrough" />;
    }
    return <Redirect href="/(auth)/login" />;
  }

  if (user.corVerificationStatus === 1) {
    return <Redirect href="/(users)/(tabs)/home" />;
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
