import { create } from "zustand";

export type ScheduleRequest = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

type RegisterState = {
  // step 1
  email: string;
  contactNumber: string;
  password: string;
  confirmPassword: string;

  // step 2
  firstName: string;
  lastName: string;
  role: number | null;
  course: string;
  section: string;
  yearLevel: string;
  office: string;
  idNumber: string;

  // step 3
  plateNumber: string;
  brand: string;

  // schedules (step 4 or part of step 2 depending on your UI)
  schedules: ScheduleRequest[];

  // actions
  setField: (field: string, value: any) => void;

  setSchedules: (schedules: ScheduleRequest[]) => void;

  updateSchedule: (
    dayOfWeek: string,
    field: "startTime" | "endTime",
    value: string,
  ) => void;

  reset: () => void;
};

// default 7-day schedule
const defaultSchedules: ScheduleRequest[] = [
  { dayOfWeek: "Monday", startTime: "", endTime: "" },
  { dayOfWeek: "Tuesday", startTime: "", endTime: "" },
  { dayOfWeek: "Wednesday", startTime: "", endTime: "" },
  { dayOfWeek: "Thursday", startTime: "", endTime: "" },
  { dayOfWeek: "Friday", startTime: "", endTime: "" },
  { dayOfWeek: "Saturday", startTime: "", endTime: "" },
  { dayOfWeek: "Sunday", startTime: "", endTime: "" },
];

export const useRegisterStore = create<RegisterState>((set) => ({
  // step 1
  email: "",
  contactNumber: "",
  password: "",
  confirmPassword: "",

  // step 2
  firstName: "",
  lastName: "",
  role: null,
  course: "",
  section: "",
  yearLevel: "",
  office: "",
  idNumber: "",

  // step 3
  plateNumber: "",
  brand: "",

  // schedules
  schedules: defaultSchedules,

  // generic field setter
  setField: (field, value) =>
    set((state) => ({
      ...state,
      [field]: value,
    })),

  // replace all schedules
  setSchedules: (schedules) =>
    set(() => ({
      schedules,
    })),

  // update specific day schedule
  updateSchedule: (dayOfWeek, field, value) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s,
      ),
    })),

  // reset everything
  reset: () =>
    set({
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
