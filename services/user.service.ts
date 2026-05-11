import type { ApiResponse } from "@/types/apiResponse";
import type { UserProfile } from "@/types/user";
import { api } from "./api";

export const userService = {
    getProfile: async () => {
        const res = (await api.get("/profiles/me")) as ApiResponse<UserProfile>;
        return res;
    },
};