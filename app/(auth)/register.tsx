import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";
import { vehicleService } from "@/services/vehicle.service";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AppButton, AppInput, AppSelect } from "../../components/ui";
import type { SelectOption } from "../../components/ui/AppSelect";
import { useRegisterStore } from "../../store/useRegisterStore";


const ROLE_OPTIONS: SelectOption[] = [
  { label: "Student", value: "student" },
  { label: "University Staff", value: "staff" },
  { label: "Non-Academic Personnel", value: "nonacademic" },
];

type Role = "student" | "staff" | "nonacademic" | "";



export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

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
      alert("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setStep(2);
  };

  const handleStepTwo = () => {
    if (!firstName || !lastName || !role || !idNumber) {
      alert("Please complete all fields.");
      return;
    }

    if (role === "student" && !courseInfo) {
      alert("Course info is required.");
      return;
    }

    if (
      (role === "staff" || role === "nonacademic") &&
      !office
    ) {
      alert("Office is required.");
      return;
    }

    setStep(3);
  };

  const handleRegister = async () => {
    const state = useRegisterStore.getState();

    try {
      // STEP 1: Create account
      const accountPayload = {
        email: state.email,
        contactNumber: state.contactNumber,
        password: state.password,
      };

      const accountRes = await authService.register(accountPayload);

      if (!accountRes.isSuccess) {
        alert("Account creation failed");
        return;
      }

      const userId = accountRes.data; // backend returns userId

      // STEP 2: Create profile
      const profilePayload = {
        userId,
        firstName: state.firstName,
        lastName: state.lastName,
        role: state.role,
        courseInfo: state.courseInfo,
        office: state.office,
        idNumber: state.idNumber,
      };

      const profileRes = await profileService.createProfile(profilePayload);

      if (!profileRes.isSuccess) {
        alert("Profile creation failed");
        return;
      }

      // STEP 3: Vehicle (optional if required)
      const vehiclePayload = {
        userId,
        plateNumber: state.plateNumber,
        brand: state.brand,
      };

      const vehicleRes = await vehicleService.createVehicle(vehiclePayload);

      if (!vehicleRes.isSuccess) {
        alert("Vehicle creation failed");
        return;
      }

      // DONE
      state.reset();
      router.replace("/(auth)/login");

    } catch (err) {
      console.log("REGISTER ERROR:", err);
      alert("Something went wrong");
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
            value={role}
            onChange={(v) => setField("role", v as Role)}
          />

          {role === "student" && (
            <AppInput
              label="Course, Year & Section"
              placeholder="e.g. BSCS 3A"
              value={courseInfo}
              onChangeText={(v) => setField("courseInfo", v)}
            />
          )}

          {(role === "staff" || role === "nonacademic") && (
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
            onPress={handleRegister}
          />
        </FormCard>
      )}
    </AuthLayout>
  );
}
