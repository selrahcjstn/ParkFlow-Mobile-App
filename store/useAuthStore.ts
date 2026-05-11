import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { userService } from "../services/user.service";
import type { UserProfile } from "../types/user";

type AuthState = {
    token: string | null;
    user: UserProfile | null;
    isLoading: boolean;
    isInitialized: boolean;

    setToken: (token: string) => void;
    loadUser: () => Promise<boolean>;
    logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isLoading: false,
    isInitialized: false,

    setToken: (token) => set({ token }),

    loadUser: async () => {
        set({ isLoading: true });

        try {
            const storedToken = await SecureStore.getItemAsync("token");

            if (storedToken) {
                set({ token: storedToken });

                try {
                    const res = await userService.getProfile();

                    if (res.isSuccess && res.data) {
                        set({ user: res.data });
                    }
                } catch (profileError: any) {
                    const status = profileError?.response?.status;

                    if (status === 401) {
                        await SecureStore.deleteItemAsync("token");
                        set({ token: null, user: null });
                        return false;
                    }
                }

                return true;
            }
            return false;
        } catch (error: any) {
            await SecureStore.deleteItemAsync("token");
            set({ token: null, user: null });
            return false;
        } finally {
            set({ isLoading: false, isInitialized: true });
        }
    },

    logout: async () => {
        await SecureStore.deleteItemAsync("token");
        set({ token: null, user: null });
    },
}));