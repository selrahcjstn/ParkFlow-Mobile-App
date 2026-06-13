import { mapOnboardingStep } from "@/features/auth/types/auth.types";
import { userService } from "@/features/user/services/user.service";
import { UserProfileResponse } from "@/features/user/types/user.types";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { create } from "zustand";

type User = {
  id: string;
  name: string;
  middleName?: string;
  email?: string;
  profileType: "student" | "personnel" | "guard" | "unassigned";
  phoneNumber?: string;
  profilePictureUrl?: string;
  studentNumber?: string;
  employeeIdNumber?: string;
  course?: string;
  yearLevel?: number;
  section?: string;
  department?: string;
  corVerificationStatus?: number;
};

type AuthState = {
  token: string | null;
  user: User | null;
  profilePictureUrl: string | null;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setProfilePictureUrl: (url: string | null) => void;
  loadUser: () => Promise<{
    success: boolean;
    message?: string;
    currentOnboardingStep?:
      | "profile"
      | "role"
      | "vehicle"
      | "schedule"
      | "complete"
      | null;
    onboardingStep?:
      | "profile"
      | "role"
      | "vehicle"
      | "schedule"
      | "complete"
      | null;
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
  profilePictureUrl: null,

  setToken: (token) => set({ token }),

  setUser: (user) => set({ user }),

  setProfilePictureUrl: (url) => set({ profilePictureUrl: url }),

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
          return { success: false, message, currentOnboardingStep: "profile", onboardingStep: "profile" };
        }
        throw err;
      }

      if (!profile) {
        return { success: false, currentOnboardingStep: "profile", onboardingStep: "profile" };
      }

      // 2. Prefill onboarding store with backend data
      try {
        const {
          useOnboardingStore,
        } = require("@/features/auth/store/onboarding.store");
        const { Roles } = require("@/constants/roles");
        const store = useOnboardingStore.getState();
        store.setProfileField("firstName", profile.firstName);
        store.setProfileField("middleName", profile.middleName || "");
        store.setProfileField("lastName", profile.lastName);
        store.setProfileField("phoneNumber", profile.phoneNumber);
        store.setProfileField(
          "profilePictureUrl",
          profile.profilePictureUrl || "",
        );

        // Prefill Role
        if (profile.studentNumber) {
          store.setRole(Roles.Student);
        } else if (profile.employeeIdNumber || profile.department) {
          store.setRole(Roles.UniversityStaff);
        } else if (decoded.profile_type === "student") {
          store.setRole(Roles.Student);
        } else if (decoded.profile_type === "personnel") {
          store.setRole(Roles.UniversityStaff);
        }

        // Prefill Student details
        if (profile.studentNumber) {
          store.setStudentField("studentNumber", profile.studentNumber);
          store.setStudentField("course", profile.course || "");
          store.setStudentField("section", profile.section || "");
          store.setStudentField("yearLevel", profile.yearLevel || 0);
        }

        // Prefill Personnel details
        if (profile.employeeIdNumber || profile.department) {
          store.setPersonnelField("idCardNumber", profile.employeeIdNumber || "");
          store.setPersonnelField("department", profile.department || "");
        }
      } catch (_e) {}

      const buildUserObj = (pType: "student" | "personnel" | "guard" | "unassigned"): User => ({
        id: decoded.user_id,
        name: [profile!.firstName, profile!.middleName, profile!.lastName].filter(Boolean).join(" ").trim(),
        middleName: profile!.middleName || undefined,
        email: decoded.email,
        phoneNumber: profile!.phoneNumber,
        profilePictureUrl: profile!.profilePictureUrl || undefined,
        profileType: pType,
        studentNumber: profile!.studentNumber,
        employeeIdNumber: profile!.employeeIdNumber,
        course: profile!.course,
        yearLevel: profile!.yearLevel,
        section: profile!.section,
        department: profile!.department,
        corVerificationStatus: profile!.corVerificationStatus,
      });

      // 3. Use backend-provided onboardingStep as the source of truth
      const dbStep = mapOnboardingStep(profile.onboardingStep);
      if (dbStep) {
        if (dbStep === "complete") {
          const user = buildUserObj(
            decoded.profile_type !== "unassigned"
              ? decoded.profile_type
              : "student"
          );
          set({ user, profilePictureUrl: profile.profilePictureUrl || null });
          return { success: true };
        } else {
          const user = buildUserObj(decoded.profile_type);
          set({ user, profilePictureUrl: profile.profilePictureUrl || null });
          return { success: false, currentOnboardingStep: dbStep, onboardingStep: dbStep };
        }
      }

      // 4. Fallback: check JWT claims if backend didn't provide step
      if (decoded.profile_type === "unassigned") {
        const user = buildUserObj("unassigned");
        set({ user, profilePictureUrl: profile.profilePictureUrl || null });
        return { success: false, currentOnboardingStep: "role", onboardingStep: "role" };
      }

      // 5. Check vehicle for students/personnel
      if (
        decoded.profile_type === "student" ||
        decoded.profile_type === "personnel"
      ) {
        let hasVehicle = false;
        try {
          const {
            useVehicleStore,
          } = require("@/features/user/store/vehicle.store");
          await useVehicleStore.getState().loadVehicle();
          const vehicleState = useVehicleStore.getState();
          hasVehicle = !!vehicleState.vehicle;

          // Prefill vehicle in onboarding store
          if (vehicleState.vehicle) {
            const {
              useOnboardingStore,
            } = require("@/features/auth/store/onboarding.store");
            const store = useOnboardingStore.getState();
            store.setVehicleField("plateNumber", vehicleState.vehicle.plateNumber);
            store.setVehicleField("brand", vehicleState.vehicle.brand);
            store.setVehicleField("vehicleType", vehicleState.vehicle.vehicleType);
          }
        } catch (_e) {}

        if (!hasVehicle) {
          const user = buildUserObj(decoded.profile_type);
          set({ user, profilePictureUrl: profile.profilePictureUrl || null });
          return { success: false, currentOnboardingStep: "vehicle", onboardingStep: "vehicle" };
        }
      }

      // 6. Onboarding fully complete
      const user = buildUserObj(decoded.profile_type);

      set({ user, profilePictureUrl: profile.profilePictureUrl || null });
      return { success: true };
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load user";
      if (err?.response?.status === 403) {
        await SecureStore.deleteItemAsync("token");
        set({ token: null, user: null, profilePictureUrl: null });
      }
      return { success: false, message };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("token");

    try {
      const { queryClient } = require("@/services/queryClient");
      queryClient.clear();
    } catch (_e) {}

    try {
      const {
        useOnboardingStore,
      } = require("@/features/auth/store/onboarding.store");
      useOnboardingStore.getState().reset();
    } catch (_e) {}

    try {
      const {
        useVehicleStore,
      } = require("@/features/user/store/vehicle.store");
      useVehicleStore.getState().clearVehicle();
    } catch (_e) {}

    try {
      const {
        useViolationStore,
      } = require("@/features/violation/store/violation.store");
      useViolationStore.setState({
        activeViolation: null,
        violationCount: 0,
        activeViolationsList: [],
        isLoadingActiveViolations: false,
      });
    } catch (_e) {}

    try {
      const {
        useHistoryStore,
      } = require("@/features/history/store/history.store");
      useHistoryStore.setState({
        parkingHistory: [],
        generatedAt: null,
        loading: false,
        loadingMore: false,
        error: null,
        page: 1,
        hasMore: true,
      });
    } catch (_e) {}

    try {
      const {
        useParkingSessionStore,
      } = require("@/features/session/store/parking-session.store");
      useParkingSessionStore.setState({
        activeSession: null,
        parkingSessionStats: null,
        sessionLoading: false,
        statsLoading: false,
        sessionLastFetched: null,
        statsLastFetched: null,
        error: null,
      });
    } catch (_e) {}

    set({
      token: null,
      user: null,
      profilePictureUrl: null,
    });
  },
}));
