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
};

export type RegisterCorSubmission = {
  academicTerm: string;
  corDocumentUrl: string;
};

type RegisterState = {
  account: RegisterAccount;
  profile: RegisterProfile;

  student?: RegisterStudent;
  personnel?: RegisterPersonnel;

  vehicles: RegisterVehicle[];

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

  setStudentField: <K extends keyof RegisterStudent>(
    field: K,
    value: RegisterStudent[K],
  ) => void;

  setPersonnelField: <K extends keyof RegisterPersonnel>(
    field: K,
    value: RegisterPersonnel[K],
  ) => void;

  setVehicleField: (
    index: number,
    field: keyof RegisterVehicle,
    value: string,
  ) => void;

  addVehicle: () => void;

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

export const useRegisterStore = create<RegisterState>((set) => ({
  account: { ...defaultAccount },
  profile: { ...defaultProfile },

  student: { ...defaultStudent },
  personnel: undefined,

  vehicles: [],

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

  setStudentField: (field, value) =>
    set((state) => ({
      student: state.student
        ? { ...state.student, [field]: value }
        : state.student,
    })),

  setPersonnelField: (field, value) =>
    set((state) => ({
      personnel: state.personnel
        ? { ...state.personnel, [field]: value }
        : state.personnel,
    })),

  setVehicleField: (index, field, value) =>
    set((state) => {
      const updated = [...state.vehicles];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { vehicles: updated };
    }),

  addVehicle: () =>
    set((state) => ({
      vehicles: [...state.vehicles, { ...defaultVehicle }],
    })),

  setCorSubmissionField: (field, value) =>
    set((state) => ({
      corSubmission: {
        ...state.corSubmission,
        [field]: value,
      },
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
      student: { ...defaultStudent },
      personnel: undefined,
      vehicles: [],
      corSubmission: { ...defaultCorSubmission },
      parkingSchedules: [...defaultParkingSchedules],
    }),
}));
