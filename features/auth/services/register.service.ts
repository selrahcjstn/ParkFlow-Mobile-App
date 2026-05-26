import type {
  AuthTokenResponseData,
  ManualRegisterRequest,
} from "@/features/auth/types/auth.types";
import type {
  MicrosoftAuthRequest,
  MicrosoftAuthResponseData,
} from "@/features/auth/types/microsoft.types";
import { apiRequest } from "../../../services/common.service";

export const newUserService = {
  register: async (payload: ManualRegisterRequest) => {
    return apiRequest<AuthTokenResponseData, ManualRegisterRequest>(
      "post",
      "/auth/register",
      payload,
    );
  },

  registerMicrosoft: async (payload: MicrosoftAuthRequest) => {
    return apiRequest<MicrosoftAuthResponseData, MicrosoftAuthRequest>(
      "post",
      "/auth/microsoft",
      payload,
    );
  },
};
