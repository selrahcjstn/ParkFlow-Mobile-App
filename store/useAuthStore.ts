import { Roles } from "@/constants/roles";
import { userService } from "@/services/profile.service";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

type User = {
  name: string;
  role: Roles;
};

type AuthState = {
  token: string | null;
  user: User | null;

  setToken: (token: string) => void;
  setUser: (user: User) => void;

  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setToken: (token) => set({ token }),

  setUser: (user) => set({ user }),

  loadUser: async () => {
    // get token from phone storage
    const token = await SecureStore.getItemAsync("token");

    // if no token stop
    if (!token) return;

    // save token to zustand
    set({ token });

    // fetch profile from API (expects `firstName`, `lastName`, and optionally `role`)
    const res = await userService.getProfile();
    const profile = res?.data as any;

    const user: User = {
      name: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
      role: typeof profile?.role === "number" ? profile.role : Roles.Student,
    };

    set({ user });
  },

  logout: async () => {
    // remove token from phone storage
    await SecureStore.deleteItemAsync("token");

    // clear zustand
    set({
      token: null,
      user: null,
    });
  },
}));
