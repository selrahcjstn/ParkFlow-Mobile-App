import type { UserProfileResponse } from "@/features/user/types/user.types";
import { apiRequest } from "../../../services/common.service";

export const userService = {
  getProfile: async () => {
    return apiRequest<UserProfileResponse>("get", "/profiles/me");
  },
};
