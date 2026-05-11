import { create } from "zustand";

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

    // Actions
    setField: (field: string, value: any) => void;
    reset: () => void;
};

export const useRegisterStore = create<RegisterState>((set) => ({
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
            role: null,

            course: "",
            section: "",
            yearLevel: "",
            office: "",
            idNumber: "",

            plateNumber: "",
            brand: "",
        }),
}));