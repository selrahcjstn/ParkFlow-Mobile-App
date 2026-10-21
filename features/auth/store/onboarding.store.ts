import { Roles } from "@/constants/roles";
import { VehicleType } from "@/constants/vehicleType";
import { create } from "zustand";
import type { CorWeekDay, CorSchedulePreview } from '../services/verification.service';
import type { DocumentPickerAsset } from 'expo-document-picker';

export type RegistrationStep = 'initializing' | 'signup' | 'otp' | 'profile' | 'role' | 'vehicle' | 'schedule' | 'documents';
type RegistrationDraft = {
  email: string; password: string; confirmPassword: string; sessionToken: string; expiresAt: string;
  step: RegistrationStep; corFile: DocumentPickerAsset | null; orcrFile: DocumentPickerAsset | null;
  motorFile: DocumentPickerAsset | null; preparedCorUrl: string | undefined; corPreview: CorSchedulePreview | null;
};
const emptyRegistration = (): RegistrationDraft => ({ email: '', password: '', confirmPassword: '', sessionToken: '', expiresAt: '',
  step: 'initializing', corFile: null, orcrFile: null, motorFile: null, preparedCorUrl: undefined, corPreview: null });

export type CorRegistrationDraft = { documentUrl: string; recordId: string; version: number; academicYear: string; semester: string;
  college: string; week: CorWeekDay[]; informationConfirmed: boolean };

export type OnboardingProfile = {
  phoneNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  profilePictureUrl: string;
};

export type OnboardingStudent = {
  studentNumber: string;
  course: string;
  section: string;
  yearLevel: number;
};

export type OnboardingPersonnel = {
  idCardNumber: string;
  department: string;
};

export type OnboardingVehicle = {
  plateNumber: string;
  brand: string;
  vehicleType: number;
};

type ProfilePrefill = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
};

type OnboardingState = {
  // Memory only: never add persistence/devtools to credentials or document drafts.
  registration: RegistrationDraft;
  setRegistrationField: <K extends keyof RegistrationDraft>(field: K, value: RegistrationDraft[K]) => void;
  role: Roles | null;
  profile: OnboardingProfile;
  student: OnboardingStudent;
  personnel: OnboardingPersonnel;
  vehicle: OnboardingVehicle;
  corDraft: CorRegistrationDraft | null;
  setCorDraft: (draft: CorRegistrationDraft | null) => void;

  setRole: (role: Roles | null) => void;
  setProfileField: <K extends keyof OnboardingProfile>(
    field: K,
    value: OnboardingProfile[K],
  ) => void;
  setStudentField: <K extends keyof OnboardingStudent>(
    field: K,
    value: OnboardingStudent[K],
  ) => void;
  setPersonnelField: <K extends keyof OnboardingPersonnel>(
    field: K,
    value: OnboardingPersonnel[K],
  ) => void;
  setVehicleField: <K extends keyof OnboardingVehicle>(
    field: K,
    value: OnboardingVehicle[K],
  ) => void;
  setProfilePrefill: (prefill: ProfilePrefill) => void;
  reset: () => void;
};

const defaultProfile: OnboardingProfile = {
  phoneNumber: "",
  firstName: "",
  middleName: "",
  lastName: "",
  profilePictureUrl: "",
};

const defaultStudent: OnboardingStudent = {
  studentNumber: "",
  course: "",
  section: "",
  yearLevel: 0,
};

const defaultPersonnel: OnboardingPersonnel = {
  idCardNumber: "",
  department: "",
};

const defaultVehicle: OnboardingVehicle = {
  plateNumber: "",
  brand: "",
  vehicleType: VehicleType.Motorcycle,
};

const splitDisplayName = (displayName?: string) => {
  if (!displayName) {
    return { firstName: "", lastName: "" };
  }

  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  registration: emptyRegistration(),
  setRegistrationField: (field, value) => set(state => ({ registration: { ...state.registration, [field]: value } })),
  role: null,
  profile: { ...defaultProfile },
  student: { ...defaultStudent },
  personnel: { ...defaultPersonnel },
  vehicle: { ...defaultVehicle },
  corDraft: null,
  setCorDraft: (corDraft) => set({ corDraft }),

  setRole: (role) => set({ role }),

  setProfileField: (field, value) =>
    set((state) => ({
      profile: {
        ...state.profile,
        [field]: value,
      },
    })),

  setStudentField: (field, value) =>
    set((state) => ({
      student: {
        ...state.student,
        [field]: value,
      },
    })),

  setPersonnelField: (field, value) =>
    set((state) => ({
      personnel: {
        ...state.personnel,
        [field]: value,
      },
    })),

  setVehicleField: (field, value) =>
    set((state) => ({
      vehicle: {
        ...state.vehicle,
        [field]: value,
      },
    })),

  setProfilePrefill: (prefill) =>
    set((state) => {
      const displayParts = splitDisplayName(prefill.displayName);
      const nextFirstName =
        state.profile.firstName || prefill.firstName || displayParts.firstName;
      const nextLastName =
        state.profile.lastName || prefill.lastName || displayParts.lastName;

      return {
        profile: {
          ...state.profile,
          firstName: nextFirstName,
          lastName: nextLastName,
        },
      };
    }),

  reset: () =>
    set({
      registration: emptyRegistration(),
      role: null,
      profile: { ...defaultProfile },
      student: { ...defaultStudent },
      personnel: { ...defaultPersonnel },
      vehicle: { ...defaultVehicle },
      corDraft: null,
    }),
}));
