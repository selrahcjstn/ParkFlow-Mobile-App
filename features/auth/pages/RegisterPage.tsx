import { AlertModal } from "@/components/shared";
import { AppButton, AppInput, AppSelect } from "@/components/ui";
import AuthHeader from "@/features/auth/components/AuthHeader";
import AuthLayout from "@/features/auth/components/AuthLayout";
import FormCard from "@/features/auth/components/FormCard";
import EmailVerificationView from "@/features/auth/components/EmailVerificationView";
import { authService } from "@/features/auth/services/auth.service";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useApiMutation } from "@/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import AppHeader from "@/components/layouts/AppHeader";
import {
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  NAME_REGEX,
  PHONE_REGEX,
  PLATE_REGEX,
} from "@/utils/registerValidation";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  FileText,
  UploadCloud,
  X,
  LogOut,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated as RNAnimated,
  Platform,
  ScrollView,
} from "react-native";
import Animated, { FadeIn, FadeOut, Keyframe, Easing } from "react-native-reanimated";

const smoothEntering = new Keyframe({
  from: {
    opacity: 0,
    transform: [{ translateY: 15 }],
  },
  to: {
    opacity: 1,
    transform: [{ translateY: 0 }],
    easing: Easing.out(Easing.quad),
  },
}).duration(850);
import StepIndicator from "@/components/ui/StepIndicator";
import { REGISTER_ROLE_OPTIONS } from "@/constants/registerRoleOptions";
import { Roles } from "@/constants/roles";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import ScheduleDayRow from "@/components/ui/ScheduleDayRow";
import { SCHEDULE_DAYS } from "@/constants/scheduleDays";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";

type RegisterStep =
  | "initializing"
  | "signup"
  | "otp"
  | "profile"
  | "role"
  | "vehicle"
  | "schedule";

const onboardingSteps = [
  { label: "Profile", description: "Set up your personal profile details" },
  { label: "Role Details", description: "Provide details specific to your role at BulsU" },
  { label: "Vehicle", description: "Register the vehicle you will be parking" },
  { label: "Schedule & ID", description: "Set your campus schedule and verify identity" },
];

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}

