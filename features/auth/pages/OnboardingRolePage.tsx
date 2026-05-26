import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import { Roles } from "@/constants/roles";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useApiMutation } from "@/hooks";
import { useRouter } from "expo-router";
import { AlertCircle, ChevronLeft } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

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
      console.log("⚠️ ROLE ALERT:", { title, message });

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

  const handleNext = async () => {
    try {
      console.log("🚀 ROLE ONBOARDING START");
      console.log("🎯 ROLE:", role);

      if (!role) {
        return showAlert("Missing Role", "Role is required.", "warning");
      }

      // =========================
      // STUDENT FLOW
      // =========================
      if (role === Roles.Student) {
        const studentNumber = student.studentNumber?.trim();
        const course = student.course?.trim();
        const section = student.section?.trim();
        const yearLevel = student.yearLevel;

        console.log("🎓 STUDENT DATA:", {
          studentNumber,
          course,
          section,
          yearLevel,
        });

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

        console.log("📥 STUDENT RESPONSE:", res);

        if (!res?.isSuccess) {
          return showAlert(
            "Student Failed",
            res?.message || "Request failed.",
            "error",
          );
        }
      }

      // =========================
      // PERSONNEL FLOW
      // =========================
      if (
        role === Roles.UniversityStaff ||
        role === Roles.NonAcademicPersonnel
      ) {
        const department = personnel.department?.trim();
        const idCardNumber = personnel.idCardNumber?.trim();

        console.log("🏢 PERSONNEL DATA:", {
          department,
          idCardNumber,
        });

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

        console.log("📥 PERSONNEL RESPONSE:", res);

        if (!res?.isSuccess) {
          return showAlert(
            "Personnel Failed",
            res?.message || "Request failed.",
            "error",
          );
        }
      }

      console.log("✅ ROLE ONBOARDING SUCCESS");

      router.replace("/(auth)/onboarding-vehicle");
    } catch (err: any) {
      console.error("❌ ROLE ONBOARDING ERROR:", err);

      console.log("🔍 STATUS:", err?.response?.status);
      console.log("🔍 DATA:", err?.response?.data);

      showAlert(
        "Error",
        err?.response?.data?.message || err?.message || "Unexpected error",
        "error",
      );
    }
  };

  const isLoading = studentLoading || personnelLoading;

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity onPress={() => router.back()}>
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
        {/* STUDENT */}
        {role === Roles.Student && (
          <>
            <AppInput
              label="Student Number"
              value={student.studentNumber}
              onChangeText={(v) => setStudentField("studentNumber", v)}
            />

            <AppInput
              label="Course"
              value={student.course}
              onChangeText={(v) => setStudentField("course", v)}
            />

            <AppInput
              label="Section"
              value={student.section}
              onChangeText={(v) => setStudentField("section", v)}
            />

            <AppInput
              label="Year Level"
              keyboardType="numeric"
              value={String(student.yearLevel || "")}
              onChangeText={(v) =>
                setStudentField("yearLevel", Number(v.replace(/[^0-9]/g, "")))
              }
            />
          </>
        )}

        {/* PERSONNEL */}
        {(role === Roles.UniversityStaff ||
          role === Roles.NonAcademicPersonnel) && (
          <>
            <AppInput
              label="Department"
              value={personnel.department}
              onChangeText={(v) => setPersonnelField("department", v)}
            />

            <AppInput
              label="ID Number"
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
