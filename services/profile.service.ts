import type { ApiResponse } from "@/types/apiResponse";
import type { ProfileRequest } from "@/types/profile";
import { api } from "./api";

export const profileService = {
    createProfile: async (body: ProfileRequest) => {
        const res = (await api.post("/profiles/create", body)) as ApiResponse<string>;
        return res;
    }
};

