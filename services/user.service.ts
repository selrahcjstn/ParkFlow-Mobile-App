import type { UserProfileResponse } from "@/types/user";
import type { VehicleResponse } from "@/types/vehicle";
import { apiRequest } from "./apiRequest";

export const userService = {
  getProfile: async () => {
    return apiRequest<UserProfileResponse>("get", "/profiles/me");
  },
  getVehicles: async () => {
    return apiRequest<VehicleResponse[]>("get", "/vehicles/owner/my");
  },
};
