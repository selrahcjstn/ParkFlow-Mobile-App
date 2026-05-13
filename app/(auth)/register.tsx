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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{10,15}$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z' -]{1,49}$/;
const ID_REGEX = /^[A-Za-z0-9-]{4,32}$/;
const PLATE_REGEX = /^[A-Za-z0-9-]{4,12}$/;
const MIN_PASSWORD_LENGTH = 8;

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
    const idCardNumber = profile.idCardNumber.trim();
    const course = profile.course.trim();
    const yearLevel = profile.yearLevel.trim();
    const section = profile.section.trim();
    const office = profile.office.trim();

    if (!firstName || !lastName || account.role === null || !idCardNumber) {
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

    if (!ID_REGEX.test(idCardNumber)) {
      showAlert(
        "Invalid ID Number",
        "Use 4-32 characters (letters, numbers, or hyphens).",
        "warning",
      );
      return;
    }

    if (account.role === Roles.Student && (!course || !yearLevel || !section)) {
      showAlert(
        "Missing Information",
        "Course, Year, and Section are required.",
        "warning",
      );
      return;
    }

    if (account.role === Roles.Student) {
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
        showAlert(
          "Invalid Year",
          "Year level must be between 1 and 6.",
          "warning",
        );
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
      (account.role === Roles.UniversityStaff ||
        account.role === Roles.NonAcademicPersonell) &&
      !office
    ) {
      showAlert("Missing Information", "Office is required.", "warning");
      return;
    }
    if (
      (account.role === Roles.UniversityStaff ||
        account.role === Roles.NonAcademicPersonell) &&
      (office.length < 2 || office.length > 60)
    ) {
      showAlert(
        "Invalid Office",
        "Office/Department must be 2-60 characters.",
        "warning",
      );
      return;
    }
    setStep(3);
  };

  const handleStepThree = () => {
    const plateNumber = vehicle.plateNumber.trim().toUpperCase();
    const brand = vehicle.brand.trim();

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
