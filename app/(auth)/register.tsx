import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AppButton, AppInput, AppSelect, LinkText } from "../../components/ui";
import type { SelectOption } from "../../components/ui/AppSelect";

// The three roles a new user can pick from
const ROLE_OPTIONS: SelectOption[] = [
  { label: "Student", value: "student" },
  { label: "University Staff", value: "staff" },
  { label: "Non-Academic Personnel", value: "nonacademic" },
];

type Role = "student" | "staff" | "nonacademic" | "";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("");

  return (
    <AuthLayout>
      {/* Just the app name — keeps things compact so the form has room */}
      <CompactHeader />

      {/* Step 1 — account credentials + role */}
      {step === 1 && (
        <FormCard
          title="Sign Up"
          back={{
            label: "Back to Sign In",
            onPress: () => router.back(),
          }}
        >
          <AppInput label="MS Email" placeholder="Enter Email" />

          <AppInput
            label="Password"
            placeholder="Enter Password"
            isPassword
          />

          <AppInput
            label="Confirm Password"
            placeholder="Confirm Password"
            isPassword
          />

          {/* Role picker — drives which extra field appears below */}
          <AppSelect
            label="Role"
            placeholder="Pick an Option"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(v) => setRole(v as Role)}
          />

          {/* Students need their course/year/section */}
          {role === "student" && (
            <AppInput
              label="Course, Year & Section"
              placeholder="Course / Year / Section"
            />
          )}

          {/* Staff and non-academic need their office or department */}
          {(role === "staff" || role === "nonacademic") && (
            <AppInput
              label="Office / Department"
              placeholder="Office / Department Name"
            />
          )}

          <AppButton
            label="Next"
            variant="primary"
            size="lg"
            onPress={() => setStep(2)}
          />
        </FormCard>
      )}

      {/* Step 2 — vehicle and contact details */}
      {step === 2 && (
        <FormCard
          title="Sign Up"
          back={{
            label: "Back",
            onPress: () => setStep(1),
          }}
        >
          <AppInput label="Mobile Number" placeholder="Enter Mobile Number" />

          <AppInput
            label="Vehicle Plate Number"
            placeholder="Enter Vehicle Plate Number"
          />

          <AppInput label="ID" placeholder="Enter ID" />

          <AppInput label="Motor Brand" placeholder="e.g. Honda" />

          {/* This will submit the whole form eventually */}
          <AppButton label="Next" variant="primary" size="lg" />
        </FormCard>
      )}
    </AuthLayout>
  );
}
