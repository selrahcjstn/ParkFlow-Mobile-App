import type { ApiResponse } from "@/types/apiResponse";
import * as SecureStore from "expo-secure-store";
import { api } from "./api";

type LoginResult = string;

export const authService = {
  login: async (email: string, password: string) => {
    const res = (await api.post("/users/login", {
      email,
      password,
    })) as ApiResponse<LoginResult>;

    const { isSuccess, data: token } = res;

    if (isSuccess && token) {
      await SecureStore.setItemAsync("token", token);
    }

    return res;
  },
};
