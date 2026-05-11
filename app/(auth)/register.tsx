import { useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AppButton, AppInput, AppSelect } from "../../components/ui";
import type { SelectOption } from "../../components/ui/AppSelect";

const ROLE_OPTIONS: SelectOption[] = [
  { label: "Student", value: "student" },
  { label: "University Staff", value: "staff" },
  { label: "Non-Academic Personnel", value: "nonacademic" },
];

type Role = "student" | "staff" | "nonacademic" | "";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Credentials & Contact
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Personal Info & Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("");
  const [courseInfo, setCourseInfo] = useState(""); // Course, Year, Section
  const [office, setOffice] = useState(""); // Office / Department
  const [idNumber, setIdNumber] = useState(""); // Replaced file upload with string input

  // Step 3: Vehicle Info
  const [plateNumber, setPlateNumber] = useState("");
  const [brand, setBrand] = useState("");

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
            onChangeText={setEmail}
          />

          <AppInput 
            label="Contact Number" 
            placeholder="Enter Contact Number"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
          />

          <AppInput
            label="Password"
            placeholder="Enter Password"
            isPassword
            value={password}
            onChangeText={setPassword}
          />

          <AppInput
            label="Confirm Password"
            placeholder="Confirm Password"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <AppButton
            label="Next"
            variant="primary"
            size="lg"
            className="mt-4"
            onPress={() => setStep(2)}
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
            onChangeText={setFirstName}
          />

          <AppInput 
            label="Last Name" 
            placeholder="Enter Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

          <AppSelect
            label="Role"
            placeholder="Pick an Option"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(v) => setRole(v as Role)}
          />

          {role === "student" && (
            <AppInput
              label="Course, Year & Section"
              placeholder="e.g. BSCS 3A"
              value={courseInfo}
              onChangeText={setCourseInfo}
            />
          )}

          {(role === "staff" || role === "nonacademic") && (
            <AppInput
              label="Office / Department"
              placeholder="Enter Office / Department"
              value={office}
              onChangeText={setOffice}
            />
          )}

          {/* ID Number Input */}
          <AppInput
            label="ID Number"
            placeholder="Enter ID Number"
            value={idNumber}
            onChangeText={setIdNumber}
          />

          <AppButton
            label="Next"
            variant="primary"
            size="lg"
            className="mt-2"
            onPress={() => setStep(3)}
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
            onChangeText={setPlateNumber}
          />

          <AppInput 
            label="Motor Brand" 
            placeholder="e.g. Honda, Yamaha"
            value={brand}
            onChangeText={setBrand}
          />

          <AppButton
            label="Complete Registration"
            variant="primary"
            size="lg"
            className="mt-6"
            onPress={() => router.push("/(auth)/pending")}
          />
        </FormCard>
      )}
    </AuthLayout>
  );
}
