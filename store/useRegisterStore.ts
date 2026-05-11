import { create } from "zustand";


export type Role =
    | "student"
    | "staff"
    | "nonacademic"
    | "";

type RegisterState = {
    // step 1
    email: string;
    contactNumber: string;
    password: string;
    confirmPassword: string;

    // step 2
    firstName: string;
    lastName: string;
    role: Role;
    courseInfo: string;
    office: string;
    idNumber: string;

    // step 3
    plateNumber: string;
    brand: string;

    // Actions
    setField: (field: string, value: string) => void;
    reset: () => void;
};

export const useRegisterStore = create<RegisterState>((set) => ({
    email: "",
    contactNumber: "",
    password: "",
    confirmPassword: "",

    firstName: "",
    lastName: "",
    role: "",
    courseInfo: "",
    office: "",
    idNumber: "",

    plateNumber: "",
    brand: "",

    setField: (field, value) =>
        set((state) => ({
            ...state,
            [field]: value,
        })),
    reset: () =>
        set({
            email: "",
            contactNumber: "",
            password: "",
            confirmPassword: "",

            firstName: "",
            lastName: "",
            role: "",

            courseInfo: "",
            office: "",
            idNumber: "",

            plateNumber: "",
            brand: "",
        }),
}));