import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";
import { vehicleService } from "@/services/vehicle.service";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AlertCircle } from "lucide-react-native";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AppButton, AppInput, AppSelect } from "../../components/ui";
import { AlertModal } from "../../components/shared";
import type { SelectOption } from "../../components/ui/AppSelect";
import { useRegisterStore } from "../../store/useRegisterStore";
import { getErrorMessage } from "../../utils/errorCodes";
import { Roles } from "../../constants/roles";

const ROLE_OPTIONS: SelectOption[] = [
  { label: "Student", value: Roles.Student.toString() },
  { label: "University Staff", value: Roles.UniversityStaff.toString() },
  { label: "Non-Academic Personnel", value: Roles.NonAcademicPersonell.toString() },
];



export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  /* ── Modal state ────────────────────────────── */
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<"error" | "warning" | "info">("error");
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  /** Show the alert modal with the given configuration */
  const showAlert = (
    title: string,
    message: string,
    variant: "error" | "warning" | "info" = "error",
    icon?: React.ReactNode,
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVariant(variant);
    setModalIcon(icon ?? <AlertCircle size={28} color="#EF4444" strokeWidth={2} />);
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
    courseInfo,
    office,
    idNumber,

    plateNumber,
    brand,

    setField,
  } = useRegisterStore();

  const handleStepOne = () => {
    if (!email || !contactNumber || !password || !confirmPassword) {
      showAlert("Missing Information", "Please complete all fields.", "warning");
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
      showAlert("Missing Information", "Please complete all fields.", "warning");
      return;
    }

    if (role === Roles.Student && !courseInfo) {
      showAlert("Missing Information", "Course info is required for students.", "warning");
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

  const handleRegister = async () => {
    const state = useRegisterStore.getState();

    try {
      setLoading(true);

      // STEP 1: Create account
      const accountPayload = {
        email: state.email.trim(),
        phoneNumber: state.contactNumber.trim(),
        password: state.password,
        role: state.role as number
      };

      console.log("[Register] Step 1: Creating account for", accountPayload.email);
      const accountRes = await authService.register(accountPayload);

      if (!accountRes.isSuccess) {
        console.log("[Register] Account creation failed", accountRes);
        showAlert("Registration Failed", getErrorMessage(accountRes.errorCode || 0));
        return;
      }

      const userId = accountRes.data; // backend returns userId
      console.log("[Register] Step 1 Success. User ID:", userId);

      // STEP 2: Create profile
      const profilePayload = {
        userId,
        firstName: state.firstName.trim(),
        lastName: state.lastName.trim(),
        courseInfo: state.courseInfo.trim(),
        office: state.office.trim(),
        idNumber: state.idNumber.trim(),
      };

      console.log("[Register] Step 2: Creating profile");
      const profileRes = await profileService.createProfile(profilePayload);

      if (!profileRes.isSuccess) {
        console.log("[Register] Profile creation failed", profileRes);
        showAlert("Profile Error", getErrorMessage(profileRes.errorCode || 0));
        return;
      }

      console.log("[Register] Step 2 Success.");

      // STEP 3: Vehicle (optional if required)
      const vehiclePayload = {
        userId,
        plateNumber: state.plateNumber.trim(),
        brand: state.brand.trim(),
      };

      console.log("[Register] Step 3: Creating vehicle");
      const vehicleRes = await vehicleService.createVehicle(vehiclePayload);

      if (!vehicleRes.isSuccess) {
        console.log("[Register] Vehicle creation failed", vehicleRes);
        showAlert("Vehicle Error", getErrorMessage(vehicleRes.errorCode || 0));
        return;
      }

      console.log("[Register] Step 3 Success.");

      // DONE
      state.reset();
      router.replace("/(auth)/login");

    } catch (err: any) {
      console.log("[Register] CAUGHT ERROR:", err?.message);
      console.log("[Register] RESPONSE DATA:", err?.response?.data);

      const errorCode = err?.response?.data?.errorCode ?? 0;
      showAlert("Registration Failed", getErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <CompactHeader />

      {/* Step 1 — Credentials & Contact */}
      {step === 1 && (
        <FormCard
          title="Sign Up"
          back={{
            label: "Back to Sign In",
            onPress: () => router.back(),
          }}
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

      {/* Step 2 — Personal Info & Identity */}
      {step === 2 && (
        <FormCard
          title="Personal Info"
          back={{
            label: "Back",
            onPress: () => setStep(1),
          }}
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
            <AppInput
              label="Course, Year & Section"
              placeholder="e.g. BSCS 3A"
              value={courseInfo}
              onChangeText={(v) => setField("courseInfo", v)}
            />
          )}

          {(role === Roles.UniversityStaff || role === Roles.NonAcademicPersonell) && (
            <AppInput
              label="Office / Department"
              placeholder="Enter Office / Department"
              value={office}
              onChangeText={(v) => setField("office", v)}
            />
          )}

          {/* ID Number Input */}
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

      {/* Step 3 — Vehicle Info */}
      {step === 3 && (
        <FormCard
          title="Vehicle Details"
          back={{
            label: "Back",
            onPress: () => setStep(2),
          }}
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

      {/* ── Alert modal ─────────────────────────── */}
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