function parseTime(value?: string): Date | null {
  if (!value) return null;
  const [time, ampm] = value.split(" ");
  if (!time || !ampm) return null;
  let [hours, minutes] = time.split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default function RegisterPage() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  
  // Stores
  const { setToken, loadUser, token, logout } = useAuthStore();
  const {
    role,
    profile,
    student,
    personnel,
    vehicle,
    setRole,
    setProfileField,
    setStudentField,
    setPersonnelField,
    setVehicleField,
    reset: resetOnboarding,
  } = useOnboardingStore();

  // Mutations
  const { run: register, isLoading: isRegistering } = useApiMutation(authService.register);
  const { run: updateProfile, isLoading: isUpdatingProfile } = useApiMutation(onboardingService.updateProfile);
  const { run: updateStudent, isLoading: isUpdatingStudent } = useApiMutation(onboardingService.updateStudent);
  const { run: updatePersonnel, isLoading: isUpdatingPersonnel } = useApiMutation(onboardingService.updatePersonnel);
  const { run: updateVehicle, isLoading: isUpdatingVehicle } = useApiMutation(onboardingService.updateVehicle);

  // Layout step state
  const [step, setStep] = useState<RegisterStep>("initializing");

  // Signup fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  // Schedule step fields
  const [schedule, setSchedule] = useState<Record<string, { start?: string; end?: string }>>(() =>
    Object.fromEntries(SCHEDULE_DAYS.map((d) => [d.shortLabel, {}])) as any
  );
  const [pickerTarget, setPickerTarget] = useState<null | { day: string; field: "start" | "end" }>(null);
  const [draftTime, setDraftTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const slideAnim = useRef(new RNAnimated.Value(300)).current;
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Common Modal
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "info",
  });

  const showAlert = useCallback(
    (title: string, message: string, variant: "error" | "warning" | "info" = "error") => {
      setModal({ visible: true, title, message, variant });
    },
    []
  );

  // Determine current step number for the StepIndicator
  const getStepNumber = () => {
    switch (step) {
      case "profile": return 1;
      case "role": return 2;
      case "vehicle": return 3;
      case "schedule": return 4;
      default: return 1;
    }
  };

  // 1. Initial status check on mount
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const SecureStore = require("expo-secure-store");
        const savedToken = await SecureStore.getItemAsync("token");
        if (savedToken) {
          setToken(savedToken);
          const result = await loadUser();
          if (result.success) {
            router.replace("/");
          } else if (result.currentOnboardingStep) {
            setStep(result.currentOnboardingStep as RegisterStep);
          } else {
            setStep("profile");
          }
        } else {
          setStep("signup");
        }
      } catch (err) {
        setStep("signup");
      }
    };
    checkUserStatus();
  }, [loadUser, setToken, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  // Handle signup OTP triggering
  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      showAlert("Missing Information", "Please complete all fields.", "warning");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      showAlert("Invalid Email", "Please enter a valid email.", "warning");
      return;
    }

    if (password !== trimmedPassword) {
      showAlert("Invalid Password", "Password cannot start or end with spaces.", "warning");
      return;
    }

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      showAlert("Password Too Short", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, "warning");
      return;
    }

    if (!/[A-Za-z]/.test(trimmedPassword) || !/\d/.test(trimmedPassword)) {
      showAlert("Weak Password", "Include at least one letter and one number.", "warning");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      showAlert("Password Mismatch", "Passwords do not match.", "warning");
      return;
    }

    setSendingOtp(true);
    try {
      const otpRes = await authService.sendEmailOtp(trimmedEmail);
      if (otpRes?.isSuccess) {
        setStep("otp");
      } else {
        showAlert(
          "Registration Blocked",
          otpRes?.message || "This email is already in use or cannot receive verification codes.",
          "error"
        );
      }
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to verify email uniqueness. Please try again.";
      showAlert("Registration Blocked", backendMessage, "error");
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle OTP success
  const handleOtpVerifiedSuccess = async () => {
    try {
      const response = await register({
        email: email.trim(),
        password: password.trim(),
      });

      if (!response?.isSuccess) {
        showAlert("Registration Failed", response?.message || "Please try again.", "error");
        return;
      }

      const tokenVal = response?.data as unknown as string;
      if (tokenVal) {
        const SecureStore = require("expo-secure-store");
        setToken(tokenVal);
        await SecureStore.setItemAsync("token", tokenVal);
      }

      resetOnboarding();
      setStep("profile");
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message || error?.message || "Please try again.";
      showAlert("Registration Failed", backendMessage, "error");
    }
  };

  // Step 1: Profile Info submission
  const handleProfileNext = async () => {
    try {
      const firstName = profile.firstName?.trim();
      const middleName = profile.middleName?.trim();
      const lastName = profile.lastName?.trim();
      const phoneNumber = profile.phoneNumber?.trim();

      if (!firstName || !lastName || !phoneNumber) {
        return showAlert("Missing Info", "First name, last name, and phone number are required.", "warning");
      }

      if (!NAME_REGEX.test(firstName) || !NAME_REGEX.test(lastName)) {
        return showAlert("Invalid Name", "Check name format.", "warning");
      }

      if (middleName && !NAME_REGEX.test(middleName)) {
        return showAlert("Invalid Middle Name", "Check middle name format.", "warning");
      }

      if (!PHONE_REGEX.test(phoneNumber)) {
        return showAlert("Invalid Phone", "Check phone format.", "warning");
      }

      if (role == null) {
        return showAlert("Missing Role", "Please select a role.", "warning");
      }

      if (!Object.values(Roles).includes(role)) {
        return showAlert("Invalid Role", "Role is invalid.", "error");
      }

      const payload = {
        firstName,
        middleName: middleName || undefined,
        lastName,
        phoneNumber,
        profilePictureUrl: profile.profilePictureUrl?.trim() || "",
      };

      const res = await updateProfile(payload);
      if (!res?.isSuccess) {
        return showAlert("Update Failed", res?.message || "Try again later.", "error");
      }

      setStep("role");
    } catch (err: any) {
      showAlert("Error", err?.response?.data?.message || err?.message || "Unexpected error", "error");
    }
  };

  // Step 2: Role Details submission
  const handleRoleNext = async () => {
    try {
      if (!role) {
        return showAlert("Missing Role", "Role is required.", "warning");
      }

      if (role === Roles.Student) {
        const studentNumber = student.studentNumber?.trim();
        const course = student.course?.trim();
        const section = student.section?.trim();
        const yearLevel = student.yearLevel;

        if (!studentNumber || !course || !section || !yearLevel) {
          return showAlert("Missing Fields", "Complete all student fields.", "warning");
        }

        const res = await updateStudent({
          studentNumber,
          course,
          section,
          yearLevel: Number(yearLevel),
        });

        if (!res?.isSuccess) {
          return showAlert("Submission Failed", res?.message || "Request failed.", "error");
        }
      } else {
        const department = personnel.department?.trim();
        const idCardNumber = personnel.idCardNumber?.trim();

        if (!department || !idCardNumber) {
          return showAlert("Missing Fields", "Complete all personnel fields.", "warning");
        }

        const res = await updatePersonnel({
          department,
          idCardNumber,
        });

        if (!res?.isSuccess) {
          return showAlert("Submission Failed", res?.message || "Request failed.", "error");
        }
      }

      setStep("vehicle");
    } catch (err: any) {
      showAlert("Error", err?.response?.data?.message || err?.message || "Unexpected error", "error");
    }
  };

  // Step 3: Vehicle Info submission
  const handleVehicleNext = async () => {
    const plateNumber = vehicle.plateNumber.trim().toUpperCase();
    const brand = vehicle.brand.trim();

    if (!plateNumber || !brand) {
      showAlert("Missing Information", "Please complete all fields.", "warning");
      return;
    }

    if (!PLATE_REGEX.test(plateNumber)) {
      showAlert("Invalid Plate Number", "Use 4-12 characters (letters, numbers, or hyphens).", "warning");
      return;
    }

    if (brand.length < 2 || brand.length > 30) {
      showAlert("Invalid Motor Brand", "Brand must be 2-30 characters.", "warning");
      return;
    }

    try {
      const response = await updateVehicle({
        plateNumber,
        brand,
        vehicleType: Number(vehicle.vehicleType),
      });

      if (!response?.isSuccess) {
        showAlert("Vehicle Update Failed", response?.message || "Please try again.", "error");
        return;
      }

      setStep("schedule");
    } catch (err: any) {
      showAlert("Vehicle Update Failed", err?.response?.data?.message || err?.message || "Please try again.", "error");
    }
  };

  // Step 4: Timepicker and document picking functions
  const openPicker = useCallback(
    (day: string, field: "start" | "end") => {
      const existing = schedule[day]?.[field];
      const next =
        parseTime(existing) ??
        (() => {
          const d = new Date();
          d.setHours(field === "start" ? 8 : 17, 0, 0, 0);
          return d;
        })();
      setDraftTime(next);
      setPickerTarget({ day, field });

      if (Platform.OS === "ios") {
        slideAnim.setValue(300);
        RNAnimated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 45,
          friction: 8,
        }).start();
      }
    },
    [schedule, slideAnim]
  );

  const closePicker = useCallback(() => {
    if (Platform.OS === "ios") {
      RNAnimated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setPickerTarget(null));
    } else {
      setPickerTarget(null);
    }
  }, [slideAnim]);

  const confirmPicker = useCallback(() => {
    if (!pickerTarget) return;
    const formatted = formatTime(draftTime);
    setSchedule((prev) => ({
      ...prev,
      [pickerTarget.day]: {
        ...prev[pickerTarget.day],
        [pickerTarget.field]: formatted,
      },
    }));
    closePicker();
  }, [pickerTarget, draftTime, closePicker]);

  const handleAndroidChange = useCallback(
    (event: any, date?: Date) => {
      if (event.type === "dismissed" || !date || !pickerTarget) {
        setPickerTarget(null);
        return;
      }

      const currentDay = pickerTarget.day;
      const currentField = pickerTarget.field;

      setPickerTarget(null);

      const formatted = formatTime(date);
      setSchedule((prev) => ({
        ...prev,
        [currentDay]: {
          ...prev[currentDay],
          [currentField]: formatted,
        },
      }));
    },
    [pickerTarget]
  );

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setSelectedFile(asset);
    } catch {
      showAlert("Upload Failed", "Something went wrong. Please try again.", "error");
    }
  };

  // Step 4: Schedule and COR Submission
  const handleScheduleSubmit = async () => {
    if (!selectedFile) {
      showAlert("Missing COR", "Please upload COR or Employee ID.", "error");
      return;
    }

    const items = SCHEDULE_DAYS.map((d) => {
      const start = schedule[d.shortLabel]?.start;
      const end = schedule[d.shortLabel]?.end;
      const startDate = parseTime(start);
      const endDate = parseTime(end);
      return {
        dayOfWeek: d.key,
        startTime: startDate
          ? `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}:00`
          : "",
        endTime: endDate
          ? `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}:00`
          : "",
      };
    }).filter((item) => item.startTime && item.endTime);

    if (items.length === 0) {
      showAlert("Missing Schedule", "Please set at least one day's schedule.", "error");
      return;
    }

    setSubmittingSchedule(true);
    try {
      const corRes = await onboardingService.updateCor({
        academicTerm: "2024-2025",
        corDocumentUrl: "https://example.com/cor-document.pdf",
      });
      if (!corRes?.isSuccess) {
        showAlert("COR Upload Failed", corRes?.message || "Failed to upload COR.", "error");
        setSubmittingSchedule(false);
        return;
      }

      const scheduleRes = await onboardingService.updateSchedule({ items });
      if (!scheduleRes?.isSuccess) {
        showAlert("Schedule Error", scheduleRes?.message || "Failed to submit schedule.", "error");
        setSubmittingSchedule(false);
        return;
      }

      // Complete onboarding and login automatically
      const userRes = await loadUser();
      if (userRes.success) {
        const profileType = useAuthStore.getState().user?.profileType;
        if (profileType === "student" || profileType === "personnel") {
          await useVehicleStore.getState().loadVehicle();
        }
        router.replace("/");
      } else {
        router.replace("/");
      }
    } catch (err: any) {
      showAlert("Error", err?.message || "Please try again.", "error");
    } finally {
      setSubmittingSchedule(false);
    }
  };

  // Loading indicator for initializing step
  if (step === "initializing") {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Pre-onboarding steps layout (Signup, OTP code entry)
  if (step === "signup" || step === "otp") {
    return (
      <AuthLayout background={isDark ? "bg-dark-background" : "bg-light-primary"}>
        <StatusBar style="light" />
        <AuthHeader
          logo={require("../../../assets/images/icon.png")}
          title="ParkFlow"
          subtitle="Parking Management System"
        />

        <FormCard>
          {step === "otp" ? (
            isRegistering ? (
              <View className="items-center justify-center py-10 bg-light-surface dark:bg-dark-surface">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-light-text dark:text-dark-text font-heavy mt-4 text-[14px]">
                  Creating your account...
                </Text>
              </View>
            ) : (
              <EmailVerificationView
                email={email.trim()}
                onVerifySuccess={handleOtpVerifiedSuccess}
                onBack={() => setStep("signup")}
              />
            )
          ) : (
            <Animated.View entering={smoothEntering}>
              <Text className="text-light-text dark:text-dark-text font-black text-2xl mb-5">Create Account</Text>
              <Text className="text-light-muted dark:text-dark-muted text-[12px] mb-6">
                Use your email to create an account.
              </Text>

              <AppInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <AppInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />

              <AppInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
              />

              <AppButton
                label="Continue"
                loading={sendingOtp}
                disabled={sendingOtp}
                onPress={handleRegister}
              />

              <View className="flex-row justify-center mt-6">
                <Text className="text-light-muted dark:text-dark-muted">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                  <Text className="text-light-primary dark:text-dark-primary font-heavy">Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </FormCard>

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

  // Reuse standard AppHeader (with centered 18px bold title text to match settings/account screens)
  const renderOnboardingHeader = () => {
    const titleText =
      step === "profile" ? "Profile Info" :
      step === "role" ? "Role Information" :
      step === "vehicle" ? "Vehicle Info" :
      step === "schedule" ? "Duty Schedule" : "";

    return (
      <AppHeader
        centerElement={
          <Text className="font-heavy text-[18px] text-light-text dark:text-dark-text tracking-wide text-center">
            {titleText}
          </Text>
        }
        backIconType="back"
        onBack={() => {
          if (step === "profile") {
            router.replace("/(auth)/login");
          } else if (step === "role") {
            setStep("profile");
          } else if (step === "vehicle") {
            setStep("role");
          } else if (step === "schedule") {
            setStep("vehicle");
          }
        }}
        rightElement={
          <TouchableOpacity
            onPress={handleLogout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background dark:active:bg-dark-background/20"
          >
            <LogOut size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />
    );
  };

  // 4-step wizard UI (Full-width forms inside a premium rounded top card, animated step transitions)
  return (
    <View className="flex-1 bg-light-background dark:bg-dark-background">
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Standardized Header component reused here */}
      {renderOnboardingHeader()}

      {/* Dynamic step progress indicator with animated dashes - Pinned/Fixed here */}
      <StepIndicator currentStep={getStepNumber()} steps={onboardingSteps} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Distinct full-width bottom card container with rounded top corner (rounded-t-[32px]) */}
        <View className="flex-1 bg-light-surface dark:bg-dark-surface rounded-t-[32px] px-6 pt-6 pb-12 gap-5 shadow-soft mt-4">
          {step === "profile" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              className="gap-5"
            >
              <AppInput
                label="First Name"
                value={profile.firstName}
                onChangeText={(v) => setProfileField("firstName", v)}
              />

              <AppInput
                label="Middle Name (Optional)"
                value={profile.middleName}
                onChangeText={(v) => setProfileField("middleName", v)}
              />

              <AppInput
                label="Last Name"
                value={profile.lastName}
                onChangeText={(v) => setProfileField("lastName", v)}
              />

              <AppInput
                label="Phone Number"
                keyboardType="phone-pad"
                value={profile.phoneNumber}
                onChangeText={(v) => setProfileField("phoneNumber", v)}
              />

              <AppSelect
                label="Role"
                options={REGISTER_ROLE_OPTIONS}
                value={role != null ? String(role) : undefined}
                onChange={(v) => {
                  const parsed = Number(v);
                  if (!Number.isNaN(parsed) && Object.values(Roles).includes(parsed)) {
                    setRole(parsed as Roles);
                  } else {
                    setRole(undefined as any);
                  }
                }}
              />



              <AppButton
                label="Continue"
                onPress={handleProfileNext}
                loading={isUpdatingProfile}
                disabled={isUpdatingProfile}
                className="mt-4"
              />
            </Animated.View>
          )}

          {step === "role" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              className="gap-5"
            >
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

              {(role === Roles.UniversityStaff || role === Roles.NonAcademicPersonnel) && (
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
                onPress={handleRoleNext}
                loading={isUpdatingStudent || isUpdatingPersonnel}
                disabled={isUpdatingStudent || isUpdatingPersonnel}
                className="mt-6"
              />
            </Animated.View>
          )}

          {step === "vehicle" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              className="gap-5"
            >
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
                Register the vehicle you will be parking on premises.
              </Text>

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
                label="Continue"
                variant="primary"
                size="lg"
                className="mt-4"
                onPress={handleVehicleNext}
                loading={isUpdatingVehicle}
                disabled={isUpdatingVehicle}
              />
            </Animated.View>
          )}

          {step === "schedule" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              className="gap-5"
            >
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
                Set your usual campus schedule for administrative verification.
              </Text>

              <View className="gap-2 bg-light-surfaceMuted dark:bg-dark-surfaceMuted p-3 rounded-card border border-light-border/40 dark:border-dark-border/40 shadow-soft">
                {SCHEDULE_DAYS.map((d) => (
                  <ScheduleDayRow
                    key={d.shortLabel}
                    day={d.shortLabel as any}
                    schedule={schedule[d.shortLabel] ?? {}}
                    timeError={false}
                    onOpenPicker={({ field }) => openPicker(d.shortLabel, field)}
                    onClear={() => setSchedule((p) => ({ ...p, [d.shortLabel]: {} }))}
                  />
                ))}
              </View>

              <TouchableOpacity
                className="w-full border-2 border-dashed border-light-border dark:border-dark-border bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-card p-5 items-center justify-center flex-row gap-3 active:bg-light-surface dark:active:bg-dark-surface mt-3 shadow-soft"
                onPress={handlePickFile}
                activeOpacity={0.7}
              >
                <UploadCloud size={20} color={colors.text} strokeWidth={2.2} />
                <Text className="text-light-text dark:text-dark-text font-heavy text-[14px]">
                  Upload COR or Employee ID
                </Text>
              </TouchableOpacity>

              {selectedFile && (
                <View className="w-full mt-3 bg-light-surfaceMuted dark:bg-dark-surfaceMuted border border-light-border dark:border-dark-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <FileText size={18} color="#D22730" strokeWidth={2} />
                    <Text
                      className="text-light-text dark:text-dark-text font-book text-[13px] flex-1"
                      numberOfLines={1}
                    >
                      {selectedFile.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedFile(null)}
                    className="w-7 h-7 bg-light-surface dark:bg-dark-surface items-center justify-center rounded-pill active:bg-light-border dark:active:bg-dark-border"
                    activeOpacity={0.7}
                  >
                    <X size={14} color={colors.muted} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}

              <AppButton
                label="Complete Registration"
                variant="primary"
                size="lg"
                className="mt-6"
                onPress={handleScheduleSubmit}
                loading={submittingSchedule}
                disabled={submittingSchedule}
              />
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        icon={<AlertCircle size={28} color="#F59E0B" />}
      />

      {pickerTarget && (
        <RNAnimated.View
          style={[
            Platform.OS === "ios" ? { transform: [{ translateY: slideAnim }] } : {},
          ]}
          className="absolute bottom-0 left-0 right-0 bg-light-surface dark:bg-dark-surface rounded-t-card px-5 pb-8 shadow-card border-t border-light-border dark:border-dark-border z-50"
        >
          <View className="self-center w-9 h-1 rounded-pill bg-light-border dark:bg-dark-border mt-3 mb-2" />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-light-text dark:text-dark-text text-[15px] font-heavy">
              {pickerTarget.day} — {pickerTarget.field === "start" ? "Start" : "End"}
            </Text>
            <TouchableOpacity
              onPress={closePicker}
              className="px-3 py-1.5 rounded-button bg-light-surfaceMuted dark:bg-dark-surfaceMuted active:bg-light-border dark:active:bg-dark-border"
              activeOpacity={0.7}
            >
              <Text className="text-light-text dark:text-dark-text font-heavy text-xs">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mb-5 bg-light-background dark:bg-dark-background rounded-card overflow-hidden">
            <DateTimePicker
              value={draftTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minuteInterval={1}
              onChange={(e, date) => {
                if (Platform.OS === "android") handleAndroidChange(e, date);
                else if (date) setDraftTime(date);
              }}
            />
          </View>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={confirmPicker}
              className="rounded-button bg-light-primary dark:bg-dark-primary py-3.5 items-center justify-center active:opacity-90 shadow-soft"
              activeOpacity={0.8}
            >
              <Text className="text-white font-heavy text-[15px]">
                Confirm Time Selection
              </Text>
            </TouchableOpacity>
          )}
        </RNAnimated.View>
      )}
    </View>
  );
}
