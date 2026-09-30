import { mapOnboardingStep } from "@/features/auth/types/auth.types";
import { userService } from "@/features/user/services/user.service";
import { UserProfileResponse } from "@/features/user/types/user.types";
import { SecureStore } from "@/services/storage";
import { connection } from "@/services/signalr";
import { jwtDecode } from "jwt-decode";
import { create } from "zustand";

type User = {
  id: string;
  name: string;
  middleName?: string;
  email?: string;
  profileType: "student" | "personnel" | "guard" | "unassigned";
  role?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  studentNumber?: string;
  employeeIdNumber?: string;
  course?: string;
  yearLevel?: number;
  section?: string;
  department?: string;
  status?: string;
  corVerificationStatus?: number;
  rejectionReason?: string;
  rejectedTarget?: string;
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
      | "documents"
      | "complete"
      | null;
    onboardingStep?:
      | "profile"
      | "role"
      | "vehicle"
      | "schedule"
      | "documents"
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

  setToken: (token) => {
    set({ token });
    void connection.restart();
  },

  setUser: (user) => set({ user }),

  setProfilePictureUrl: (url) => set({ profilePictureUrl: url }),

  loadUser: async () => {
    const token = await SecureStore.getItemAsync("token");

    if (!token) return { success: false, message: "No token" };

    set({ token });

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log("🔐 [loadUser] JWT profile_type:", decoded.profile_type);

      // ─── GUARD: skip everything, go straight to guard UI ──────────────
      if (decoded.profile_type === "guard") {
        console.log("🛡️ [loadUser] Guard detected → returning success");
        set({
          user: {
            id: decoded.user_id,
            name: decoded.email,
            email: decoded.email,
            profileType: "guard",
          },
          profilePictureUrl: null,
        });
        return { success: true };
      }
      // ──────────────────────────────────────────────────────────────────

      // 1. Try to fetch profile from backend
      let profile: UserProfileResponse | null = null;
      try {
        const res = await userService.getProfile();
        if (res?.isSuccess) {
          profile = res.data;
        }
      } catch (err: any) {
        // If profile fetch fails with 401, 404, or missing profile, user needs profile step
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err?.message || "";
        if (status === 401 || status === 404 || /profile/i.test(message) || /not found/i.test(message)) {
          console.log(`ℹ️ [loadUser] Profile not yet created (status ${status}) → routing to profile step`);
          return { success: false, message, currentOnboardingStep: "profile", onboardingStep: "profile" };
        }
        throw err;
      }

      if (!profile) {
        console.log("❌ [loadUser] No profile returned — routing to profile step");
        return { success: false, currentOnboardingStep: "profile", onboardingStep: "profile" };
      }

      console.log("✅ [loadUser] Profile fetched:", JSON.stringify({
        firstName: profile.firstName,
        lastName: profile.lastName,
        onboardingStep: profile.onboardingStep,
        corVerificationStatus: profile.corVerificationStatus,
        studentNumber: profile.studentNumber,
        employeeIdNumber: profile.employeeIdNumber,
        department: profile.department,
      }));

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
        if (profile.role === "NonAcademicPersonnel" || profile.role === "Staff") {
          store.setRole(Roles.NonAcademicPersonnel);
        } else if (profile.role === "UniversityStaff" || profile.role === "Faculty") {
          store.setRole(Roles.UniversityStaff);
        } else if (profile.studentNumber) {
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
        role: profile!.role || (profile!.studentNumber ? "Student" : (profile!.employeeIdNumber ? "UniversityStaff" : undefined)),
        studentNumber: profile!.studentNumber,
        employeeIdNumber: profile!.employeeIdNumber,
        course: profile!.course,
        yearLevel: profile!.yearLevel,
        section: profile!.section,
        department: profile!.department,
        status: profile!.status,
        corVerificationStatus: profile!.corVerificationStatus,
        rejectionReason: profile!.rejectionReason,
        rejectedTarget: profile!.rejectedTarget,
      });

      // 2.5 Check if account is suspended
      if (profile.status?.toLowerCase() === "suspended") {
        console.log("⛔ [loadUser] Account clearance is suspended");
        const user = buildUserObj(decoded.profile_type || "unassigned");
        set({ user, profilePictureUrl: profile.profilePictureUrl || null });
        return { success: false, message: "Account clearance suspended" };
      }

      // 3. Sequential Onboarding Progress Verification
      const isGuard = (decoded.profile_type as string) === "guard";
      if (isGuard) {
        console.log("🛡️ [loadUser] Guard detected → returning success");
        const user = buildUserObj("guard");
        set({ user, profilePictureUrl: profile.profilePictureUrl || null });
        return { success: true };
      }

      // Step 1: Basic Profile
      const hasProfile =
        Boolean(profile.firstName?.trim()) &&
        Boolean(profile.lastName?.trim()) &&
        Boolean(profile.phoneNumber?.trim());

      if (!hasProfile) {
        console.log("🧭 [loadUser] Profile incomplete → routing to profile step");
        const user = buildUserObj("unassigned");
        set({ user, profilePictureUrl: profile.profilePictureUrl || null });
        return { success: false, currentOnboardingStep: "profile", onboardingStep: "profile" };
      }

      // Step 2: Role Information (Student or Personnel)
      const isHighSchool = Boolean(profile.yearLevel && profile.yearLevel >= 7 && profile.yearLevel <= 10);
      const hasStudentInfo =
        Boolean(profile.studentNumber?.trim()) &&
        (isHighSchool || Boolean(profile.course?.trim())) &&
        Boolean(profile.section?.trim()) &&
        Boolean(profile.yearLevel && profile.yearLevel > 0);

      const hasPersonnelInfo =
        Boolean(profile.employeeIdNumber?.trim()) &&
        Boolean(profile.department?.trim());

      const hasRole = hasStudentInfo || hasPersonnelInfo;

      if (!hasRole) {
        console.log("🧭 [loadUser] Role details incomplete → routing to role step");
        const pType = decoded.profile_type !== "unassigned" ? decoded.profile_type : "unassigned";
        const user = buildUserObj(pType);
        set({ user, profilePictureUrl: profile.profilePictureUrl || null });
        return { success: false, currentOnboardingStep: "role", onboardingStep: "role" };
      }

      const activeProfileType: "student" | "personnel" = hasStudentInfo ? "student" : "personnel";

      // Step 3: Vehicle Information
      let hasVehicle = false;
      try {
        const { useVehicleStore } = require("@/features/user/store/vehicle.store");
        await useVehicleStore.getState().loadVehicle();
        const vehicleState = useVehicleStore.getState();
        hasVehicle = Boolean(vehicleState.vehicle?.plateNumber);

        if (vehicleState.vehicle) {
          const { useOnboardingStore } = require("@/features/auth/store/onboarding.store");
          const store = useOnboardingStore.getState();
          store.setVehicleField("plateNumber", vehicleState.vehicle.plateNumber || "");
          store.setVehicleField("brand", vehicleState.vehicle.brand || "");
          if (vehicleState.vehicle.vehicleType !== undefined) {
            store.setVehicleField("vehicleType", vehicleState.vehicle.vehicleType);
          }
        }
      } catch (_e) {}

      const dbStep = mapOnboardingStep(profile.onboardingStep);
      const isAlreadyOnboarded = dbStep === "complete" || (profile.onboardingStep !== undefined && Number(profile.onboardingStep) >= 5);

      if (!hasVehicle && !isAlreadyOnboarded) {
        console.log("🧭 [loadUser] Vehicle incomplete → routing to vehicle step");
        const user = buildUserObj(activeProfileType);
        set({ user, profilePictureUrl: profile.profilePictureUrl || null });
        return { success: false, currentOnboardingStep: "vehicle", onboardingStep: "vehicle" };
      }

      // Step 4: Schedule
      let isScheduleDone = isAlreadyOnboarded || (profile.onboardingStep !== undefined && Number(profile.onboardingStep) >= 4);

      if (!isScheduleDone) {
        try {
          const { scheduleService } = require("@/features/account/services/schedule.service");
          const schedRes = await scheduleService.getSchedules();
          if (schedRes?.isSuccess && Array.isArray(schedRes.data) && schedRes.data.length > 0) {
            isScheduleDone = true;
          }
        } catch (_e) {}
      }

      if (!isScheduleDone) {
        console.log("🧭 [loadUser] Schedule incomplete → routing to schedule step");
        const user = buildUserObj(activeProfileType);
        set({ user, profilePictureUrl: profile.profilePictureUrl || null });
        return { success: false, currentOnboardingStep: "schedule", onboardingStep: "schedule" };
      }

      // Step 5: Documents / COR
      const isCorRejected = profile.corVerificationStatus === 3;
      const isCorSubmittedOrVerified =
        profile.corVerificationStatus === 1 || profile.corVerificationStatus === 2;

      if (!isAlreadyOnboarded && (isCorRejected || !isCorSubmittedOrVerified)) {
        console.log("🧭 [loadUser] Documents rejected or incomplete → routing to documents step");
        const user = buildUserObj(activeProfileType);
        set({ user, profilePictureUrl: profile.profilePictureUrl || null });
        return { success: false, currentOnboardingStep: "documents", onboardingStep: "documents" };
      }

      // Step 6: All onboarding steps completed
      console.log("✅ [loadUser] All onboarding steps complete → profileType:", activeProfileType);
      const user = buildUserObj(activeProfileType);
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

    try {
      const {
        useNotificationStore,
      } = require("@/features/notification/store/notification.store");
      useNotificationStore.getState().clearNotifications();
    } catch (_e) {}

    set({
      token: null,
      user: null,
      profilePictureUrl: null,
    });
  },
}));
