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
import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { run: updateProfile, isLoading: profileLoading } = useApiMutation(
    onboardingService.updateProfile,
  );
  const { run: updateStudent, isLoading: studentLoading } = useApiMutation(
    onboardingService.updateStudent,
  );
  const { run: updatePersonnel, isLoading: personnelLoading } = useApiMutation(
    onboardingService.updatePersonnel,
  );

  const {
    role,
    profile,
    student,
    personnel,
    setRole,
    setProfileField,
    setStudentField,
    setPersonnelField,
  } = useOnboardingStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<
    "error" | "warning" | "info"
  >("error");
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "error",
      icon?: React.ReactNode,
    ) => {
      setModalTitle(title);
      setModalMessage(message);
      setModalVariant(variant);
      setModalIcon(icon ?? <AlertCircle size={28} color="#F59E0B" />);
      setModalVisible(true);
    },
    [],
  );

  const handleNext = async () => {
    const phone = profile.phoneNumber.trim();
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();

    if (!phone || !firstName || !lastName) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
        "warning",
      );
      return;
    }

    if (!PHONE_REGEX.test(phone)) {
      showAlert(
        "Invalid Contact Number",
        "Use digits only, 10 to 15 characters.",
        "warning",
      );
      return;
    }

    if (!NAME_REGEX.test(firstName) || !NAME_REGEX.test(lastName)) {
      showAlert(
        "Invalid Name",
        "Use letters, spaces, apostrophes, or hyphens only.",
        "warning",
      );
      return;
    }

    if (!role) {
      showAlert("Missing Role", "Please select your role.", "warning");
      return;
    }

    try {
      const profileResponse = await updateProfile({
        phoneNumber: phone,
        firstName,
        lastName,
        profilePictureUrl: profile.profilePictureUrl.trim(),
      });

      if (!profileResponse?.isSuccess) {
        showAlert(
          "Profile Update Failed",
          profileResponse?.message || "Please try again.",
          "error",
        );
        return;
      }

      if (role === Roles.Student) {
        const course = student.course.trim();
        const section = student.section.trim();
        const yearLevel = student.yearLevel;
        const studentNumber = student.studentNumber.trim();

        if (!studentNumber || !course || !section || !yearLevel) {
          showAlert(
            "Missing Information",
            "Complete all student fields.",
            "warning",
          );
          return;
        }

        const response = await updateStudent({
          studentNumber,
          course,
          section,
          yearLevel: Number(yearLevel),
        });

        if (!response?.isSuccess) {
          showAlert(
            "Student Update Failed",
            response?.message || "Please try again.",
            "error",
          );
          return;
        }
      }

      if (
        role === Roles.UniversityStaff ||
        role === Roles.NonAcademicPersonnel
      ) {
        const department = personnel.department.trim();
        const idCardNumber = personnel.idCardNumber.trim();

        if (!department || !idCardNumber) {
          showAlert(
            "Missing Information",
            "Complete all personnel fields.",
            "warning",
          );
          return;
        }

        const response = await updatePersonnel({
          department,
          idCardNumber,
        });

        if (!response?.isSuccess) {
          showAlert(
            "Personnel Update Failed",
            response?.message || "Please try again.",
            "error",
          );
          return;
        }
      }

      router.replace("/(auth)/onboarding-vehicle");
    } catch (error) {
      showAlert("Update Failed", "Please try again.", "error");
    }
  };

  const isSubmitting = profileLoading || studentLoading || personnelLoading;

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        <View className="flex-row items-center justify-between px-4 py-2 bg-light-surface">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
          >
            <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            className="text-light-text text-[17px] font-black text-center flex-1"
          >
            Profile Info
          </Text>

          <View className="w-10" />
        </View>
      }
    >
      <View className="flex-1 bg-light-surface px-6 pt-4 pb-12">
        <Text className="text-light-muted font-regular text-[13px] mb-6">
          Tell us a bit about yourself to complete onboarding.
        </Text>

        <AppInput
          label="Contact Number"
          placeholder="Enter Contact Number"
          keyboardType="phone-pad"
          value={profile.phoneNumber}
          onChangeText={(v) => setProfileField("phoneNumber", v)}
        />
        <AppInput
          label="First Name"
          placeholder="Enter First Name"
          value={profile.firstName}
          onChangeText={(v) => setProfileField("firstName", v)}
        />
        <AppInput
          label="Last Name"
          placeholder="Enter Last Name"
          value={profile.lastName}
          onChangeText={(v) => setProfileField("lastName", v)}
        />

        <AppSelect
          label="Role"
          placeholder="Pick an Option"
          options={REGISTER_ROLE_OPTIONS}
          value={role !== null ? role.toString() : undefined}
          onChange={(v) => setRole(Number(v) as Roles)}
        />

        {role === Roles.Student && (
          <>
            <AppInput
              label="Course"
              placeholder="e.g. BSCS"
              value={student.course}
              onChangeText={(v) => setStudentField("course", v)}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Year"
                  placeholder="3"
                  keyboardType="numeric"
                  value={student.yearLevel ? String(student.yearLevel) : ""}
                  onChangeText={(v) =>
                    setStudentField(
                      "yearLevel",
                      v === "" ? 0 : Number(v.replace(/[^0-9]/g, "")),
                    )
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Section"
                  placeholder="A"
                  value={student.section}
                  onChangeText={(v) => setStudentField("section", v)}
                />
              </View>
            </View>
            <AppInput
              label="Student Number"
              placeholder="Enter Student Number"
              value={student.studentNumber}
              onChangeText={(v) => setStudentField("studentNumber", v)}
            />
          </>
        )}

        {(role === Roles.UniversityStaff ||
          role === Roles.NonAcademicPersonnel) && (
          <>
            <AppInput
              label="Office / Department"
              placeholder="Enter Office / Department"
              value={personnel.department}
              onChangeText={(v) => setPersonnelField("department", v)}
            />
            <AppInput
              label="Employee / ID Number"
              placeholder="Enter Employee ID"
              value={personnel.idCardNumber}
              onChangeText={(v) => setPersonnelField("idCardNumber", v)}
            />
          </>
        )}

        <AppButton
          label="Continue"
          variant="primary"
          size="lg"
          className="mt-6"
          onPress={handleNext}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>

      <AlertModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        message={modalMessage}
        variant={modalVariant}
        icon={modalIcon}
      />
    </AuthLayout>
  );
}
