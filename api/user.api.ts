import type { UserProfileResponse } from "@/types/user";
import { apiRequest } from "./common.api";

export const userService = {
  getProfile: async () => {
    return apiRequest<UserProfileResponse>("get", "/profiles/me");
  },
};
