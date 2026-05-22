import { Roles } from "@/constants/roles";
import { VehicleType } from "@/constants/vehicleType";
import { create } from "zustand";

/* =========================
    TYPES
  ========================= */

export type ParkingSchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type RegisterAccount = {
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

export type RegisterProfile = {
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
};

export type RegisterStudent = {
  studentNumber: string;
  course: string;
  section: string;
  yearLevel: number;
};

export type RegisterPersonnel = {
  idCardNumber: string;
  department: string;
};

export type RegisterVehicle = {
  plateNumber: string;
  brand: string;
  vehicleType: number;
};

export type RegisterCorSubmission = {
  academicTerm: string;
  corDocumentUrl: string;
};

type RegisterState = {
  /* =========================
      TEMP UI STATE
    ========================= */
  selectedRole: Roles | null;

  /* =========================
      DATA
    ========================= */
  account: RegisterAccount;
  profile: RegisterProfile;

  student?: RegisterStudent;
  personnel?: RegisterPersonnel;

  vehicle: RegisterVehicle;

  corSubmission: RegisterCorSubmission;
  parkingSchedules: ParkingSchedule[];

  /* =========================
      SETTERS
    ========================= */
  setSelectedRole: (role: Roles | null) => void;

  setAccountField: <K extends keyof RegisterAccount>(
    field: K,
    value: RegisterAccount[K],
  ) => void;

  setProfileField: <K extends keyof RegisterProfile>(
    field: K,
    value: RegisterProfile[K],
  ) => void;

  setStudentField: <K extends keyof RegisterStudent>(
    field: K,
    value: RegisterStudent[K],
  ) => void;

  setPersonnelField: <K extends keyof RegisterPersonnel>(
    field: K,
    value: RegisterPersonnel[K],
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

/* =========================
    DEFAULT VALUES
  ========================= */

const defaultAccount: RegisterAccount = {
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

const defaultProfile: RegisterProfile = {
  firstName: "",
  lastName: "",
  profilePictureUrl: "",
};

const defaultStudent: RegisterStudent = {
  studentNumber: "",
  course: "",
  section: "",
  yearLevel: 0,
};

const defaultPersonnel: RegisterPersonnel = {
  idCardNumber: "",
  department: "",
};

const defaultVehicle: RegisterVehicle = {
  plateNumber: "",
  brand: "",
  vehicleType: VehicleType.Motorcycle,
};

const defaultCorSubmission: RegisterCorSubmission = {
  academicTerm: "2026-2027",
  corDocumentUrl: "",
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

/* =========================
    STORE
  ========================= */

export const useRegisterStore = create<RegisterState>((set) => ({
  /* =========================
      TEMP UI STATE
    ========================= */
  selectedRole: null,

  /* =========================
      DATA
    ========================= */
  account: { ...defaultAccount },
  profile: { ...defaultProfile },

  student: { ...defaultStudent },
  personnel: { ...defaultPersonnel },

  vehicle: { ...defaultVehicle },

  corSubmission: { ...defaultCorSubmission },
  parkingSchedules: [...defaultParkingSchedules],

  /* =========================
      ROLE
    ========================= */
  setSelectedRole: (role) =>
    set({
      selectedRole: role,
    }),

  /* =========================
      ACCOUNT
    ========================= */
  setAccountField: (field, value) =>
    set((state) => ({
      account: {
        ...state.account,
        [field]: value,
      },
    })),

  /* =========================
      PROFILE
    ========================= */
  setProfileField: (field, value) =>
    set((state) => ({
      profile: {
        ...state.profile,
        [field]: value,
      },
    })),

  /* =========================
      STUDENT
    ========================= */
  setStudentField: (field, value) =>
    set((state) => ({
      student: state.student
        ? {
            ...state.student,
            [field]: value,
          }
        : state.student,
    })),

  /* =========================
      PERSONNEL
    ========================= */
  setPersonnelField: (field, value) =>
    set((state) => ({
      personnel: state.personnel
        ? {
            ...state.personnel,
            [field]: value,
          }
        : state.personnel,
    })),

  /* =========================
      VEHICLE
    ========================= */
  setVehicleField: (field, value) =>
    set((state) => ({
      vehicle: {
        ...state.vehicle,
        [field]: value,
      },
    })),

  /* =========================
      COR SUBMISSION
    ========================= */
  setCorSubmissionField: (field, value) =>
    set((state) => ({
      corSubmission: {
        ...state.corSubmission,
        [field]: value,
      },
    })),

  /* =========================
      SCHEDULE
    ========================= */
  updateParkingSchedule: (dayOfWeek, field, value) =>
    set((state) => ({
      parkingSchedules: state.parkingSchedules.map((s) =>
        s.dayOfWeek === dayOfWeek
          ? {
              ...s,
              [field]: value,
            }
          : s,
      ),
    })),

  /* =========================
      RESET
    ========================= */
  reset: () =>
    set({
      selectedRole: null,

      account: { ...defaultAccount },
      profile: { ...defaultProfile },

      student: { ...defaultStudent },
      personnel: { ...defaultPersonnel },

      vehicle: { ...defaultVehicle },

      corSubmission: { ...defaultCorSubmission },
      parkingSchedules: [...defaultParkingSchedules],
    }),
}));
