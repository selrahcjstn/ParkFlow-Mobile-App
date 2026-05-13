import { create } from "zustand";

export type ParkingSchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type RegisterAccount = {
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string; // UI-only (not sent to backend)
  role: number | null;
};

export type RegisterProfile = {
  idCardNumber: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  course: string;
  section: string;
  yearLevel: string;
  office: string;
};

export type RegisterVehicle = {
  plateNumber: string;
  brand: string;
};

export type RegisterCorSubmission = {
  academicTerm: string;
  corDocumentUrl: string;
};

type RegisterState = {
  account: RegisterAccount;
  profile: RegisterProfile;
  vehicle: RegisterVehicle;
  corSubmission: RegisterCorSubmission;
  parkingSchedules: ParkingSchedule[];

  setAccountField: <K extends keyof RegisterAccount>(
    field: K,
    value: RegisterAccount[K],
  ) => void;
  setProfileField: <K extends keyof RegisterProfile>(
    field: K,
    value: RegisterProfile[K],
  ) => void;
  setVehicleField: <K extends keyof RegisterVehicle>(
    field: K,
    value: RegisterVehicle[K],
  ) => void;
  setCorSubmissionField: <K extends keyof RegisterCorSubmission>(
    field: K,
    value: RegisterCorSubmission[K],
  ) => void;
  updateParkingSchedule: (
    dayOfWeek: number,
    field: "startTime" | "endTime",
    value: string,
  ) => void;
  reset: () => void;
};

const defaultAccount: RegisterAccount = {
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  role: null,
};

const defaultProfile: RegisterProfile = {
  idCardNumber: "",
  firstName: "",
  lastName: "",
  profilePictureUrl: "",
  course: "",
  section: "",
  yearLevel: "",
  office: "",
};

const defaultVehicle: RegisterVehicle = {
  plateNumber: "",
  brand: "",
};

const defaultCorSubmission: RegisterCorSubmission = {
  academicTerm: "2026-2027",
  corDocumentUrl: "https://fake-storage.com/cor/temp-upload.jpg",
};

const defaultParkingSchedules: ParkingSchedule[] = [
  { dayOfWeek: 1, startTime: "", endTime: "" },
  { dayOfWeek: 2, startTime: "", endTime: "" },
  { dayOfWeek: 3, startTime: "", endTime: "" },
  { dayOfWeek: 4, startTime: "", endTime: "" },
  { dayOfWeek: 5, startTime: "", endTime: "" },
  { dayOfWeek: 6, startTime: "", endTime: "" },
  { dayOfWeek: 0, startTime: "", endTime: "" },
];

// Minimal guide:
// - Read: const { account, profile } = useRegisterStore();
// - Update: setAccountField("email", value)
// - Submit: build payload from account/profile/vehicle/schedules
export const useRegisterStore = create<RegisterState>((set) => ({
  account: { ...defaultAccount },
  profile: { ...defaultProfile },
  vehicle: { ...defaultVehicle },
  corSubmission: { ...defaultCorSubmission },
  parkingSchedules: [...defaultParkingSchedules],

  setAccountField: (field, value) =>
    set((state) => ({
      account: { ...state.account, [field]: value },
    })),
  setProfileField: (field, value) =>
    set((state) => ({
      profile: { ...state.profile, [field]: value },
    })),
  setVehicleField: (field, value) =>
    set((state) => ({
      vehicle: { ...state.vehicle, [field]: value },
    })),
  setCorSubmissionField: (field, value) =>
    set((state) => ({
      corSubmission: { ...state.corSubmission, [field]: value },
    })),
  updateParkingSchedule: (dayOfWeek, field, value) =>
    set((state) => ({
      parkingSchedules: state.parkingSchedules.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s,
      ),
    })),
  reset: () =>
    set({
      account: { ...defaultAccount },
      profile: { ...defaultProfile },
      vehicle: { ...defaultVehicle },
      corSubmission: { ...defaultCorSubmission },
      parkingSchedules: [...defaultParkingSchedules],
    }),
}));
