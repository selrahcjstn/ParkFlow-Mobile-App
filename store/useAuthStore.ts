import AsyncStorage from "@react-native-async-storage/async-storage";
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
            const storedToken = await AsyncStorage.getItem("token");

            if (storedToken) {
                set({ token: storedToken });

                try {
                    const res = await userService.getProfile();

                    if (res.isSuccess && res.data) {
                        set({ user: res.data });
                    }
                    // If isSuccess is false but no throw, profile just doesn't exist yet
                } catch (profileError: any) {
                    const status = profileError?.response?.status;

                    if (status === 404) {
                        // Profile not created yet — that's OK, user is still authenticated
                        console.log("[loadUser] Profile not found (404), proceeding without profile");
                    } else if (status === 401) {
                        // Token is actually invalid — destroy session
                        await AsyncStorage.removeItem("token");
                        set({ token: null, user: null });
                        return false;
                    } else {
                        console.log("[loadUser] Profile fetch error:", profileError?.message);
                    }
                }

                return true; // Token exists and is valid
            }
            return false; // No token at all
        } catch (error: any) {
            console.log("[loadUser] CAUGHT ERROR:", error?.message);
            await AsyncStorage.removeItem("token");
            set({ token: null, user: null });
            return false;
        } finally {
            set({ isLoading: false, isInitialized: true });
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem("token");
        set({ token: null, user: null });
    },
}));