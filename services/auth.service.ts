import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

export const authService = {
    login: async (email: string, password: string) => {
        const res = await api.post("/users/login", {
            email,
            password,
        });

        if (res.data.isSuccess && res.data.data) {
            await AsyncStorage.setItem("token", res.data.data);
        }

        return res.data;
    },
};