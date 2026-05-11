import type { ApiResponse } from "@/types/apiResponse";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
            await AsyncStorage.setItem("token", token);
        }

        return res;
    },
};