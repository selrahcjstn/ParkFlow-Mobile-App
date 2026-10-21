import CorStudentRegistrationStep from '../components/CorStudentRegistrationStep';
import { useAuthStore } from '../store/auth.store';
import { AlertModal } from "@/components/shared";
import { useAppTheme } from "@/hooks/useAppTheme";
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
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const user = useAuthStore(state => state.user);

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
      setModal({ visible: true, title, message, variant });
    },
    [],
  );

  const closeModal = () => setModal((prev) => ({ ...prev, visible: false }));

  const handleNext = async () => {
    try {
      const firstName = profile.firstName?.trim();
      const lastName = profile.lastName?.trim();
      const phoneNumber = profile.phoneNumber?.trim();

      if (!firstName || !lastName || !phoneNumber) {
        return showAlert("Missing Info", "All fields are required.", "warning");
      }

      if (!NAME_REGEX.test(firstName) || !NAME_REGEX.test(lastName)) {
        return showAlert("Invalid Name", "Check name format.", "warning");
      }

      if (!PHONE_REGEX.test(phoneNumber)) {
        return showAlert("Invalid Phone", "Please enter a valid 11-digit phone number starting with 09 (e.g. 09171234567).", "warning");
      }

      if (role == null) {
        return showAlert("Missing Role", "Please select a role.", "warning");
      }

      if (!Object.values(Roles).includes(role)) {
        return showAlert("Invalid Role", "Role is invalid.", "error");
      }

      const payload = {
        firstName,
        lastName,
        phoneNumber,
        profilePictureUrl: profile.profilePictureUrl?.trim() || "",
      };

      const res = await updateProfile(payload);

      if (!res?.isSuccess) {
        return showAlert(
          "Update Failed",
          res?.message || "Try again later.",
          "error",
        );
      }

      router.replace("/(auth)/onboarding-role");
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || err?.message || "Unexpected error",
        "error",
      );
    }
  };

  const smartStudent = role === Roles.Student && user?.status !== 'Active' && ![4, '4', 'Done'].includes(user?.onboardingStep as any);
  const isSubmitting = useMemo(() => isLoading, [isLoading]);

  return (
    <AuthLayout
      background="bg-light-surface dark:bg-dark-surface"
      header={
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity
            onPress={async () => {
              await useAuthStore.getState().logout();
              router.replace("/(auth)/register");
            }}
          >
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>

          <Text className="text-[17px] font-bold flex-1 text-center text-light-text dark:text-dark-text">
            Profile Info
          </Text>

          <View style={{ width: 24 }} />
        </View>
      }
    >
      <View className="px-6 pt-4 pb-12 flex-1 gap-4">
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
        {smartStudent ? <CorStudentRegistrationStep onConfirmed={() => router.replace('/(auth)/onboarding-vehicle')} /> : role != null ? <>
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
          placeholder="09171234567"
          keyboardType="phone-pad"
          maxLength={11}
          value={profile.phoneNumber}
          onChangeText={(v) => setProfileField("phoneNumber", v.replace(/\D/g, "").slice(0, 11))}
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
        </> : null}
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
