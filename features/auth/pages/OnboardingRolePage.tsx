import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import { Roles } from "@/constants/roles";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useApiMutation } from "@/hooks";
import { useRouter } from "expo-router";
import { AlertCircle, ChevronLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingRolePage() {
  const router = useRouter();

  const { run: updateStudent, isLoading: studentLoading } = useApiMutation(
    onboardingService.updateStudent,
  );

  const { run: updatePersonnel, isLoading: personnelLoading } = useApiMutation(
    onboardingService.updatePersonnel,
  );

  const { role, student, personnel, setStudentField, setPersonnelField } =
    useOnboardingStore();

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

  // If user somehow lands here without a role selected, redirect to profile
  useEffect(() => {
    if (role == null) {
      router.replace("/(auth)/onboarding-profile");
    }
  }, [role, router]);

  const handleNext = async () => {
    try {
      if (!role) {
        return showAlert("Missing Role", "Role is required.", "warning");
      }

      if (role === Roles.Student) {
        const studentNumber = student.studentNumber?.trim();
        const course = student.course?.trim();
        const section = student.section?.trim();
        const yearLevel = student.yearLevel;

        if (!studentNumber || !course || !section || !yearLevel) {
          return showAlert(
            "Missing Fields",
            "Complete all student fields.",
            "warning",
          );
        }

        const res = await updateStudent({
          studentNumber,
          course,
          section,
          yearLevel: Number(yearLevel),
        });

        if (!res?.isSuccess) {
          return showAlert(
            "Submission Failed",
            res?.message || "Request failed.",
            "error",
          );
        }
      }

      if (
        role === Roles.UniversityStaff ||
        role === Roles.NonAcademicPersonnel
      ) {
        const department = personnel.department?.trim();
        const idCardNumber = personnel.idCardNumber?.trim();

        if (!department || !idCardNumber) {
          return showAlert(
            "Missing Fields",
            "Complete all personnel fields.",
            "warning",
          );
        }

        const res = await updatePersonnel({
          department,
          idCardNumber,
        });

        if (!res?.isSuccess) {
          return showAlert(
            "Submission Failed",
            res?.message || "Request failed.",
            "error",
          );
        }
      }

      router.replace("/(auth)/onboarding-vehicle");
    } catch (err: any) {
      showAlert(
        "Error",
        err?.response?.data?.message || err?.message || "Unexpected error",
        "error",
      );
    }
  };

  const isLoading = studentLoading || personnelLoading;

  if (role == null) {
    return null;
  }

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(auth)/login");
              }
            }}
          >
            <ChevronLeft size={24} color="#D22730" />
          </TouchableOpacity>

          <Text className="text-[17px] font-bold flex-1 text-center">
            Role Information
          </Text>

          <View style={{ width: 24 }} />
        </View>
      }
    >
      <View className="px-6 pt-4 pb-12 flex-1 gap-4">
        {role === Roles.Student && (
          <>
            <AppInput
              label="Client ID"
              value={student.studentNumber}
              onChangeText={(v) => setStudentField("studentNumber", v)}
            />

            <AppInput
              label="Course"
              value={student.course}
              onChangeText={(v) => setStudentField("course", v)}
            />

            <AppInput
              label="Section (Letters Only)"
              value={student.section}
              onChangeText={(v) => setStudentField("section", v.replace(/[^a-zA-Z]/g, "").toUpperCase())}
            />

            <AppInput
              label="Year Level (Grade 7-12 or 1-5th Year+)"
              keyboardType="numeric"
              value={String(student.yearLevel || "")}
              onChangeText={(v) =>
                setStudentField("yearLevel", Number(v.replace(/[^0-9]/g, "")))
              }
            />
          </>
        )}

        {(role === Roles.UniversityStaff ||
          role === Roles.NonAcademicPersonnel) && (
          <>
            <AppInput
              label="Department"
              value={personnel.department}
              onChangeText={(v) => setPersonnelField("department", v)}
            />

            <AppInput
              label="Client ID"
              value={personnel.idCardNumber}
              onChangeText={(v) => setPersonnelField("idCardNumber", v)}
            />
          </>
        )}

        <AppButton
          label="Continue"
          onPress={handleNext}
          loading={isLoading}
          disabled={isLoading}
          className="mt-6"
        />
      </View>

      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        icon={<AlertCircle size={28} color="#F59E0B" />}
      />
    </AuthLayout>
  );
}
