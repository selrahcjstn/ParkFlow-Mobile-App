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
  driversLicenseUrl?: string | null; licenseStatus?: number | string; licenseRejectionReason?: string | null;
  studentNumber?: string;
  employeeIdNumber?: string;
  course?: string;
  yearLevel?: number;
  section?: string;
  department?: string;
  status?: string;
  corVerificationStatus?: number;
  scheduleVerificationStatus?: number;
  rejectionReason?: string;
  rejectedTarget?: string;
  onboardingStep?: number | string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  profilePictureUrl: string | null;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setEmail: (email: string) => void;
  setProfilePictureUrl: (url: string | null) => void;
  loadUser: () => Promise<{
    success: boolean;
    message?: string;
    sessionExpired?: boolean;
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

  setEmail: (email) =>
    set((state) => ({
      user: state.user ? { ...state.user, email } : null,
    })),

  setProfilePictureUrl: (url) => set({ profilePictureUrl: url }),

  loadUser: async () => {
    const token = await SecureStore.getItemAsync("token");

    if (!token) return { success: false, message: "No token", sessionExpired: true };

    set({ token });
    const endInvalidSession = async (message: string) => {
      // A response from an older session must not sign out a newly signed-in account.
      if (await SecureStore.getItemAsync("token") !== token) return { success: false, message: "The session changed. Please try again." };
      await useAuthStore.getState().logout();
      return { success: false, message, sessionExpired: true };
    };

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log("🔐 [loadUser] JWT profile_type:", decoded.profile_type);

      // ─── GUARD: skip everything, go straight to guard UI ──────────────
      if (decoded.profile_type === "guard") {
        console.log("🛡️ [loadUser] Guard detected → returning success");
        let guardProfile: UserProfileResponse | null = null;
        try {
          const res = await userService.getProfile();
          if (res?.isSuccess) guardProfile = res.data;
        } catch {}

        set({
          user: {
            id: decoded.user_id,
            name: decoded.email,
            email: guardProfile?.email || decoded.email,
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
        // Only an actual missing profile means onboarding is incomplete.
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err?.message || "";
        if (status === 404) {
          // Older APIs use 404 for both deleted accounts and valid accounts without
          // a profile. Confirm account existence before resuming onboarding.
          try {
            const credentials = await userService.getUserCredentials();
            if (!credentials?.isSuccess) {
              if (Number(credentials?.errorCode) === 404) return await endInvalidSession("This account no longer exists. Create a new account.");
              throw new Error(credentials?.message || "Could not check your account. Please try again.");
            }
          } catch (accountError: any) {
            if (accountError?.response?.status === 404) return await endInvalidSession("This account no longer exists. Create a new account.");
            throw accountError;
          }
          if (await SecureStore.getItemAsync("token") !== token) return { success: false, message: "The session changed. Please try again." };
          set({ user: null, profilePictureUrl: null });
          console.log(`ℹ️ [loadUser] Profile not yet created (status ${status}) → routing to profile step`);
          return { success: false, message, currentOnboardingStep: "profile", onboardingStep: "profile" };
        }
        throw err;
      }

      if (await SecureStore.getItemAsync("token") !== token) return { success: false, message: "The session changed. Please try again." };

      if (!profile) {
        throw new Error("Could not check your account. Please try again.");
      }

      console.log("✅ [loadUser] Profile fetched:", JSON.stringify({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
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
        email: profile!.email || decoded.email,
        phoneNumber: profile!.phoneNumber,
        profilePictureUrl: profile!.profilePictureUrl || undefined,
        driversLicenseUrl: profile!.driversLicenseUrl, licenseStatus: profile!.licenseStatus, licenseRejectionReason: profile!.licenseRejectionReason,
        profileType: pType,
        onboardingStep: profile!.onboardingStep,
        role: profile!.role || (profile!.studentNumber ? "Student" : (profile!.employeeIdNumber ? "UniversityStaff" : undefined)),
        studentNumber: profile!.studentNumber,
        employeeIdNumber: profile!.employeeIdNumber,
        course: profile!.course,
        yearLevel: profile!.yearLevel,
        section: profile!.section,
        department: profile!.department,
        status: profile!.status,
        corVerificationStatus: profile!.corVerificationStatus,
        scheduleVerificationStatus: profile!.scheduleVerificationStatus,
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
      {
        const { useVehicleStore } = require("@/features/user/store/vehicle.store");
        const loaded = await useVehicleStore.getState().loadVehicle(true);
        if (!loaded) throw new Error("Could not check your vehicles. Please try again.");
        if (await SecureStore.getItemAsync("token") !== token) return { success: false, message: "The session changed. Please try again." };
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
      }

      const dbStep = mapOnboardingStep(profile.onboardingStep);
      const isAlreadyOnboarded = dbStep === "complete" || (profile.onboardingStep !== undefined && Number(profile.onboardingStep) >= 5);

      if (!hasVehicle && !isAlreadyOnboarded) {
        console.log("🧭 [loadUser] Vehicle incomplete → routing to vehicle step");
        const user = buildUserObj(activeProfileType);
        set({ user, profilePictureUrl: profile.profilePictureUrl || null });
        return { success: false, currentOnboardingStep: "vehicle", onboardingStep: "vehicle" };
      }

      // Step 4: Schedule
      let isScheduleDone = activeProfileType === "personnel" || isAlreadyOnboarded || (profile.onboardingStep !== undefined && Number(profile.onboardingStep) >= 4);

      if (!isScheduleDone) {
        {
          const { ScheduleService } = require("@/features/schedule/services/schedule.service");
          const schedRes = await ScheduleService.getSchedules();
          if (!schedRes?.isSuccess) throw new Error("Could not check your schedule. Please try again.");
          if (Array.isArray(schedRes.data) && schedRes.data.length > 0) {
            isScheduleDone = true;
          }
        }
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
        [1, 2, 4, 5, 6].includes(profile.corVerificationStatus ?? 0);

      // Scanning the COR now precedes the remaining uploads. The server marks Done
      // only after document completion, so a restart must resume those uploads.
      if ((!isAlreadyOnboarded || isCorRejected || !isCorSubmittedOrVerified) &&
          (!isAlreadyOnboarded || profile.status?.toLowerCase() !== "active")) {
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
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        return await endInvalidSession(message);
      }
      return { success: false, message };
    }
  },

  logout: async () => {
    try { require("@/features/violation/store/violation.store").useViolationStore.getState().resetFinancialState(); } catch (_e) {}
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
