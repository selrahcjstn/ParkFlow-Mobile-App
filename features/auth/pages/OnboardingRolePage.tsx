import { getRegistrationErrorMessage } from "@/utils/registrationError";
import { AlertModal } from "@/components/shared";
import { AppButton, AppInput, AppSelect } from "@/components/ui";
import { Roles } from "@/constants/roles";
import {
  YEAR_LEVEL_OPTIONS,
  COLLEGE_COURSE_OPTIONS,
  isJuniorHigh,
} from "@/constants/courses";
import { STUDENT_ID_REGEX } from "@/utils/registerValidation";
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

        if (!studentNumber) {
          return showAlert("Missing Student ID", "Student ID number is required.", "warning");
        }

        if (!STUDENT_ID_REGEX.test(studentNumber)) {
          return showAlert(
            "Invalid Student ID",
            "Student ID number must contain only digits and be between 7 and 10 digits long (e.g. 202600123).",
            "warning",
          );
        }

        if (!yearLevel) {
          return showAlert("Missing Year Level", "Please select a year level.", "warning");
        }

        if (!isJuniorHigh(yearLevel) && !course) {
          return showAlert("Missing Course", "Please select your course / program.", "warning");
        }

        if (!section) {
          return showAlert("Missing Section", "Section is required (e.g. 1A-G1).", "warning");
        }

        const res = await updateStudent({
          studentNumber,
          course: isJuniorHigh(yearLevel) ? "" : course,
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
          role: role === Roles.NonAcademicPersonnel ? "NonAcademicPersonnel" : "UniversityStaff",
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
        getRegistrationErrorMessage(err),
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
            <ChevronLeft size={24} color="#7B1113" />
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
            <AppSelect
              label="Year Level"
              placeholder="Select Year Level"
              options={YEAR_LEVEL_OPTIONS}
              value={student.yearLevel ? String(student.yearLevel) : undefined}
              onChange={(v) => {
                const parsed = Number(v);
                setStudentField("yearLevel", parsed);
                if (isJuniorHigh(parsed)) {
                  setStudentField("course", "");
                }
              }}
            />

            <AppInput
              label="Student ID number"
              placeholder="e.g. 202600123"
              keyboardType="numeric"
              maxLength={10}
              value={student.studentNumber}
              onChangeText={(v) =>
                setStudentField("studentNumber", v.replace(/\D/g, "").slice(0, 10))
              }
            />

            {!isJuniorHigh(student.yearLevel) && (
              <AppSelect
                label="Course / Program"
                placeholder="Select Course / Program"
                options={COLLEGE_COURSE_OPTIONS}
                value={student.course || undefined}
                onChange={(v) => setStudentField("course", v)}
              />
            )}

            <AppInput
              label="Section (e.g. 1A-G1)"
              placeholder="e.g. 1A-G1"
              value={student.section}
              onChangeText={(v) =>
                setStudentField(
                  "section",
                  v.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase().slice(0, 10),
                )
              }
            />
          </>
        )}

        {(role === Roles.UniversityStaff ||
          role === Roles.NonAcademicPersonnel) && (
          <>
            <AppInput
              label="Department"
              placeholder="e.g. College of Engineering"
              value={personnel.department}
              onChangeText={(v) => setPersonnelField("department", v)}
            />

            <AppInput
              label="Employee ID number"
              placeholder="e.g. EMP-00123"
              maxLength={50}
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
