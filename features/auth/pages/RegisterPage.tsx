import { AlertModal } from "@/components/shared";
import { AppButton, AppInput, AppSelect } from "@/components/ui";
import StepIndicator from "@/components/ui/StepIndicator";
import { Body, Title } from "@/components/ui/Typography";
import { REGISTER_ROLE_OPTIONS } from "@/constants/registerRoleOptions";
import { Roles } from "@/constants/roles";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { useRegisterStore } from "@/features/auth/store/register.store";
import {
    EMAIL_REGEX,
    MIN_PASSWORD_LENGTH,
    NAME_REGEX,
    PHONE_REGEX,
    PLATE_REGEX,
} from "@/utils/registerValidation";
import { useRouter } from "expo-router";
import { AlertCircle, ChevronLeft } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { TouchableOpacity, View } from "react-native";

const STEPS = [
  {
    label: "Account",
    description: "Set up your login credentials and contact information",
  },
  {
    label: "Profile",
    description: "Tell us about yourself and your role at the university",
  },
  {
    label: "Vehicle",
    description: "Register the vehicle you will be parking on premises",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
      setModalIcon(
        icon ?? <AlertCircle size={28} color="#F59E0B" strokeWidth={2} />,
      );
      setModalVisible(true);
    },
    [],
  );

  const {
    account,
    profile,
    vehicle,
    student,
    personnel,
    selectedRole,
    setSelectedRole,
    setAccountField,
    setProfileField,
    setVehicleField,
    setStudentField,
    setPersonnelField,
  } = useRegisterStore();

  const handleStepOne = () => {
    const email = account.email.trim();
    const phone = account.phoneNumber.trim();
    const password = account.password;
    const confirmPassword = account.confirmPassword;

    if (!email || !phone || !password.trim() || !confirmPassword.trim()) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
        "warning",
      );
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      showAlert("Invalid Email", "Please enter a valid email.", "warning");
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

    if (password !== password.trim()) {
      showAlert(
        "Invalid Password",
        "Password cannot start or end with spaces.",
        "warning",
      );
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      showAlert(
        "Password Too Short",
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        "warning",
      );
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      showAlert(
        "Weak Password",
        "Include at least one letter and one number.",
        "warning",
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Password Mismatch", "Passwords do not match.", "warning");
      return;
    }

    setStep(2);
  };

  const handleStepTwo = () => {
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();

    if (!firstName || !lastName) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
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

    if (selectedRole === Roles.Student) {
      const course = student?.course?.trim();
      const yearLevel = student?.yearLevel;
      const section = student?.section?.trim();
      const studentNumber = student?.studentNumber?.trim();

      if (!studentNumber) {
        showAlert("Missing Student Number", "Required field.", "warning");
        return;
      }

      if (!course || !yearLevel || !section) {
        showAlert(
          "Missing Information",
          "Course, Year, and Section are required.",
          "warning",
        );
        return;
      }

      const yearNumber = Number(yearLevel);

      if (course.length < 2 || course.length > 30) {
        showAlert(
          "Invalid Course",
          "Course must be 2-30 characters.",
          "warning",
        );
        return;
      }

      if (!Number.isFinite(yearNumber) || yearNumber < 1 || yearNumber > 6) {
        showAlert("Invalid Year", "Year level must be 1-6.", "warning");
        return;
      }

      if (section.length < 1 || section.length > 10) {
        showAlert(
          "Invalid Section",
          "Section must be 1-10 characters.",
          "warning",
        );
        return;
      }
    }

    if (
      selectedRole === Roles.UniversityStaff ||
      selectedRole === Roles.NonAcademicPersonnel
    ) {
      const department = personnel?.department?.trim();
      const idCardNumber = personnel?.idCardNumber?.trim();

      if (!department || !idCardNumber) {
        showAlert(
          "Missing Information",
          "Department and ID are required.",
          "warning",
        );
        return;
      }

      if (department.length < 2 || department.length > 60) {
        showAlert("Invalid Department", "Must be 2–60 characters.", "warning");
        return;
      }
    }

    setStep(3);
  };

  const handleStepThree = () => {
    const plateNumber = vehicle?.plateNumber.trim().toUpperCase();
    const brand = vehicle?.brand.trim();

    if (!plateNumber || !brand) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
        "warning",
      );
      return;
    }

    if (!PLATE_REGEX.test(plateNumber)) {
      showAlert(
        "Invalid Plate Number",
        "Use 4-12 characters (letters, numbers, or hyphens).",
        "warning",
      );
      return;
    }

    if (brand.length < 2 || brand.length > 30) {
      showAlert(
        "Invalid Motor Brand",
        "Brand must be 2-30 characters.",
        "warning",
      );
      return;
    }

    router.replace("/(auth)/schedule");
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((step - 1) as 1 | 2);
    }
  };

  const stepTitles: Record<number, string> = {
    1: "Create Account",
    2: "Personal Info",
    3: "Vehicle Details",
  };

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        <View className="bg-light-surface">
          {/* Pure white clean top bar with back button and centered title */}
          <View className="flex-row items-center justify-between px-4 py-2 bg-light-surface">
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
            >
              <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Centered Step Label */}
            <Title
              numberOfLines={1}
              className="text-light-text text-[17px] font-heavy text-center flex-1"
            >
              {stepTitles[step]}
            </Title>

            {/* Empty balancing spacer */}
            <View className="w-10" />
          </View>

          {/* Step Indicator on flat pure white */}
          <View className="bg-light-surface pt-4">
            <StepIndicator currentStep={step} steps={STEPS} />
          </View>
        </View>
      }
    >
      {/* Form Area directly on pure white canvas (no FormCard curves) */}
      <View className="flex-1 bg-light-surface px-6 pt-4 pb-12">
        {/* Step 1: Account Credentials */}
        {step === 1 && (
          <>
            <AppInput
              label="Email"
              placeholder="Enter Email"
              value={account.email}
              onChangeText={(v) => setAccountField("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AppInput
              label="Contact Number"
              placeholder="Enter Contact Number"
              keyboardType="phone-pad"
              value={account.phoneNumber}
              onChangeText={(v) => setAccountField("phoneNumber", v)}
            />
            <AppInput
              label="Password"
              placeholder="Enter Password"
              isPassword
              value={account.password}
              onChangeText={(v) => setAccountField("password", v)}
            />
            <AppInput
              label="Confirm Password"
              placeholder="Confirm Password"
              isPassword
              value={account.confirmPassword}
              onChangeText={(v) => setAccountField("confirmPassword", v)}
            />
            <AppButton
              label="Continue"
              variant="primary"
              size="lg"
              className="mt-6"
              onPress={handleStepOne}
            />
          </>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <>
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
              value={
                selectedRole !== null ? selectedRole.toString() : undefined
              }
              onChange={(v) => setSelectedRole(Number(v) as Roles)}
            />

            {selectedRole === Roles.Student && (
              <>
                <AppInput
                  label="Course"
                  placeholder="e.g. BSCS"
                  value={student?.course}
                  onChangeText={(v) => setStudentField("course", v)}
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label="Year"
                      placeholder="3"
                      keyboardType="numeric"
                      value={
                        student?.yearLevel ? String(student.yearLevel) : ""
                      }
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
                      value={student?.section}
                      onChangeText={(v) => setStudentField("section", v)}
                    />
                  </View>
                </View>
                <AppInput
                  label="Student Number"
                  placeholder="Enter Student Number"
                  value={student?.studentNumber}
                  onChangeText={(v) => setStudentField("studentNumber", v)}
                />
              </>
            )}

            {(selectedRole === Roles.UniversityStaff ||
              selectedRole === Roles.NonAcademicPersonnel) && (
              <>
                <AppInput
                  label="Office / Department"
                  placeholder="Enter Office / Department"
                  value={personnel?.department}
                  onChangeText={(v) => setPersonnelField("department", v)}
                />
                <AppInput
                  label="Employee / ID Number"
                  placeholder="Enter Employee ID"
                  value={personnel?.idCardNumber}
                  onChangeText={(v) => setPersonnelField("idCardNumber", v)}
                />
              </>
            )}

            <AppButton
              label="Continue"
              variant="primary"
              size="lg"
              className="mt-6"
              onPress={handleStepTwo}
            />
          </>
        )}

        {/* Step 3: Vehicle Details */}
        {step === 3 && (
          <>
            <AppInput
              label="Vehicle Plate Number"
              placeholder="Enter Plate Number"
              value={vehicle.plateNumber}
              onChangeText={(v) => setVehicleField("plateNumber", v)}
            />
            <AppInput
              label="Motor Brand"
              placeholder="e.g. Honda, Yamaha"
              value={vehicle.brand}
              onChangeText={(v) => setVehicleField("brand", v)}
            />
            <AppSelect
              label="Vehicle Type"
              placeholder="Pick a Vehicle Type"
              options={VEHICLE_TYPE_OPTIONS}
              value={vehicle.vehicleType.toString()}
              onChange={(v) => setVehicleField("vehicleType", Number(v))}
            />
            <AppButton
              label="Continue to Schedule"
              variant="primary"
              size="lg"
              className="mt-8"
              onPress={handleStepThree}
            />
          </>
        )}

        {/* Bottom link back to login */}
        {step === 1 && (
          <View className="flex-row justify-center items-center mt-6">
            <Body className="text-light-muted font-book text-[13px]">
              Already have an account?{" "}
            </Body>
            <TouchableOpacity onPress={() => router.back()}>
              <Body className="text-light-primary font-heavy text-[13px]">
                Sign In
              </Body>
            </TouchableOpacity>
          </View>
        )}
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
