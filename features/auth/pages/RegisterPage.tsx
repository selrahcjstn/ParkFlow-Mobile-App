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
import { userService } from "@/features/user/services/user.service";
import { useApiMutation } from "@/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import { SecureStore } from "@/services/storage";
import AppHeader from "@/components/layouts/AppHeader";
import {
  EMAIL_REGEX,
  getPasswordValidationError,
  NAME_REGEX,
  PHONE_REGEX,
  PLATE_REGEX,
  STUDENT_ID_REGEX,
} from "@/utils/registerValidation";
import {
  YEAR_LEVEL_OPTIONS,
  COLLEGE_COURSE_OPTIONS,
  isJuniorHigh,
} from "@/constants/courses";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  FileText,
  UploadCloud,
  X,
  ChevronLeft,
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
import { validateFileSize } from "@/utils/fileValidation";

type RegisterStep =
  | "initializing"
  | "signup"
  | "otp"
  | "profile"
  | "role"
  | "vehicle"
  | "schedule"
  | "documents";

const onboardingSteps = [
  { label: "Profile", description: "Set up your personal profile details" },
  { label: "Role Details", description: "Provide details specific to your role at ParkFlow" },
  { label: "Vehicle", description: "Register the vehicle you will be parking" },
  { label: "Schedule", description: "Set your campus duty schedule" },
  { label: "Documents", description: "Upload identity and vehicle verification documents" },
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
  const { setToken, loadUser, token, logout, user } = useAuthStore();
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

  const isPersonnel = role === Roles.UniversityStaff || role === Roles.NonAcademicPersonnel;
  const visibleOnboardingSteps = isPersonnel
    ? onboardingSteps.filter((item) => item.label !== "Schedule")
    : onboardingSteps;

  // Mutations
  const { run: register, isLoading: isRegistering } = useApiMutation(authService.register);
  const { run: updateProfile, isLoading: isUpdatingProfile } = useApiMutation(onboardingService.updateProfile);
  const { run: updateStudent, isLoading: isUpdatingStudent } = useApiMutation(onboardingService.updateStudent);
  const { run: updatePersonnel, isLoading: isUpdatingPersonnel } = useApiMutation(onboardingService.updatePersonnel);
  const { run: updateVehicle, isLoading: isUpdatingVehicle } = useApiMutation(onboardingService.updateVehicle);

  // Layout step state
  const [step, setStep] = useState<RegisterStep>("initializing");
  const [initializationError, setInitializationError] = useState("");
  const statusRequest = useRef(0);
  const [passwordError, setPasswordError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

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
  const [selectedOrcrFile, setSelectedOrcrFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [selectedMotorFile, setSelectedMotorFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
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
      case "documents": return isPersonnel ? 4 : 5;
      default: return 1;
    }
  };

  useEffect(() => {
    if (isPersonnel && step === "schedule") setStep("documents");
  }, [isPersonnel, step]);

  // A server outage is not a missing profile: keep the session and offer retry.
  const checkUserStatus = useCallback(async () => {
    const request = ++statusRequest.current;
    try {
      const savedToken = await SecureStore.getItemAsync("token");
      if (request !== statusRequest.current) return;
      setInitializationError("");
      if (!savedToken) {
        if (request === statusRequest.current) setStep("signup");
        return;
      }
      setToken(savedToken);
      const result = await loadUser();
      if (request !== statusRequest.current) return;
      if (result.success) router.replace("/");
      else if (result.currentOnboardingStep && result.currentOnboardingStep !== "complete") {
        setStep(result.currentOnboardingStep);
      } else {
        setInitializationError(result.message || "Could not check your registration. Please try again.");
      }
    } catch {
      if (request === statusRequest.current) {
        setInitializationError("Could not check your registration. Please try again.");
      }
    }
  }, [loadUser, setToken, router]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return checkUserStatus();
    });
    return () => { active = false; statusRequest.current++; };
  }, [checkUserStatus]);

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
      showAlert("Invalid Email", "Please enter a valid email address.", "warning");
      return;
    }

    const validationError = getPasswordValidationError(password);
    setPasswordError(validationError || "");
    if (validationError) {
      showAlert("Invalid Password", validationError, "warning");
      return;
    }

    if (confirmPassword !== trimmedConfirm) {
      showAlert("Invalid Confirm Password", "Confirm password cannot start or end with spaces.", "warning");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      showAlert("Password Mismatch", "Passwords do not match. Please ensure both passwords are identical.", "warning");
      return;
    }

    setSendingOtp(true);
    try {
      // Check availability without signing in to an existing account.
      const checkRes = await authService.checkEmailAvailability(trimmedEmail);
      if (!checkRes?.isSuccess) {
        showAlert(
          "Email Already In Use",
          checkRes?.message || "This email address is already registered in ParkFlow. Please sign in or use a different email address.",
          "warning"
        );
        return;
      }

      // 2. Send OTP
      const otpRes = await authService.sendEmailOtp(trimmedEmail);
      if (otpRes?.isSuccess) {
        setEmailVerified(false);
        setStep("otp");
      } else {
        showAlert(
          "Verification Error",
          otpRes?.message || "Failed to send verification code. Please try again.",
          "error"
        );
      }
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send verification code. Please try again.";
      showAlert("Verification Error", backendMessage, "error");
    } finally {
      setSendingOtp(false);
    }
  };

  // Create the pending account after verification, then save each completed step.
  // Passwords stay in memory only and are cleared once the secure token is saved.
  const completeAccountRegistration = async () => {
    if (isRegistering) return;
    try {
      const response = await register({ email: email.trim(), password });
      const newToken = typeof response?.data === "string" ? response.data : response?.data?.token;
      if (!response?.isSuccess || !newToken) {
        showAlert("Registration Failed", response?.message || "Could not create your account. Please try again.");
        return;
      }
      await SecureStore.setItemAsync("token", newToken);
      setToken(newToken);
      resetOnboarding();
      setPassword("");
      setConfirmPassword("");
      setStep("profile");
    } catch (error: any) {
      showAlert("Registration Failed", error?.response?.data?.message || "Could not create your account. Please try again.");
    }
  };

  const handleOtpVerifiedSuccess = async () => {
    setEmailVerified(true);
    await completeAccountRegistration();
  };

  // Step 1: Profile Info submission
  const handleProfileNext = async () => {
    if (!token) return showAlert("Sign In Required", "Please sign in to continue your saved registration.");
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
        return showAlert("Invalid Phone", "Please enter a valid 11-digit phone number starting with 09 (e.g. 09171234567).", "warning");
      }

      if (role == null) {
        return showAlert("Missing Role", "Please select a role.", "warning");
      }

      if (!Object.values(Roles).includes(role)) {
        return showAlert("Invalid Role", "Role is invalid.", "error");
      }

      if (token) {
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
      }

      setStep("role");
    } catch (err: any) {
      showAlert("Error", err?.response?.data?.message || err?.message || "Unexpected error", "error");
    }
  };

  // Step 2: Role Details submission
  const handleRoleNext = async () => {
    if (!token) return showAlert("Sign In Required", "Please sign in to continue your saved registration.");
    setRoleError("");
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
          return showAlert("Invalid Student ID", "Student ID number must contain only digits and be between 7 and 10 digits long (e.g. 202600123).", "warning");
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

        if (token) {
          const res = await updateStudent({
            studentNumber,
            course: isJuniorHigh(yearLevel) ? "" : course,
            section,
            yearLevel: Number(yearLevel),
          });

          if (!res?.isSuccess) {
            setRoleError(res?.message || "Could not save your ID number. Please try again.");
            return;
          }
        }
      } else {
        const department = personnel.department?.trim();
        const idCardNumber = personnel.idCardNumber?.trim();

        if (!department || !idCardNumber) {
          return showAlert("Missing Fields", "Complete all personnel fields.", "warning");
        }

        if (token) {
          const res = await updatePersonnel({
            department,
            idCardNumber,
            role: role === Roles.NonAcademicPersonnel ? "NonAcademicPersonnel" : "UniversityStaff",
          });

          if (!res?.isSuccess) {
            setRoleError(res?.message || "Could not save your ID number. Please try again.");
            return;
          }
        }
      }

      setStep("vehicle");
    } catch (err: any) {
      setRoleError(err?.response?.data?.message || "Could not save your ID number. Please try again.");
    }
  };

  // Step 3: Vehicle Info submission
  const handleVehicleNext = async () => {
    if (!token) return showAlert("Sign In Required", "Please sign in to continue your saved registration.");
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
      showAlert("Invalid Vehicle Brand", "Brand must be 2-30 characters.", "warning");
      return;
    }

    try {
      if (token) {
        const response = await updateVehicle({
          plateNumber,
          brand,
          vehicleType: Number(vehicle.vehicleType),
        });

        if (!response?.isSuccess) {
          showAlert("Vehicle Update Failed", response?.message || "Please try again.", "error");
          return;
        }
      }

      setStep(isPersonnel ? "documents" : "schedule");
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
        type: isPersonnel ? ["application/pdf", "image/*"] : ["application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const validation = validateFileSize(asset, 5);
      if (!validation.isValid) {
        showAlert("File Too Large", validation.message || "File size cannot exceed 5MB.", "error");
        return;
      }

      setSelectedFile(asset);
    } catch {
      showAlert("Upload Failed", "Something went wrong. Please try again.", "error");
    }
  };

  const handlePickOrcrFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const validation = validateFileSize(asset, 5);
      if (!validation.isValid) {
        showAlert("File Too Large", validation.message || "File size cannot exceed 5MB.", "error");
        return;
      }

      setSelectedOrcrFile(asset);
    } catch {
      showAlert("Upload Failed", "Something went wrong. Please try again.", "error");
    }
  };

  const handlePickMotorFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const validation = validateFileSize(asset, 5);
      if (!validation.isValid) {
        showAlert("File Too Large", validation.message || "File size cannot exceed 5MB.", "error");
        return;
      }

      setSelectedMotorFile(asset);
    } catch {
      showAlert("Upload Failed", "Something went wrong. Please try again.", "error");
    }
  };

  // Step 4: Schedule Submission
  const handleScheduleSubmit = async () => {
    if (!token) return showAlert("Sign In Required", "Please sign in to continue your saved registration.");
    if (isPersonnel) { setStep("documents"); return; }
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

    if (token) {
      setSubmittingSchedule(true);
      try {
        const scheduleRes = await onboardingService.updateSchedule({ items });
        if (!scheduleRes?.isSuccess) {
          showAlert("Schedule Error", scheduleRes?.message || "Failed to submit schedule.", "error");
          setSubmittingSchedule(false);
          return;
        }
      } catch (err: any) {
        showAlert("Error", err?.message || "Please try again.", "error");
        setSubmittingSchedule(false);
        return;
      } finally {
        setSubmittingSchedule(false);
      }
    }

    setStep("documents");
  };

  // Step 5: Document Upload Submission
  const [submittingDocuments, setSubmittingDocuments] = useState(false);

  const handleDocumentsSubmit = async () => {
    if (!selectedFile) {
      showAlert(isPersonnel ? "Missing Employee ID" : "Missing COR Document", isPersonnel ? "Please upload your employee ID before submitting." : "Please upload your COR document before submitting.", "error");
      return;
    }

    if (!selectedOrcrFile) {
      showAlert("Missing OR/CR Document", "Please upload your OR/CR document before submitting.", "error");
      return;
    }

    if (!selectedMotorFile) {
      showAlert("Missing Vehicle Picture", "Please upload your vehicle picture showing the plate number before submitting.", "error");
      return;
    }

    const corValidation = validateFileSize(selectedFile, 5);
    if (!corValidation.isValid) {
      showAlert("File Too Large", `${isPersonnel ? "Employee ID" : "COR Document"}: ${corValidation.message || "File size cannot exceed 5MB."}`, "error");
      return;
    }

    const orcrValidation = validateFileSize(selectedOrcrFile, 5);
    if (!orcrValidation.isValid) {
      showAlert("File Too Large", `OR/CR Document: ${orcrValidation.message || "File size cannot exceed 5MB."}`, "error");
      return;
    }

    const motorValidation = validateFileSize(selectedMotorFile, 5);
    if (!motorValidation.isValid) {
      showAlert("File Too Large", `Vehicle Picture: ${motorValidation.message || "File size cannot exceed 5MB."}`, "error");
      return;
    }

    setSubmittingDocuments(true);
    try {
      if (!token) {
        showAlert("Sign In Required", "Please sign in to continue your saved registration.");
        return;
      }

      // Step 2: Upload COR Document
      const corUploadRes = await userService.uploadCorDocument(
        selectedFile.uri,
        selectedFile.name || `cor_${Date.now()}.pdf`,
        "",
      );
      const corUrl = (corUploadRes?.data as any)?.url || (corUploadRes?.data as any)?.secureUrl || corUploadRes?.data;
      if (!corUploadRes?.isSuccess || !corUrl) {
        showAlert("Upload Failed", corUploadRes?.message || "Failed to upload COR/ID document. Registration request was not sent.", "error");
        setSubmittingDocuments(false);
        return;
      }

      // Step 3: Upload OR/CR Document
      const orcrUploadRes = await userService.uploadOrcrDocument(
        selectedOrcrFile.uri,
        selectedOrcrFile.name || `orcr_${Date.now()}.jpg`,
        "",
      );
      const orcrUrl = (orcrUploadRes?.data as any)?.url || (orcrUploadRes?.data as any)?.secureUrl || orcrUploadRes?.data;
      if (!orcrUploadRes?.isSuccess || !orcrUrl) {
        showAlert("Upload Failed", orcrUploadRes?.message || "Failed to upload OR/CR document. Registration request was not sent.", "error");
        setSubmittingDocuments(false);
        return;
      }

      // Step 4: Upload Vehicle Picture
      const motorUploadRes = await userService.uploadMotorPicture(
        selectedMotorFile.uri,
        selectedMotorFile.name || `motor_${Date.now()}.jpg`,
        "",
      );
      const motorUrl = (motorUploadRes?.data as any)?.url || (motorUploadRes?.data as any)?.secureUrl || motorUploadRes?.data;
      if (!motorUploadRes?.isSuccess || !motorUrl) {
        showAlert("Upload Failed", motorUploadRes?.message || "Failed to upload vehicle picture. Registration request was not sent.", "error");
        setSubmittingDocuments(false);
        return;
      }

      // Step 5: Finalize COR registration submission ONLY after all 3 document files are successfully uploaded
      const corRes = await onboardingService.updateCor({
        academicTerm: "2024-2025",
        corDocumentUrl: String(corUrl),
        orcrDocumentUrl: String(orcrUrl),
        motorPictureUrl: String(motorUrl),
      });
      if (!corRes?.isSuccess) {
        showAlert("Registration Failed", corRes?.message || "Failed to finalize registration submission.", "error");
        setSubmittingDocuments(false);
        return;
      }

      // Complete onboarding and login automatically
      const userRes = await loadUser();
      if (userRes.success) {
        const loadedUser = useAuthStore.getState().user;
        const profileType = loadedUser?.profileType;
        if (profileType === "student" || profileType === "personnel") {
          await useVehicleStore.getState().loadVehicle();
        }
        router.replace("/(users)/(tabs)/home" as any);
      } else if (userRes.currentOnboardingStep && userRes.currentOnboardingStep !== "complete") {
        setStep(userRes.currentOnboardingStep);
      } else {
        showAlert("Registration Saved", "Your submission was saved, but we could not check your account. Please try again.");
      }
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Please check your submission details and try again.";
      showAlert("Registration Failed", backendMessage, "error");
    } finally {
      setSubmittingDocuments(false);
    }
  };

  // Loading indicator for initializing step
  if (step === "initializing") {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        {initializationError ? (
          <View className="w-full max-w-md px-6 gap-4">
            <Text className="text-center text-light-text dark:text-dark-text">{initializationError}</Text>
            <AppButton label="Try Again" onPress={() => void checkUserStatus()} />
            <AppButton label="Back to Sign In" variant="secondary" onPress={() => router.replace("/(auth)/login")} />
          </View>
        ) : <ActivityIndicator size="large" color={colors.primary} />}
      </View>
    );
  }

  // Pre-onboarding steps layout (Signup, OTP code entry)
  if (step === "signup" || step === "otp") {
    return (
      <AuthLayout background={isDark ? "bg-dark-background" : "bg-light-primary"}>
        <StatusBar style="light" />
        <AuthHeader
          logo={require("../../../assets/images/parkflow.png")}
          title="ParkFlow"
          subtitle="Parking Management System"
        />

        <FormCard>
          {step === "otp" ? (
            isRegistering ? (
              <View className="items-center justify-center py-10 bg-light-surface dark:bg-dark-surface">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-light-text dark:text-dark-text font-bold mt-4 text-[14px]">
                  Creating your account...
                </Text>
              </View>
            ) : emailVerified ? (
              <View className="gap-4">
                <Text className="text-light-text dark:text-dark-text">Your email is verified. Try again to create your account.</Text>
                <AppButton label="Try Again" onPress={completeAccountRegistration} />
              </View>
            ) : (
              <EmailVerificationView
                email={email.trim()}
                onVerifySuccess={handleOtpVerifiedSuccess}
                onBack={() => { setEmailVerified(false); setStep("signup"); }}
              />
            )
          ) : (
            <Animated.View entering={smoothEntering}>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                className="flex-row items-center gap-1 mb-4 py-1 self-start active:opacity-70"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={20} color={colors.primary} />
                <Text className="text-light-primary dark:text-dark-primary font-bold text-[14px]">
                  Back to Sign In
                </Text>
              </TouchableOpacity>

              <Text className="text-light-text dark:text-dark-text font-bold text-2xl mb-2">Create Account</Text>
              <Text className="text-light-muted dark:text-dark-muted text-[12px] mb-6">
                Use your email to create an account.
              </Text>

              <AppInput
                label="Email address"
                placeholder="e.g. juan@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <AppInput
                label="Password"
                placeholder="Create a strong password"
                error={passwordError}
                value={password}
                onChangeText={(value) => { setPassword(value); setPasswordError(""); }}
                isPassword
              />

              <AppInput
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
              />

              <Text className="text-light-muted dark:text-dark-muted text-sm mb-4">
                Use 8–128 characters with an uppercase letter, lowercase letter, number, and special character.
              </Text>

              <AppButton
                label="Continue"
                loading={sendingOtp}
                disabled={sendingOtp}
                onPress={handleRegister}
              />

              <View className="flex-row justify-center mt-6">
                <Text className="text-light-muted dark:text-dark-muted">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                  <Text className="text-light-primary dark:text-dark-primary font-bold">Sign In</Text>
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
      step === "schedule" ? "Duty Schedule" :
      step === "documents" ? "Upload Documents" : "";

    return (
      <AppHeader
        centerElement={
          <Text className="font-bold text-[18px] text-light-text dark:text-dark-text tracking-wide text-center">
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
          } else if (step === "documents") {
            setStep(isPersonnel ? "vehicle" : "schedule");
          }
        }}
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
      <StepIndicator currentStep={getStepNumber()} steps={visibleOnboardingSteps} />

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
                placeholder="Enter your first name"
                value={profile.firstName}
                onChangeText={(v) => setProfileField("firstName", v)}
              />

              <AppInput
                label="Middle Name (Optional)"
                placeholder="Enter your middle name (optional)"
                value={profile.middleName}
                onChangeText={(v) => setProfileField("middleName", v)}
              />

              <AppInput
                label="Last Name"
                placeholder="Enter your last name"
                value={profile.lastName}
                onChangeText={(v) => setProfileField("lastName", v)}
              />

              <AppInput
                label="Phone Number"
                placeholder="09171234567"
                keyboardType="phone-pad"
                maxLength={11}
                value={profile.phoneNumber}
                onChangeText={(v) => setProfileField("phoneNumber", v.replace(/\D/g, "").slice(0, 11))}
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
                    error={roleError}
                    value={student.studentNumber}
                    onChangeText={(v) => { setRoleError(""); setStudentField("studentNumber", v.replace(/\D/g, "").slice(0, 10)); }}
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
                    onChangeText={(v) => setStudentField("section", v.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase().slice(0, 10))}
                  />
                </>
              )}

              {(role === Roles.UniversityStaff || role === Roles.NonAcademicPersonnel) && (
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
                    error={roleError}
                    value={personnel.idCardNumber}
                    onChangeText={(v) => { setRoleError(""); setPersonnelField("idCardNumber", v); }}
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
                Register the vehicle you will be parking on premises. Verification documents will be uploaded in the final step.
              </Text>

              <AppSelect
                label="Vehicle Type"
                placeholder="Pick a Vehicle Type"
                options={VEHICLE_TYPE_OPTIONS}
                value={vehicle.vehicleType.toString()}
                onChange={(v) => setVehicleField("vehicleType", Number(v))}
              />


              <AppInput
                label="Vehicle Plate Number"
                placeholder="e.g. ABC1234"
                value={vehicle.plateNumber}
                onChangeText={(v) => setVehicleField("plateNumber", v)}
              />

              <AppInput
                label="Vehicle brand / model"
                placeholder="e.g. Honda Click 125 or Toyota Vios"
                value={vehicle.brand}
                onChangeText={(v) => setVehicleField("brand", v)}
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

          {step === "schedule" && !isPersonnel && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              className="gap-5"
            >
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
                Set your usual campus schedule for administrative verification. Tap a day to clear its hours.
              </Text>

              <View className="gap-2 bg-light-surfaceMuted dark:bg-dark-surfaceMuted p-3.5 rounded-card border border-light-border dark:border-dark-border">
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

              <AppButton
                label="Continue to Documents"
                variant="primary"
                size="lg"
                className="mt-6"
                onPress={handleScheduleSubmit}
                loading={submittingSchedule}
                disabled={submittingSchedule}
              />
            </Animated.View>
          )}

          {step === "documents" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              className="gap-5"
            >
              {user?.corVerificationStatus === 3 && (
                <View className="bg-light-danger/10 dark:bg-dark-danger/20 border border-light-danger/30 dark:border-dark-danger/40 rounded-card p-4 flex-row items-start gap-3">
                  <AlertCircle size={22} color="#EF4444" style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="font-bold text-[14px] text-light-danger dark:text-dark-danger">
                      Submission Rejected by Admin
                    </Text>
                    <Text className="font-regular text-[13px] text-light-text dark:text-dark-text mt-1 leading-5">
                      {user?.rejectionReason ||
                        "Your documents or vehicle registration details were rejected. Please review and re-upload valid documents below."}
                    </Text>
                  </View>
                </View>
              )}

              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
                Upload your identity and vehicle verification documents for administrative verification.
              </Text>

              {isPersonnel && (
                <Text className="mb-4 text-sm leading-5 text-light-muted dark:text-dark-muted">
                  Faculty and university staff do not need to upload a schedule. Your approved employee ID
                  gives access to the university's daily free parking hours. Hourly fees apply outside those
                  hours and continue for an unclosed overnight session until exit.
                </Text>
              )}
              {/* 1. COR Upload */}
              <View className="gap-2">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px] uppercase tracking-wide">
                  {isPersonnel ? "1. Employee ID" : "1. Certificate of Registration (COR)"}
                </Text>
                <TouchableOpacity
                  className="w-full border border-dashed border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface rounded-card p-5 items-center justify-center active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
                  onPress={handlePickFile}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 rounded-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center mb-2">
                    <UploadCloud size={18} color={colors.muted} strokeWidth={2} />
                  </View>
                  <Text className="text-light-muted dark:text-dark-muted font-bold text-[13.5px] text-center">
                    {isPersonnel ? (selectedFile ? "Replace Employee ID" : "Upload Employee ID") : (selectedFile ? "Replace COR Document" : "Upload COR Document")}
                  </Text>
                  <Text className="text-light-muted/70 dark:text-dark-muted/70 font-regular text-[11.5px] mt-0.5 text-center">
                    {isPersonnel ? "PDF or image • Maximum file size 5MB" : "PDF document only • Maximum file size 5MB"}
                  </Text>
                </TouchableOpacity>

                {selectedFile && (
                  <View className="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                      <View className="w-8 h-8 rounded-button bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center">
                        <FileText size={16} color={colors.primary} strokeWidth={2} />
                      </View>
                      <Text
                        className="text-light-text dark:text-dark-text font-bold text-[13px] flex-1"
                        numberOfLines={1}
                      >
                        {selectedFile.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedFile(null)}
                      className="w-7 h-7 bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center rounded-pill active:bg-light-border dark:active:bg-dark-border"
                      activeOpacity={0.7}
                    >
                      <X size={14} color={colors.muted} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 2. OR/CR Upload */}
              <View className="gap-2 mt-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px] uppercase tracking-wide">
                  2. Vehicle OR / CR Document
                </Text>
                <TouchableOpacity
                  className="w-full border border-dashed border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface rounded-card p-5 items-center justify-center active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
                  onPress={handlePickOrcrFile}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 rounded-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center mb-2">
                    <UploadCloud size={18} color={colors.muted} strokeWidth={2} />
                  </View>
                  <Text className="text-light-muted dark:text-dark-muted font-bold text-[13.5px] text-center">
                    {selectedOrcrFile ? "Replace OR / CR Document" : "Upload OR / CR Document"}
                  </Text>
                  <Text className="text-light-muted/70 dark:text-dark-muted/70 font-regular text-[11.5px] mt-0.5 text-center">
                    PDF document only • Maximum file size 5MB
                  </Text>
                </TouchableOpacity>

                {selectedOrcrFile && (
                  <View className="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                      <View className="w-8 h-8 rounded-button bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center">
                        <FileText size={16} color={colors.primary} strokeWidth={2} />
                      </View>
                      <Text
                        className="text-light-text dark:text-dark-text font-bold text-[13px] flex-1"
                        numberOfLines={1}
                      >
                        {selectedOrcrFile.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedOrcrFile(null)}
                      className="w-7 h-7 bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center rounded-pill active:bg-light-border dark:active:bg-dark-border"
                      activeOpacity={0.7}
                    >
                      <X size={14} color={colors.muted} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 3. Picture of Motor / Vehicle Upload */}
              <View className="gap-2 mt-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px] uppercase tracking-wide">
                  3. Vehicle Picture (Showing Plate Number)
                </Text>
                <TouchableOpacity
                  className="w-full border border-dashed border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface rounded-card p-5 items-center justify-center active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
                  onPress={handlePickMotorFile}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 rounded-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center mb-2">
                    <UploadCloud size={18} color={colors.muted} strokeWidth={2} />
                  </View>
                  <Text className="text-light-muted dark:text-dark-muted font-bold text-[13.5px] text-center">
                    {selectedMotorFile ? "Replace Vehicle Picture" : "Upload Picture of Vehicle"}
                  </Text>
                  <Text className="text-light-muted/70 dark:text-dark-muted/70 font-regular text-[11.5px] mt-0.5 text-center">
                    Please provide a clear picture showing plate number • Max 5MB
                  </Text>
                </TouchableOpacity>

                {selectedMotorFile && (
                  <View className="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                      <View className="w-8 h-8 rounded-button bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center">
                        <FileText size={16} color={colors.primary} strokeWidth={2} />
                      </View>
                      <Text
                        className="text-light-text dark:text-dark-text font-bold text-[13px] flex-1"
                        numberOfLines={1}
                      >
                        {selectedMotorFile.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedMotorFile(null)}
                      className="w-7 h-7 bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center rounded-pill active:bg-light-border dark:active:bg-dark-border"
                      activeOpacity={0.7}
                    >
                      <X size={14} color={colors.muted} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <AppButton
                label="Complete Registration"
                variant="primary"
                size="lg"
                className="mt-6"
                onPress={handleDocumentsSubmit}
                loading={submittingDocuments}
                disabled={submittingDocuments}
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
        <>
          {/* Dimmed backdrop to close picker */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={closePicker}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 z-40"
          />

          <RNAnimated.View
            style={[
              Platform.OS === "ios" ? { transform: [{ translateY: slideAnim }] } : {},
            ]}
            className="absolute bottom-0 left-0 right-0 bg-light-surface dark:bg-dark-surface rounded-t-[28px] px-6 pb-9 shadow-card border-t border-light-border dark:border-dark-border z-50"
          >
            <View className="self-center w-10 h-1.5 rounded-pill bg-light-border dark:bg-dark-border mt-3 mb-3" />

            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-light-text dark:text-dark-text text-[16px] font-bold">
                  {pickerTarget.day}
                </Text>
                <Text className="text-light-muted dark:text-dark-muted text-[12px] font-regular">
                  Set {pickerTarget.field === "start" ? "Start" : "End"} Time
                </Text>
              </View>
              <TouchableOpacity
                onPress={closePicker}
                className="px-3.5 py-1.5 rounded-button bg-light-surfaceMuted dark:bg-dark-surfaceMuted active:bg-light-border dark:active:bg-dark-border"
                activeOpacity={0.7}
              >
                <Text className="text-light-text dark:text-dark-text font-bold text-xs">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            <View className="items-center mb-5 bg-light-background dark:bg-dark-background rounded-card p-2 border border-light-border/60 dark:border-dark-border/60 overflow-hidden">
              <DateTimePicker
                value={draftTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minuteInterval={1}
                themeVariant={isDark ? "dark" : "light"}
                textColor={isDark ? "#F2F3F5" : "#09090B"}
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
                <Text className="text-white font-bold text-[15px]">
                  Confirm Time Selection
                </Text>
              </TouchableOpacity>
            )}
          </RNAnimated.View>
        </>
      )}
    </View>
  );
}
