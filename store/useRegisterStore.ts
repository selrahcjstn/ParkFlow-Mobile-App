import { create } from "zustand";

export type ScheduleRequest = {
  submissionId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type RegisterState = {
  userId: string | null; // ⬅️ ADDED THIS
  submissionId: string | null;
  academicTerm: string;
  corDocumentUrl: string;

  setSubmission: (data: {
    submissionId: string;
    academicTerm: string;
    corDocumentUrl: string;
  }) => void;

  email: string;
  contactNumber: string;
  password: string;
  confirmPassword: string;

  firstName: string;
  lastName: string;
  role: number | null;
  course: string;
  section: string;
  yearLevel: string;
  office: string;
  idNumber: string;

  plateNumber: string;
  brand: string;

  schedules: ScheduleRequest[];

  setField: (field: string, value: any) => void;
  setSchedules: (schedules: ScheduleRequest[]) => void;

  updateSchedule: (
    dayOfWeek: number,
    field: "startTime" | "endTime",
    value: string,
  ) => void;

  reset: () => void;
};

const defaultSchedules: ScheduleRequest[] = [
  { dayOfWeek: 1, startTime: "", endTime: "" },
  { dayOfWeek: 2, startTime: "", endTime: "" },
  { dayOfWeek: 3, startTime: "", endTime: "" },
  { dayOfWeek: 4, startTime: "", endTime: "" },
  { dayOfWeek: 5, startTime: "", endTime: "" },
  { dayOfWeek: 6, startTime: "", endTime: "" },
  { dayOfWeek: 0, startTime: "", endTime: "" },
];

export const useRegisterStore = create<RegisterState>((set) => ({
  userId: null, // ⬅️ DEFAULT STATE
  submissionId: null,
  academicTerm: "2026-2027",
  corDocumentUrl: "https://fake-storage.com/cor/temp-upload.jpg",

  setSubmission: (data) =>
    set(() => ({
      submissionId: data.submissionId,
      academicTerm: data.academicTerm,
      corDocumentUrl: data.corDocumentUrl,
    })),

  email: "",
  contactNumber: "",
  password: "",
  confirmPassword: "",

  firstName: "",
  lastName: "",
  role: null,
  course: "",
  section: "",
  yearLevel: "",
  office: "",
  idNumber: "",

  plateNumber: "",
  brand: "",

  schedules: defaultSchedules,

  setField: (field, value) =>
    set((state) => ({
      ...state,
      [field]: value,
    })),

  setSchedules: (schedules) =>
    set(() => ({
      schedules,
    })),

  updateSchedule: (dayOfWeek, field, value) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s,
      ),
    })),

  reset: () =>
    set({
      userId: null, // ⬅️ CLEARS ON RESET
      submissionId: null,
      academicTerm: "2026-2027",
      corDocumentUrl: "https://fake-storage.com/cor/temp-upload.jpg",

      email: "",
      contactNumber: "",
      password: "",
      confirmPassword: "",

      firstName: "",
      lastName: "",
      role: null,

      course: "",
      section: "",
      yearLevel: "",
      office: "",
      idNumber: "",

      plateNumber: "",
      brand: "",

      schedules: defaultSchedules,
    }),
}));
