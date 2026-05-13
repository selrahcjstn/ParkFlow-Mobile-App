import type { ApiResponse } from "@/types/apiResponse";
import type { NewUserRegisterRequest } from "@/types/new-user";
import { api } from "./api";

export const newUserService = {
  register: async (payload: NewUserRegisterRequest) => {
    const res = (await api.post(
      "/new-user/register",
      payload,
    )) as ApiResponse<unknown>;
    return res;
  },
};
