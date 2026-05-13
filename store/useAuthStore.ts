import { Roles } from "@/constants/roles";
import { userService } from "@/services/user.service";
import { UserProfileResponse } from "@/types/user";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

type User = {
  name: string;
  role: Roles;
  phoneNumber: string | undefined;
};

type AuthState = {
  token: string | null;
  user: User | null;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  loadUser: () => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setToken: (token) => set({ token }),

  setUser: (user) => set({ user }),

  loadUser: async () => {
    // get token from phone storage
    const token = await SecureStore.getItemAsync("token");

    // if no token stop
    if (!token) return { success: false, message: "No token" };

    // save token to zustand
    set({ token });

    try {
      // fetch profile from API (expects `firstName`, `lastName`, and optionally `role`)
      const res = await userService.getProfile();

      if (!res?.isSuccess) {
        return { success: false, message: res?.message || "Profile not found" };
      }

      const profile = res.data as UserProfileResponse;

      const user: User = {
        name: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
        role: typeof profile?.role === "number" ? profile.role : Roles.Student,
        phoneNumber: profile?.phoneNumber || undefined,
      };

      set({ user });
      return { success: true };
    } catch (err: any) {
      console.error(
        "[auth] loadUser error:",
        err?.response?.data || err?.message || err,
      );
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load profile";
      return { success: false, message };
    }
  },

  logout: async () => {
    // remove token from phone storage
    await SecureStore.deleteItemAsync("token");

    // clear zustand
    set({
      token: null,
      user: null,
    });
  },
}));
