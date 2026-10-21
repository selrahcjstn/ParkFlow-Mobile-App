import { pickDriverDocument } from '@/utils/pickDriverDocument';
import { registrationService } from '../services/registration.service';
import { jwtDecode } from 'jwt-decode';
import type { RegistrationStep } from '../store/onboarding.store';
import RegistrationDocumentField from '../components/RegistrationDocumentField';
import CorStudentRegistrationStep from '../components/CorStudentRegistrationStep';
import { verificationService } from '../services/verification.service';
import CorScheduleStep from '../components/CorScheduleStep';
import { getRegistrationErrorMessage } from "@/utils/registrationError";
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
import { useFocusEffect, useRouter } from "expo-router";
import {
  AlertCircle,
  ChevronLeft,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  BackHandler,
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
import * as DocumentPicker from "expo-document-picker";
import { validateFileSize } from "@/utils/fileValidation";

type RegisterStep = RegistrationStep;

const onboardingSteps = [
  { label: "Profile", description: "Set up your personal profile details" },
  { label: "Role Details", description: "Provide details specific to your role at ParkFlow" },
  { label: "Vehicle", description: "Register the vehicle you will be parking" },
  { label: "Schedule", description: "Read your schedule from your COR" },
  { label: "Documents", description: "Upload identity and vehicle verification documents" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  // Stores
  const { setToken, loadUser, token, logout, user } = useAuthStore();
  const {
    registration,
    setRegistrationField,
    role,
    profile,
    student,
    personnel,
    vehicle,
    corDraft,
    setRole,
    setProfileField,
    setStudentField,
    setPersonnelField,
    setVehicleField,
    reset: resetOnboarding,
  } = useOnboardingStore();

  const isPersonnel = role === Roles.UniversityStaff || role === Roles.NonAcademicPersonnel;
  const smartStudent = role === Roles.Student && user?.status !== 'Active' && user?.status !== '2' &&
    ![4, '4', 'Done'].includes(user?.onboardingStep as any);
  const visibleOnboardingSteps = smartStudent
    ? [{ label: 'COR Review', description: 'Review student details and weekly schedule' },
       { label: 'Vehicle', description: 'Register the vehicle you will be parking' },
       { label: 'Documents', description: 'Upload vehicle documents for campus approval' }]
    : isPersonnel
    ? onboardingSteps.filter((item) => item.label !== "Schedule")
    : onboardingSteps;

  const temporaryRegistration = !!registration.sessionToken;
  // Existing signed-in onboarding keeps its PATCH-based resume path.
  const [isRegistering, setIsRegistering] = useState(false);
  // Mutations
  const { run: updateProfile, isLoading: isUpdatingProfile } = useApiMutation(onboardingService.updateProfile);
  const { run: updateStudent, isLoading: isUpdatingStudent } = useApiMutation(onboardingService.updateStudent);
  const { run: updatePersonnel, isLoading: isUpdatingPersonnel } = useApiMutation(onboardingService.updatePersonnel);
  const { run: checkIdAvailability, isLoading: isCheckingId } = useApiMutation(onboardingService.checkIdAvailability);
  const { run: updateVehicle, isLoading: isUpdatingVehicle } = useApiMutation(onboardingService.updateVehicle);

  // Layout step state
  const step = registration.step;
  const setStep = (value: RegisterStep) => setRegistrationField('step', value);
  const [initializationError, setInitializationError] = useState("");
  const statusRequest = useRef(0);
  const [passwordError, setPasswordError] = useState("");
  const [roleError, setRoleError] = useState("");

  // All drafts stay in Zustand memory; credentials are never persisted to disk.
  const { email, password, confirmPassword, corFile: selectedFile, orcrFile: selectedOrcrFile,
    motorFile: selectedMotorFile, preparedCorUrl } = registration;
  const setEmail = (value: string) => setRegistrationField('email', value);
  const setPassword = (value: string) => setRegistrationField('password', value);
  const setConfirmPassword = (value: string) => setRegistrationField('confirmPassword', value);
  const setSelectedFile = (value: DocumentPicker.DocumentPickerAsset | null) => setRegistrationField('corFile', value);
  const setSelectedOrcrFile = (value: DocumentPicker.DocumentPickerAsset | null) => setRegistrationField('orcrFile', value);
  const setSelectedMotorFile = (value: DocumentPicker.DocumentPickerAsset | null) => setRegistrationField('motorFile', value);
  const setPreparedCorUrl = (value: string | undefined) => setRegistrationField('preparedCorUrl', value);
  const [sendingOtp, setSendingOtp] = useState(false);
  const pickDriverFile = async (field: 'licenseFile' | 'profilePhotoFile') => {
    try { const file = await pickDriverDocument(field === 'profilePhotoFile'); if (file) setRegistrationField(field, file); }
    catch (e) { showAlert('Upload document', e instanceof Error ? e.message : 'Could not select the file.'); }
  };
  const [submittingDocuments, setSubmittingDocuments] = useState(false);

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

  const startNewRegistration = useCallback(async () => {
    const request = ++statusRequest.current;
    setStep("initializing");
    try { await registrationService.cancel(); } catch { /* Expired drafts are already gone. */ }
    await logout(); // Clears the saved token, account data, vehicle state and COR draft.
    if (request !== statusRequest.current) return;
    setEmail(""); setPassword(""); setConfirmPassword("");
    setPasswordError(""); setRoleError(""); setInitializationError("");
    setSelectedFile(null); setSelectedOrcrFile(null); setSelectedMotorFile(null); setPreparedCorUrl(undefined);
    setStep("signup");
  }, [logout]);

  const handleRegistrationBack = useCallback(() => {
    if (submittingDocuments || isRegistering || sendingOtp) return;
    if (step === "initializing" || step === "profile") { void startNewRegistration(); return; }
    if (step === "otp") { setStep("signup"); return; }
    if (step === "role") { setStep("profile"); return; }
    if (step === "vehicle") { setStep(smartStudent ? "profile" : "role"); return; }
    if (step === "schedule") { setStep("vehicle"); return; }
    if (step === "documents") { setStep(isPersonnel || smartStudent ? "vehicle" : "schedule"); return; }
    resetOnboarding();
    router.replace("/(auth)/login");
  }, [step, smartStudent, isPersonnel, startNewRegistration, router, submittingDocuments, isRegistering, sendingOtp]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleRegistrationBack(); return true;
    });
    return () => subscription.remove();
  }, [handleRegistrationBack]));

  // Determine current step number for the StepIndicator
  const getStepNumber = () => {
    if (smartStudent) return step === "vehicle" ? 2 : step === "documents" ? 3 : 1;
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
    if (smartStudent && step === "role") setStep("profile");
  }, [isPersonnel, smartStudent, step]);

  // A server outage is not a missing profile: keep the session and offer retry.
  const checkUserStatus = useCallback(async () => {
    const request = ++statusRequest.current;
    try {
      const savedToken = await SecureStore.getItemAsync("token");
      if (request !== statusRequest.current) return;
      setInitializationError("");
      if (!savedToken) {
        const draft = useOnboardingStore.getState().registration;
        if (draft.sessionToken && draft.password) {
          setStep(['signup', 'otp', 'initializing'].includes(draft.step) ? 'profile' : draft.step);
          return;
        }
        await startNewRegistration();
        return;
      }
      if (useOnboardingStore.getState().registration.sessionToken) {
        try { await registrationService.cancel(); } catch { /* The local draft is still cleared. */ }
        resetOnboarding();
      }
      setToken(savedToken);
      const result = await loadUser();
      if (request !== statusRequest.current) return;
      if (result.sessionExpired) { await startNewRegistration(); return; }
      if (result.success) router.replace("/");
      else if (result.currentOnboardingStep && result.currentOnboardingStep !== "complete") {
        const saved = useOnboardingStore.getState();
        const loaded = useAuthStore.getState().user;
        let next = result.currentOnboardingStep;
        if (loaded?.profileType !== 'personnel' && saved.role !== Roles.UniversityStaff && saved.role !== Roles.NonAcademicPersonnel) {
          try {
            const preview = await verificationService.getStudentCorPreview();
            if (request !== statusRequest.current) return;
            if (preview) {
              saved.setRole(Roles.Student);
              if (preview.documentUrl && preview.informationConfirmed && ['vehicle', 'schedule', 'documents'].includes(next)) {
                setPreparedCorUrl(preview.documentUrl);
                setSelectedFile({ uri: preview.documentUrl, name: 'Reviewed COR', mimeType: 'application/pdf', lastModified: 0 });
                saved.setCorDraft({ documentUrl: preview.documentUrl, recordId: preview.recordId, version: preview.version,
                  academicYear: preview.studentInformation?.academicYear || '', semester: preview.studentInformation?.semester || '',
                  college: preview.studentInformation?.college || '', week: preview.week || [], informationConfirmed: true });
              } else if (![4, '4', 'Done'].includes(loaded?.onboardingStep as any)) {
                next = 'profile';
              }
            } else if (saved.role === Roles.Student && ![4, '4', 'Done'].includes(loaded?.onboardingStep as any)) {
              next = 'profile';
            }
          } catch {
            if (saved.role === Roles.Student && ['vehicle', 'schedule', 'documents'].includes(next)) {
              setInitializationError('Could not restore your COR review. Please try again.');
              return;
            }
          }
          if (next === 'role') next = 'profile';
        }
        setStep(next);
      } else {
        setInitializationError(result.message || "Could not check your registration. Please try again.");
      }
    } catch {
      if (request === statusRequest.current) {
        setInitializationError("Could not check your registration. Please try again.");
      }
    }
  }, [loadUser, setToken, router, startNewRegistration]);

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
    const phoneNumber = profile.phoneNumber.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm || !phoneNumber) {
      showAlert("Missing Information", "Please complete all fields.", "warning");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      showAlert("Invalid Email", "Please enter a valid email address.", "warning");
      return;
    }

    if (!PHONE_REGEX.test(phoneNumber)) {
      showAlert("Invalid Phone", "Enter an 11-digit phone number starting with 09.", "warning");
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

  // OTP grants a temporary registration session, never a permanent account/login.
  const prepareRegistrationSession = async (emailVerificationToken?: string) => {
    if (isRegistering) return;
    if (!emailVerificationToken) throw new Error('Request a new email verification code to continue.');
    setIsRegistering(true);
    try {
      const session = await registrationService.start(email.trim(), emailVerificationToken);
      setRegistrationField('sessionToken', session.token);
      setRegistrationField('expiresAt', session.expiresAt);
      setConfirmPassword('');
      setStep('profile');
    } catch (error) {
      throw new Error(getRegistrationErrorMessage(error, 'Could not prepare registration. Please try again.'));
    }
    finally { setIsRegistering(false); }
  };

  const handleOtpVerifiedSuccess = async (_code: string, emailVerificationToken?: string) => {
    await prepareRegistrationSession(emailVerificationToken);
  };

  // Step 1: Profile Info submission
  const handleProfileNext = async () => {
    if (!token && !temporaryRegistration) return showAlert("Verification Required", "Verify your email to continue registration.");
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
    if (!token && !temporaryRegistration) return showAlert("Verification Required", "Verify your email to continue registration.");
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
          setRoleError("Student ID number must contain exactly 10 digits (e.g. 2023106763).");
          return;
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
          const availability = await checkIdAvailability(studentNumber, "Student");
          if (!availability?.isSuccess || availability.data !== true) {
            setRoleError(availability?.isSuccess
              ? (availability.data === false ? "This student ID number is already registered." : "Could not confirm ID availability. Please try again.")
              : getRegistrationErrorMessage(availability, "Could not check your ID number. Please try again."));
            return;
          }
          const res = await updateStudent({
            studentNumber,
            course: isJuniorHigh(yearLevel) ? "" : course,
            section,
            yearLevel: Number(yearLevel),
          });

          if (!res?.isSuccess) {
            setRoleError(getRegistrationErrorMessage(res, "Could not save your ID number. Please try again."));
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
          const availability = await checkIdAvailability(idCardNumber, role === Roles.NonAcademicPersonnel ? "NonAcademicPersonnel" : "UniversityStaff");
          if (!availability?.isSuccess || availability.data !== true) {
            setRoleError(availability?.isSuccess
              ? (availability.data === false ? "This employee ID number is already registered." : "Could not confirm ID availability. Please try again.")
              : getRegistrationErrorMessage(availability, "Could not check your ID number. Please try again."));
            return;
          }
          const res = await updatePersonnel({
            department,
            idCardNumber,
            role: role === Roles.NonAcademicPersonnel ? "NonAcademicPersonnel" : "UniversityStaff",
          });

          if (!res?.isSuccess) {
            setRoleError(getRegistrationErrorMessage(res, "Could not save your ID number. Please try again."));
            return;
          }
        }
      }

      setStep("vehicle");
    } catch (err: any) {
      setRoleError(getRegistrationErrorMessage(err, err?.response?.status === 409
        ? "This ID number is already registered. Please check your ID number or contact campus administration."
        : "Could not save your ID number. Please try again."));
    }
  };

  // Step 3: Vehicle Info submission
  const handleVehicleNext = async () => {
    if (!token && !temporaryRegistration) return showAlert("Verification Required", "Verify your email to continue registration.");
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

      setStep(isPersonnel || smartStudent ? "documents" : "schedule");
    } catch (err: any) {
      showAlert("Vehicle Update Failed", err?.response?.data?.message || err?.message || "Please try again.", "error");
    }
  };

  // Step 4: Timepicker and document picking functions
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
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
  // Step 5: Document Upload Submission
  const [documentError, setDocumentError] = useState("");

  const handleDocumentsSubmit = async () => {
    if (submittingDocuments) return;
    setDocumentError("");
    if (!isPersonnel && !preparedCorUrl) { showAlert('Confirm Schedule', 'Scan your COR and confirm the detected schedule first.'); return; }
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

    if (!registration.licenseFile || !registration.profilePhotoFile) {
      showAlert('Missing driver documents', 'Upload your driver’s license and a clear profile photo before submitting.'); return;
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
    let registrationCommitted = false;
    try {
      if (temporaryRegistration) {
        const newToken = await registrationService.complete();
        registrationCommitted = true;
        // The transaction has committed. Clear credentials and files even if loading
        // the new session subsequently fails; never resubmit a completed account.
        resetOnboarding();
        await SecureStore.setItemAsync("token", newToken);
        const claims = jwtDecode<{ user_id: string; profile_type: 'student' | 'personnel' }>(newToken);
        // Start with the confirmed registration details so Home can render immediately.
        // Keep access pending until the background refresh reads the server's approval state.
        useAuthStore.getState().setUser({
          id: claims.user_id,
          name: [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ').trim(),
          middleName: profile.middleName || undefined,
          email: email.trim(), phoneNumber: profile.phoneNumber,
          profilePictureUrl: registration.profilePhotoFile?.uri,
          profileType: claims.profile_type,
          role: role === Roles.Student ? 'Student' : role === Roles.NonAcademicPersonnel ? 'NonAcademicPersonnel' : 'UniversityStaff',
          studentNumber: student.studentNumber, course: student.course, yearLevel: student.yearLevel, section: student.section,
          employeeIdNumber: personnel.idCardNumber, department: personnel.department,
          onboardingStep: 'Done', status: 'PendingVerification',
          corVerificationStatus: claims.profile_type === 'student' ? 2 : 1,
          scheduleVerificationStatus: claims.profile_type === 'student' ? 2 : undefined,
        });
        useAuthStore.getState().setProfilePictureUrl(registration.profilePhotoFile?.uri || null);
        setToken(newToken);
        router.replace("/(users)/(tabs)/home" as any);
        void loadUser().catch(() => { /* Dashboard refresh can retry without reopening registration. */ });
        return;
      } else {
        if (!token) { showAlert("Sign In Required", "Please sign in to continue your saved registration."); return; }
        const driverUpload = await userService.submitDriverDocuments(registration.licenseFile, registration.profilePhotoFile);
        if (!driverUpload.isSuccess) throw new Error(driverUpload.message || 'Could not save driver documents.');
        await onboardingService.submitDocuments(selectedFile, selectedOrcrFile, selectedMotorFile, isPersonnel ? "Employee ID" : corDraft?.academicYear, isPersonnel ? undefined : preparedCorUrl);
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
        if (temporaryRegistration) {
          setStep('initializing');
          setInitializationError('Your registration was saved, but we could not load your account. Try again or return to sign in.');
        } else showAlert("Registration Saved", "Your submission was saved, but we could not check your account. Please try again.");
      }
    } catch (err: any) {
      if (registrationCommitted) {
        setStep('initializing');
        setInitializationError('Your registration was saved. Return to sign in if your account cannot be loaded.');
        return;
      }
      const backendMessage = getRegistrationErrorMessage(err, "Please check your submission details and try again.");
      setDocumentError(backendMessage);
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
            <AppButton label="Back to email and password" variant="secondary" onPress={startNewRegistration} />
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
            <EmailVerificationView
              email={email.trim()}
              isRegistrationFlow
              onVerifySuccess={handleOtpVerifiedSuccess}
              onBack={handleRegistrationBack}
            />
          ) : (
            <Animated.View entering={smoothEntering}>
              <TouchableOpacity
                onPress={handleRegistrationBack}
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
                label="Phone Number"
                placeholder="e.g. 09171234567"
                keyboardType="phone-pad"
                maxLength={11}
                value={profile.phoneNumber}
                onChangeText={v => setProfileField("phoneNumber", v.replace(/\D/g, "").slice(0, 11))}
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
                <TouchableOpacity onPress={handleRegistrationBack}>
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
          icon={<AlertCircle size={28} color={colors.warning} />}
        />
      </AuthLayout>
    );
  }

  // Reuse standard AppHeader (with centered 18px bold title text to match settings/account screens)
  const renderOnboardingHeader = () => {
    const titleText =
      step === "profile" ? (smartStudent ? "Review COR" : "Profile Info") :
      step === "role" ? "Role Information" :
      step === "vehicle" ? "Vehicle Info" :
      step === "schedule" ? "Upload COR and Fetch Information" :
      step === "documents" ? "Upload Documents" : "";

    return (
      <AppHeader
        centerElement={
          <Text className="font-bold text-[18px] text-light-text dark:text-dark-text tracking-wide text-center">
            {titleText}
          </Text>
        }
        backIconType="back"
        onBack={handleRegistrationBack}
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
              <AppSelect
                label="Role"
                options={REGISTER_ROLE_OPTIONS}
                value={role != null ? String(role) : undefined}
                onChange={(v) => {
                  const parsed = Number(v);
                  if (!Number.isNaN(parsed) && Object.values(Roles).includes(parsed)) {
                    if (temporaryRegistration && parsed !== role) {
                      useOnboardingStore.getState().setCorDraft(null);
                      setRegistrationField('corPreview', null);
                      setPreparedCorUrl(undefined); setSelectedFile(null);
                    }
                    setRole(parsed as Roles);
                  } else {
                    setRole(undefined as any);
                  }
                }}
              />
              {smartStudent ? <CorStudentRegistrationStep onConfirmed={(url) => {
                setPreparedCorUrl(url);
                if (!temporaryRegistration) setSelectedFile({ uri: url, name: 'Reviewed COR', mimeType: 'application/pdf', lastModified: 0 });
                setStep('vehicle');
              }} /> : role != null ? <>
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





              <AppButton
                label="Continue"
                onPress={handleProfileNext}
                loading={isUpdatingProfile}
                disabled={isUpdatingProfile}
                className="mt-4"
              />
              </> : null}
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
                    placeholder="e.g. 2023106763"
                    keyboardType="numeric"
                    maxLength={10}
                    error={roleError}
                    editable={!isCheckingId && !isUpdatingStudent && !isUpdatingPersonnel}
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
                    editable={!isCheckingId && !isUpdatingStudent && !isUpdatingPersonnel}
                    value={personnel.idCardNumber}
                    onChangeText={(v) => { setRoleError(""); setPersonnelField("idCardNumber", v); }}
                  />
                </>
              )}

              <AppButton
                label="Continue"
                onPress={handleRoleNext}
                loading={isCheckingId || isUpdatingStudent || isUpdatingPersonnel}
                disabled={isCheckingId || isUpdatingStudent || isUpdatingPersonnel}
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
              <CorScheduleStep onConfirmed={(url) => {
                setPreparedCorUrl(url);
                setSelectedFile({ uri: url, name: 'Scanned COR', mimeType: 'application/pdf', lastModified: Date.now() });
                setStep('documents');
              }} />
            </Animated.View>
          )}

          {step === "documents" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              className="gap-5"
            >
              {user?.corVerificationStatus === 3 && (
                <View className="bg-light-danger/10 dark:bg-dark-danger/20 border border-light-danger/30 dark:border-dark-danger/40 rounded-card p-4 flex-row items-start gap-3 dark:bg-dark-danger/10 dark:border-dark-danger/30">
                  <AlertCircle size={22} color={colors.danger} style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="font-bold text-[14px] text-light-text dark:text-dark-danger">
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
                Only your OR/CR and vehicle photo need admin review.
              </Text>

              {isPersonnel && (
                <Text className="mb-4 text-sm leading-5 text-light-muted dark:text-dark-muted">
                  Faculty and university staff do not need to upload a schedule. Your approved employee ID
                  gives access to the university's daily free parking hours. Hourly fees apply outside those
                  hours and continue for an unclosed overnight session until exit.
                </Text>
              )}
            {isPersonnel ? <>
              {/* 1. COR Upload */}
              <View className="gap-2">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px] uppercase tracking-wide">
                  {isPersonnel ? "1. Employee ID" : "1. Certificate of Registration (COR)"}
                </Text>
                <RegistrationDocumentField label="Employee ID" helperText="PDF, JPG or PNG - Maximum file size 5MB" file={selectedFile} onPick={handlePickFile} onRemove={() => setSelectedFile(null)} disabled={submittingDocuments} />


              </View>

            </> : preparedCorUrl ? <View className="p-4 rounded-card border border-light-border dark:border-dark-border">
              <Text className="text-light-text dark:text-dark-text">COR information fetched and schedule confirmed. Upload your remaining vehicle documents below.</Text>
              <AppButton label="Replace COR" variant="outline" onPress={() => { setPreparedCorUrl(undefined); setStep(smartStudent ? 'profile' : 'schedule'); }} />
            </View> : <CorScheduleStep onConfirmed={(url) => { setPreparedCorUrl(url); setSelectedFile({ uri: url, name: 'Scanned COR', mimeType: 'application/pdf', lastModified: Date.now() }); }} />}

              {/* 2. OR/CR Upload */}
              <View className="gap-2 mt-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px] uppercase tracking-wide">
                  2. Vehicle OR / CR Document
                </Text>
                <RegistrationDocumentField label="OR/CR document" helperText="PDF, JPG or PNG - Maximum file size 5MB" file={selectedOrcrFile} onPick={handlePickOrcrFile} onRemove={() => setSelectedOrcrFile(null)} disabled={submittingDocuments} />


              </View>

              {/* 3. Picture of Motor / Vehicle Upload */}
              <View className="gap-2 mt-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px] uppercase tracking-wide">
                  3. Vehicle Picture (Showing Plate Number)
                </Text>
                <RegistrationDocumentField label="vehicle photo" helperText="Show the plate number clearly - Maximum file size 5MB" file={selectedMotorFile} onPick={handlePickMotorFile} onRemove={() => setSelectedMotorFile(null)} disabled={submittingDocuments} />


              </View>

              <View className="gap-2 mt-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px] uppercase tracking-wide">
                  4. Driver’s License
                </Text>
                <RegistrationDocumentField label="driver’s license" helperText="A valid license for your vehicle - PDF, JPG or PNG, up to 5MB"
                  file={registration.licenseFile} onPick={() => pickDriverFile('licenseFile')} onRemove={() => setRegistrationField('licenseFile', null)} disabled={submittingDocuments} />
              </View>
              <View className="gap-2 mt-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px] uppercase tracking-wide">
                  5. Profile Picture
                </Text>
                <RegistrationDocumentField label="profile picture" helperText="Upload a clear photo of your face. This will be your profile picture in the app and used for gate verification - JPG, PNG or WEBP, up to 5MB"
                  file={registration.profilePhotoFile} onPick={() => pickDriverFile('profilePhotoFile')} onRemove={() => setRegistrationField('profilePhotoFile', null)} disabled={submittingDocuments} />
              </View>
              {documentError ? (
                <Text accessibilityRole="alert" className="mt-4 text-sm text-light-text dark:text-dark-danger">{documentError}</Text>
              ) : null}
              <AppButton
                label="Complete Registration"
                variant="primary"
                size="lg"
                className="mt-6"
                onPress={handleDocumentsSubmit}
                loading={submittingDocuments}
                disabled={submittingDocuments || (!isPersonnel && !preparedCorUrl)}
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
        icon={<AlertCircle size={28} color={colors.warning} />}
      />


    </View>
  );
}
