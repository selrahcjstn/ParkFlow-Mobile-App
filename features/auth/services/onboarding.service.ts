import type {
    OnboardingPersonnelRequest,
    OnboardingProfileRequest,
    OnboardingRoleRequest,
    OnboardingStudentRequest,
    OnboardingVehicleRequest,
} from "@/features/auth/types/onboarding.types";
import { apiRequest } from "@/services/common.service";
import { userService } from "@/features/user/services/user.service";
import { getRegistrationErrorMessage } from "@/utils/registrationError";

type RegistrationFile = { uri: string; name?: string | null };

export const onboardingService = {
  checkIdAvailability: async (number: string, role: string) =>
    apiRequest<boolean>("get", `/onboarding/id-availability?number=${encodeURIComponent(number)}&role=${encodeURIComponent(role)}`),
  // Both registration screens use this sequence and stop at the first failed step.
  submitDocuments: async (cor: RegistrationFile, orcr: RegistrationFile, motor: RegistrationFile) => {
    async function upload(file: RegistrationFile, label: string, defaultName: string,
      request: typeof userService.uploadCorDocument): Promise<string> {
      try {
        const response = await request(file.uri, file.name || defaultName, "");
        const data = response?.data ?? response?.result;
        const url = typeof data === "string" ? data : (data as any)?.secureUrl || (data as any)?.url;
        if (!response?.isSuccess) throw new Error(getRegistrationErrorMessage(response));
        if (typeof url !== "string" || !url.trim())
          throw new Error("The uploaded file link was missing. Please try again.");
        return url;
      } catch (error) {
        throw new Error(`${label}: ${getRegistrationErrorMessage(error)}`);
      }
    }
    const corDocumentUrl = await upload(cor, "COR / Employee ID", `cor_${Date.now()}.pdf`, userService.uploadCorDocument);
    const orcrDocumentUrl = await upload(orcr, "OR/CR document", `orcr_${Date.now()}.jpg`, userService.uploadOrcrDocument);
    const motorPictureUrl = await upload(motor, "Vehicle picture", `motor_${Date.now()}.jpg`, userService.uploadMotorPicture);
    const result = await onboardingService.updateCor({ academicTerm: "2024-2025", corDocumentUrl, orcrDocumentUrl, motorPictureUrl });
    if (!result?.isSuccess) throw new Error(getRegistrationErrorMessage(result));
    return result;
  },
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

  updateSchedule: async (
    payload: import("@/features/auth/types/onboarding.types").OnboardingScheduleRequest,
  ) => {
    return apiRequest<
      unknown,
      import("@/features/auth/types/onboarding.types").OnboardingScheduleRequest
    >("patch", "/onboarding/schedule", payload);
  },

  updateCor: async (
    payload: import("@/features/auth/types/onboarding.types").OnboardingCorRequest,
  ) => {
    return apiRequest<
      unknown,
      import("@/features/auth/types/onboarding.types").OnboardingCorRequest
    >("patch", "/onboarding/cor", payload);
  },

  updateRole: async (payload: OnboardingRoleRequest) => {
    return apiRequest<unknown, OnboardingRoleRequest>(
      "patch",
      "/onboarding/role",
      payload,
    );
  },
};
