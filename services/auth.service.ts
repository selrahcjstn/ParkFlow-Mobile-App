import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

export const authService = {
    login: async (email: string, password: string) => {
        const res = await api.post("/users/login", {
            email,
            password,
        });

        if (res.data.isSuccess) {
            await AsyncStorage.setItem("token", res.data.token);
        }

        return res.data;
    },
};