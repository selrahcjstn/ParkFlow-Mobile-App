import { mapOnboardingStep } from "@/features/auth/types/auth.types";
import { userService } from "@/features/user/services/user.service";
import { UserProfileResponse } from "@/features/user/types/user.types";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { create } from "zustand";

type User = {
  id: string;
  name: string;
  email?: string;
  profileType: "student" | "personnel" | "guard" | "unassigned";
  phoneNumber?: string;
};

type AuthState = {
  token: string | null;
  user: User | null;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  loadUser: () => Promise<{
    success: boolean;
    message?: string;
    onboardingStep?: "profile" | "role" | "vehicle" | null;
  }>;
  logout: () => Promise<void>;
};

type JwtPayload = {
  sub: string;
  email: string;
  profile_type: "student" | "personnel" | "guard" | "unassigned";
  user_id: string;
  onboarding_step?: number | string;
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
      const decoded = jwtDecode<JwtPayload>(token);

      // 1. Try to fetch profile from backend
      let profile: UserProfileResponse | null = null;
      try {
        const res = await userService.getProfile();
        if (res?.isSuccess) {
          profile = res.data;
        }
      } catch (err: any) {
        // If profile fetch fails with 401 or missing profile, user needs profile step
        const message = err?.response?.data?.message || err?.message || "";
        if (err?.response?.status === 401 || /profile/i.test(message)) {
          return { success: false, message, onboardingStep: "profile" };
        }
        throw err;
      }

      if (!profile) {
        return { success: false, onboardingStep: "profile" };
      }

      // 2. Prefill onboarding store with backend data
      try {
        const { useOnboardingStore } = require("@/features/auth/store/onboarding.store");
        const store = useOnboardingStore.getState();
        store.setProfileField("firstName", profile.firstName);
        store.setProfileField("lastName", profile.lastName);
        store.setProfileField("phoneNumber", profile.phoneNumber);
        store.setProfileField("profilePictureUrl", profile.profilePictureUrl || "");
      } catch (_e) {}

      // 3. Use backend-provided onboardingStep as the source of truth
      const dbStep = mapOnboardingStep(profile.onboardingStep);
      if (dbStep) {
        if (dbStep === "complete") {
          const user: User = {
            id: decoded.user_id,
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            email: decoded.email,
            phoneNumber: profile.phoneNumber,
            profileType: decoded.profile_type !== "unassigned" ? decoded.profile_type : "student",
          };
          set({ user });
          return { success: true };
        } else {
          const user: User = {
            id: decoded.user_id,
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            email: decoded.email,
            phoneNumber: profile.phoneNumber,
            profileType: decoded.profile_type,
          };
          set({ user });
          return { success: false, onboardingStep: dbStep };
        }
      }

      // 4. Fallback: check JWT claims if backend didn't provide step
      if (decoded.profile_type === "unassigned") {
        const user: User = {
          id: decoded.user_id,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          email: decoded.email,
          phoneNumber: profile.phoneNumber,
          profileType: "unassigned",
        };
        set({ user });
        return { success: false, onboardingStep: "role" };
      }

      // 5. Check vehicle for students/personnel
      if (decoded.profile_type === "student" || decoded.profile_type === "personnel") {
        let hasVehicle = false;
        try {
          const { useVehicleStore } = require("@/features/user/store/vehicle.store");
          await useVehicleStore.getState().loadVehicle();
          hasVehicle = !!useVehicleStore.getState().vehicle;
        } catch (_e) {}

        if (!hasVehicle) {
          const user: User = {
            id: decoded.user_id,
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            email: decoded.email,
            phoneNumber: profile.phoneNumber,
            profileType: decoded.profile_type,
          };
          set({ user });
          return { success: false, onboardingStep: "vehicle" };
        }
      }

      // 6. Onboarding fully complete
      const user: User = {
        id: decoded.user_id,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: decoded.email,
        phoneNumber: profile.phoneNumber,
        profileType: decoded.profile_type,
      };

      set({ user });
      return { success: true };
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load user";
      return { success: false, message };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("token");

    try {
      const { useOnboardingStore } = require("@/features/auth/store/onboarding.store");
      useOnboardingStore.getState().reset();
    } catch (_e) {}

    set({
      token: null,
      user: null,
    });
  },
}));
