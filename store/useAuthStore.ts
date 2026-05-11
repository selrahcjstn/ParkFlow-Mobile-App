import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { userService } from "../services/user.service";
import type { UserProfile } from "../types/user";

type AuthState = {
    token: string | null;
    user: UserProfile | null;
    isLoading: boolean;

    setToken: (token: string) => void;
    loadUser: () => Promise<void>;
    logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isLoading: false,

    setToken: (token) => set({ token }),

    loadUser: async () => {
        set({ isLoading: true });

        try {
            const res = await userService.getProfile();

            if (res.isSuccess) {
                set({ user: res.data });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem("token");
        set({ token: null, user: null });
    },
}));