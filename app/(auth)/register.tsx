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

  // Store keeps form data across screens; schedule page uses the same store.
  const {
    account,
    profile,
    vehicle,
    setAccountField,
    setProfileField,
    setVehicleField,
  } = useRegisterStore();

  const handleStepOne = () => {
    if (
      !account.email ||
      !account.phoneNumber ||
      !account.password ||
      !account.confirmPassword
    ) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
        "warning",
      );
      return;
    }
    if (account.password !== account.confirmPassword) {
      showAlert("Password Mismatch", "Passwords do not match.", "warning");
      return;
    }
    setStep(2);
  };

  const handleStepTwo = () => {
    if (
      !profile.firstName ||
      !profile.lastName ||
      account.role === null ||
      !profile.idCardNumber
    ) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
        "warning",
      );
      return;
    }
    if (
      account.role === Roles.Student &&
      (!profile.course || !profile.yearLevel || !profile.section)
    ) {
      showAlert(
        "Missing Information",
        "Course, Year, and Section are required.",
        "warning",
      );
      return;
    }
    if (
      (account.role === Roles.UniversityStaff ||
        account.role === Roles.NonAcademicPersonell) &&
      !profile.office
    ) {
      showAlert("Missing Information", "Office is required.", "warning");
      return;
    }
    setStep(3);
  };

  const handleStepThree = () => {
    if (!vehicle.plateNumber || !vehicle.brand) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
        "warning",
      );
      return;
    }
    // Step 4 lives in the Schedule screen and submits the single payload.
    router.replace("/(auth)/schedule");
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
            value={account.email}
            onChangeText={(v) => setAccountField("email", v)}
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
            options={ROLE_OPTIONS}
            value={account.role !== null ? account.role.toString() : ""}
            onChange={(v) => setAccountField("role", Number(v))}
          />

          {account.role === Roles.Student && (
            <>
              <AppInput
                label="Course"
                placeholder="e.g. BSCS"
                value={profile.course}
                onChangeText={(v) => setProfileField("course", v)}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Year"
                    placeholder="3"
                    keyboardType="numeric"
                    value={profile.yearLevel}
                    onChangeText={(v) => setProfileField("yearLevel", v)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Section"
                    placeholder="A"
                    value={profile.section}
                    onChangeText={(v) => setProfileField("section", v)}
                  />
                </View>
              </View>
            </>
          )}

          {(account.role === Roles.UniversityStaff ||
            account.role === Roles.NonAcademicPersonell) && (
            <AppInput
              label="Office / Department"
              placeholder="Enter Office / Department"
              value={profile.office}
              onChangeText={(v) => setProfileField("office", v)}
            />
          )}

          <AppInput
            label="ID Number"
            placeholder="Enter ID Number"
            value={profile.idCardNumber}
            onChangeText={(v) => setProfileField("idCardNumber", v)}
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
            value={vehicle.plateNumber}
            onChangeText={(v) => setVehicleField("plateNumber", v)}
          />
          <AppInput
            label="Motor Brand"
            placeholder="e.g. Honda, Yamaha"
            value={vehicle.brand}
            onChangeText={(v) => setVehicleField("brand", v)}
          />
          <AppButton
            label="Continue to Schedule"
            variant="primary"
            size="lg"
            className="mt-6"
            onPress={handleStepThree}
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
