import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";
import { vehicleService } from "@/services/vehicle.service";
import { useRouter } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AlertModal } from "../../components/shared";
import { AppButton, AppInput, AppSelect } from "../../components/ui";
import type { SelectOption } from "../../components/ui/AppSelect";
import { Roles } from "../../constants/roles";
import { useRegisterStore } from "../../store/useRegisterStore";
import { getErrorMessage } from "../../utils/errorCodes";

const ROLE_OPTIONS: SelectOption[] = [
  { label: "Student", value: Roles.Student.toString() },
  { label: "University Staff", value: Roles.UniversityStaff.toString() },
  {
    label: "Non-Academic Personnel",
    value: Roles.NonAcademicPersonell.toString(),
  },
];

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<
    "error" | "warning" | "info"
  >("error");
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  const showAlert = (
    title: string,
    message: string,
    variant: "error" | "warning" | "info" = "error",
    icon?: React.ReactNode,
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVariant(variant);
    setModalIcon(
      icon ?? <AlertCircle size={28} color="#EF4444" strokeWidth={2} />,
    );
    setModalVisible(true);
  };

  const {
    email,
    contactNumber,
    password,
    confirmPassword,
    firstName,
    lastName,
    role,
    course,
    yearLevel,
    section,
    office,
    idNumber,
    plateNumber,
    brand,
    setField,
  } = useRegisterStore();

  const handleStepOne = () => {
    if (!email || !contactNumber || !password || !confirmPassword) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
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
    if (!firstName || !lastName || role === null || !idNumber) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
        "warning",
      );
      return;
    }
    if (role === Roles.Student && (!course || !yearLevel || !section)) {
      showAlert(
        "Missing Information",
        "Course, Year, and Section are required.",
        "warning",
      );
      return;
    }
    if (
      (role === Roles.UniversityStaff || role === Roles.NonAcademicPersonell) &&
      !office
    ) {
      showAlert("Missing Information", "Office is required.", "warning");
      return;
    }
    setStep(3);
  };

  const buildAccountPayload = (
    state: ReturnType<typeof useRegisterStore.getState>,
  ) => ({
    email: state.email.trim(),
    phoneNumber: state.contactNumber.trim(),
    password: state.password,
    role: Number(state.role),
  });

  const buildProfilePayload = (
    state: ReturnType<typeof useRegisterStore.getState>,
    userId: string,
  ) => ({
    userId,
    firstName: state.firstName.trim(),
    lastName: state.lastName.trim(),
    idCardNumber: state.idNumber.trim(),
    ...(state.role === Roles.Student
      ? {
          course: state.course.trim(),
          yearLevel: Number(state.yearLevel),
          section: state.section.trim(),
        }
      : {}),
    ...(state.role === Roles.UniversityStaff ||
    state.role === Roles.NonAcademicPersonell
      ? { office: state.office.trim() }
      : {}),
  });

  const buildVehiclePayload = (
    state: ReturnType<typeof useRegisterStore.getState>,
    userId: string,
  ) => ({
    ownerId: String(userId),
    plateNumber: state.plateNumber.trim().toUpperCase(),
    brand: state.brand.trim(),
  });

  const handleRegister = async () => {
    const state = useRegisterStore.getState();

    try {
      setLoading(true);

      /* ─────────────────────────────
         STEP 1: CREATE ACCOUNT
      ───────────────────────────── */
      const accountRes = await authService.register(buildAccountPayload(state));

      if (!accountRes.isSuccess || !accountRes.data) {
        showAlert(
          "Registration Failed",
          getErrorMessage(accountRes.errorCode || 0),
        );
        return;
      }

      const userId = (accountRes.data as any)?.data ?? accountRes.data;

      if (!userId) {
        showAlert("Error", "User ID is missing after account creation.");
        return;
      }

      /* ─────────────────────────────
         STEP 1.5: AUTHENTICATE
         Ensures protected endpoints have a token
      ───────────────────────────── */
      const loginRes = await authService.login(
        state.email.trim(),
        state.password,
      );

      if (!loginRes.isSuccess || !loginRes.data) {
        showAlert(
          "Authentication Failed",
          getErrorMessage(loginRes.errorCode || 0),
        );
        return;
      }

      /* ─────────────────────────────
         STEP 2: CREATE PROFILE
      ───────────────────────────── */
      const profileRes = await profileService.createProfile(
        buildProfilePayload(state, userId),
      );

      if (!profileRes.isSuccess) {
        showAlert("Profile Error", getErrorMessage(profileRes.errorCode || 0));
        return;
      }

      /* ─────────────────────────────
         STEP 3: VEHICLE (DEBUG HERE)
      ───────────────────────────── */
      const vehicleRes = await vehicleService.createVehicle(
        buildVehiclePayload(state, userId),
      );

      if (!vehicleRes.isSuccess) {
        showAlert("Vehicle Error", getErrorMessage(vehicleRes.errorCode || 0));
        return;
      }

      /* ─────────────────────────────
         SUCCESS FLOW
      ───────────────────────────── */
      state.reset();
      router.replace("/(auth)/pending");
    } catch (err: any) {
      const errorCode = err?.response?.data?.errorCode ?? 0;

      const message =
        err?.response?.data?.message ||
        getErrorMessage(errorCode) ||
        "Registration failed.";

      showAlert("Registration Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <CompactHeader />

      {step === 1 && (
        <FormCard
          title="Sign Up"
          back={{ label: "Back to Sign In", onPress: () => router.back() }}
        >
          <AppInput
            label="Email"
            placeholder="Enter Email"
            value={email}
            onChangeText={(v) => setField("email", v)}
          />
          <AppInput
            label="Contact Number"
            placeholder="Enter Contact Number"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={(v) => setField("contactNumber", v)}
          />
          <AppInput
            label="Password"
            placeholder="Enter Password"
            isPassword
            value={password}
            onChangeText={(v) => setField("password", v)}
          />
          <AppInput
            label="Confirm Password"
            placeholder="Confirm Password"
            isPassword
            value={confirmPassword}
            onChangeText={(v) => setField("confirmPassword", v)}
          />
          <AppButton
            label="Next"
            variant="primary"
            size="lg"
            className="mt-4"
            onPress={handleStepOne}
          />
        </FormCard>
      )}

      {step === 2 && (
        <FormCard
          title="Personal Info"
          back={{ label: "Back", onPress: () => setStep(1) }}
        >
          <AppInput
            label="First Name"
            placeholder="Enter First Name"
            value={firstName}
            onChangeText={(v) => setField("firstName", v)}
          />
          <AppInput
            label="Last Name"
            placeholder="Enter Last Name"
            value={lastName}
            onChangeText={(v) => setField("lastName", v)}
          />
          <AppSelect
            label="Role"
            placeholder="Pick an Option"
            options={ROLE_OPTIONS}
            value={role !== null ? role.toString() : ""}
            onChange={(v) => setField("role", Number(v))}
          />

          {role === Roles.Student && (
            <>
              <AppInput
                label="Course"
                placeholder="e.g. BSCS"
                value={course}
                onChangeText={(v) => setField("course", v)}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Year"
                    placeholder="3"
                    keyboardType="numeric"
                    value={yearLevel}
                    onChangeText={(v) => setField("yearLevel", v)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Section"
                    placeholder="A"
                    value={section}
                    onChangeText={(v) => setField("section", v)}
                  />
                </View>
              </View>
            </>
          )}

          {(role === Roles.UniversityStaff ||
            role === Roles.NonAcademicPersonell) && (
            <AppInput
              label="Office / Department"
              placeholder="Enter Office / Department"
              value={office}
              onChangeText={(v) => setField("office", v)}
            />
          )}

          <AppInput
            label="ID Number"
            placeholder="Enter ID Number"
            value={idNumber}
            onChangeText={(v) => setField("idNumber", v)}
          />
          <AppButton
            label="Next"
            variant="primary"
            size="lg"
            className="mt-2"
            onPress={handleStepTwo}
          />
        </FormCard>
      )}

      {step === 3 && (
        <FormCard
          title="Vehicle Details"
          back={{ label: "Back", onPress: () => setStep(2) }}
        >
          <AppInput
            label="Vehicle Plate Number"
            placeholder="Enter Plate Number"
            value={plateNumber}
            onChangeText={(v) => setField("plateNumber", v)}
          />
          <AppInput
            label="Motor Brand"
            placeholder="e.g. Honda, Yamaha"
            value={brand}
            onChangeText={(v) => setField("brand", v)}
          />
          <AppButton
            label="Complete Registration"
            variant="primary"
            size="lg"
            className="mt-6"
            loading={loading}
            onPress={handleRegister}
          />
        </FormCard>
      )}

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
