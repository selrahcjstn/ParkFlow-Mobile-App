import { AlertModal } from "@/components/shared";
import { AppButton, AppInput, AppSelect } from "@/components/ui";
import { REGISTER_ROLE_OPTIONS } from "@/constants/registerRoleOptions";
import { Roles } from "@/constants/roles";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useApiMutation } from "@/hooks";
import { NAME_REGEX, PHONE_REGEX } from "@/utils/registerValidation";
import { useRouter } from "expo-router";
import { AlertCircle, ChevronLeft } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingProfilePage() {
  const router = useRouter();

  const { run: updateProfile, isLoading } = useApiMutation(
    onboardingService.updateProfile,
  );

  const { role, profile, setRole, setProfileField } = useOnboardingStore();

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "info",
  });

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "error",
    ) => {
      console.log("⚠️ ALERT:", title, message);

      setModal({
        visible: true,
        title,
        message,
        variant,
      });

      Alert.alert(title, message);
    },
    [],
  );

  const closeModal = () => setModal((prev) => ({ ...prev, visible: false }));

  const handleNext = async () => {
    try {
      console.log("🚀 ONBOARDING PROFILE START");

      const firstName = profile.firstName?.trim();
      const lastName = profile.lastName?.trim();
      const phoneNumber = profile.phoneNumber?.trim();

      console.log("📦 INPUT:", { firstName, lastName, phoneNumber, role });

      // VALIDATION
      if (!firstName || !lastName || !phoneNumber) {
        return showAlert("Missing Info", "All fields are required.", "warning");
      }

      if (!NAME_REGEX.test(firstName) || !NAME_REGEX.test(lastName)) {
        return showAlert("Invalid Name", "Check name format.", "warning");
      }

      if (!PHONE_REGEX.test(phoneNumber)) {
        return showAlert("Invalid Phone", "Check phone format.", "warning");
      }

      if (role == null) {
        return showAlert("Missing Role", "Please select a role.", "warning");
      }

      if (!Object.values(Roles).includes(role)) {
        return showAlert("Invalid Role", "Role is invalid.", "error");
      }

      // API PAYLOAD
      const payload = {
        firstName,
        lastName,
        phoneNumber,
        profilePictureUrl: profile.profilePictureUrl?.trim() || "",
      };

      console.log("📤 PROFILE REQUEST:", payload);
      Alert.alert("Submitting", "Sending profile data...");

      const res = await updateProfile(payload);

      console.log("📥 PROFILE RESPONSE:", res);

      if (!res?.isSuccess) {
        return showAlert(
          "Update Failed",
          res?.message || "Try again later.",
          "error",
        );
      }

      console.log("✅ PROFILE SAVED");

      router.replace("/(auth)/onboarding-role");
    } catch (err: any) {
      console.error("❌ ONBOARDING ERROR:", err);

      console.log("🔍 STATUS:", err?.response?.status);
      console.log("🔍 DATA:", err?.response?.data);

      showAlert(
        "Error",
        err?.response?.data?.message || err?.message || "Unexpected error",
        "error",
      );
    }
  };

  const isSubmitting = useMemo(() => isLoading, [isLoading]);

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color="#D22730" />
          </TouchableOpacity>

          <Text className="text-[17px] font-bold flex-1 text-center">
            Profile Info
          </Text>

          <View style={{ width: 24 }} />
        </View>
      }
    >
      <View className="px-6 pt-4 pb-12 flex-1 gap-4">
        <AppInput
          label="First Name"
          value={profile.firstName}
          onChangeText={(v) => setProfileField("firstName", v)}
        />

        <AppInput
          label="Last Name"
          value={profile.lastName}
          onChangeText={(v) => setProfileField("lastName", v)}
        />

        <AppInput
          label="Phone Number"
          keyboardType="phone-pad"
          value={profile.phoneNumber}
          onChangeText={(v) => setProfileField("phoneNumber", v)}
        />

        <AppSelect
          label="Role"
          options={REGISTER_ROLE_OPTIONS}
          value={role != null ? String(role) : undefined}
          onChange={(v) => {
            const parsed = Number(v);
            if (
              !Number.isNaN(parsed) &&
              Object.values(Roles).includes(parsed)
            ) {
              setRole(parsed as Roles);
            } else {
              setRole(undefined as any);
            }
          }}
        />

        <AppInput
          label="Profile Picture URL"
          value={profile.profilePictureUrl}
          onChangeText={(v) => setProfileField("profilePictureUrl", v)}
        />

        <AppButton
          label="Continue"
          onPress={handleNext}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="mt-4"
        />
      </View>

      <AlertModal
        visible={modal.visible}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        icon={<AlertCircle size={28} color="#F59E0B" />}
      />
    </AuthLayout>
  );
}
