import type {
  MicrosoftAuthRequest,
  MicrosoftAuthResponse,
} from "@/features/auth/types/microsoft.types";
import type { NewUserRegisterRequest } from "@/features/user/types/user.types";
import { apiRequest } from "../../../services/common.service";

export const newUserService = {
  register: async (payload: NewUserRegisterRequest) => {
    return apiRequest<unknown, NewUserRegisterRequest>(
      "post",
      "/new-user/register",
      payload,
    );
  },

  registerMicrosoft: async (payload: MicrosoftAuthRequest) => {
    return apiRequest<MicrosoftAuthResponse, MicrosoftAuthRequest>(
      "post",
      "/users/login-microsoft",
      payload,
    );
  },
};
