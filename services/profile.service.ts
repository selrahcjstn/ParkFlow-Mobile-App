import type { ApiResponse } from "@/types/apiResponse";
import type { UserProfileResponse } from "@/types/user";
import { api } from "./api";

export const userService = {
  getProfile: async () => {
    const res = (await api.get(
      "/profiles/me",
    )) as ApiResponse<UserProfileResponse>;
    return res;
  },
};
