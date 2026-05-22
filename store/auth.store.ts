import { userService } from "@/api/user.api";
import { UserProfileResponse } from "@/types/user";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { create } from "zustand";
import { useVehicleStore } from "./vehicle.store";

type User = {
  id: string;
  name: string;
  profileType: "student" | "personnel";
  phoneNumber?: string;
};

type AuthState = {
  token: string | null;
  user: User | null;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  loadUser: () => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
};

type JwtPayload = {
  sub: string;
  email: string;
  profile_type: "student" | "personnel";
  user_id: string;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setToken: (token) => set({ token }),

  setUser: (user) => set({ user }),

  loadUser: async () => {
    const token = await SecureStore.getItemAsync("token");

    if (!token) return { success: false, message: "No token" };

    set({ token });

    try {
      // decode JWT (NO need to call API for role/type anymore)
      const decoded = jwtDecode<JwtPayload>(token);

      // still fetch profile details (name, phone, etc.)
      const res = await userService.getProfile();

      if (!res?.isSuccess) {
        return { success: false, message: res?.message || "Profile not found" };
      }

      const profile = res.data as UserProfileResponse;

      const user: User = {
        id: decoded.user_id,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        phoneNumber: profile.phoneNumber,
        profileType: decoded.profile_type,
      };

      set({ user });

      return { success: true };
    } catch (err: any) {
      console.error("[auth] loadUser error");

      const message =
        err?.response?.data?.message || err?.message || "Failed to load user";

      return { success: false, message };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    useVehicleStore.getState().clearVehicle();

    set({
      token: null,
      user: null,
    });
  },
}));
