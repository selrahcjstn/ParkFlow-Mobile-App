import type { NewUserRegisterRequest } from "@/types/user";
import { apiRequest } from "./apiRequest";

export const newUserService = {
  register: async (payload: NewUserRegisterRequest) => {
    return apiRequest<unknown, NewUserRegisterRequest>(
      "post",
      "/new-user/register",
      payload,
    );
  },
};
