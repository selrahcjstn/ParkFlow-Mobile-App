import * as SecureStore from "expo-secure-store";
import { apiRequest } from "./apiRequest";

type LoginResult = string;

export const authService = {
  login: async (email: string, password: string) => {
    const res = await apiRequest<
      LoginResult,
      { email: string; password: string }
    >("post", "/users/login", {
      email,
      password,
    });

    const { isSuccess, data: token } = res;

    if (isSuccess && token) {
      await SecureStore.setItemAsync("token", token);
    }

    return res;
  },
};
