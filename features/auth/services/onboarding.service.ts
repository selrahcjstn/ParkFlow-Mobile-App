import type {
    OnboardingPersonnelRequest,
    OnboardingProfileRequest,
    OnboardingRoleRequest,
    OnboardingStudentRequest,
    OnboardingVehicleRequest,
} from "@/features/auth/types/onboarding.types";
import { apiRequest } from "@/services/common.service";

export const onboardingService = {
  updateProfile: async (payload: OnboardingProfileRequest) => {
    return apiRequest<unknown, OnboardingProfileRequest>(
      "patch",
      "/onboarding/profile",
      payload,
    );
  },

  updateStudent: async (payload: OnboardingStudentRequest) => {
    return apiRequest<unknown, OnboardingStudentRequest>(
      "patch",
      "/onboarding/student",
      payload,
    );
  },

  updatePersonnel: async (payload: OnboardingPersonnelRequest) => {
    return apiRequest<unknown, OnboardingPersonnelRequest>(
      "patch",
      "/onboarding/personnel",
      payload,
    );
  },

  updateVehicle: async (payload: OnboardingVehicleRequest) => {
    return apiRequest<unknown, OnboardingVehicleRequest>(
      "patch",
      "/onboarding/vehicle",
      payload,
    );
  },

  updateRole: async (payload: OnboardingRoleRequest) => {
    return apiRequest<unknown, OnboardingRoleRequest>(
      "patch",
      "/onboarding/role",
      payload,
    );
  },
};
