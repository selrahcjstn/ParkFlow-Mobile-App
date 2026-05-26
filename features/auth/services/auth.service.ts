import type { ManualRegisterRequest } from "@/features/auth/types/auth.types";

import type { AuthResponse } from "@/features/auth/types/auth.types";
import type {
  MicrosoftAuthRequest,
  MicrosoftAuthResponseData,
} from "@/features/auth/types/microsoft.types";

import * as SecureStore from "expo-secure-store";
import { apiRequest } from "../../../services/common.service";

type LoginPayload = {
  email: string;
  password: string;
};

export const authService = {
  login: async (email: string, password: string) => {
    const res = await apiRequest<AuthResponse, LoginPayload>(
      "post",
      "/users/login",
      {
        email,
        password,
      },
    );

    const token = res?.data?.token;

    if (res?.isSuccess && token) {
      await SecureStore.setItemAsync("token", token);
    }

    return res;
  },

  register: async (payload: ManualRegisterRequest) => {
    const res = await apiRequest<AuthResponse, ManualRegisterRequest>(
      "post",
      "/auth/register",
      payload,
    );

    const token = res?.data?.token;

    if (res?.isSuccess && token) {
      await SecureStore.setItemAsync("token", token);
    }

    return res;
  },

  microsoftAuth: async (payload: MicrosoftAuthRequest) => {
    const res = await apiRequest<
      MicrosoftAuthResponseData,
      MicrosoftAuthRequest
    >("post", "/auth/microsoft", payload);

    const token = res?.data?.token;

    if (res?.isSuccess && token) {
      await SecureStore.setItemAsync("token", token);
    }

    return res;
  },
};
