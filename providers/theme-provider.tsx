import React, { createContext, useEffect, useState } from "react";
import { useColorScheme as useNativeColorScheme } from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themeColors, AppThemeColors } from "../constants/colors";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemePreference;
  isDark: boolean;
  colors: AppThemeColors;
  setTheme: (theme: ThemePreference) => Promise<void>;
  isLoaded: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@parkflow_theme_preference";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const nativeColorScheme = useNativeColorScheme();
  const { setColorScheme: setNWColorScheme } = useNativeWindColorScheme();
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
          setThemeState(savedTheme);
          setNWColorScheme(savedTheme);
        } else {
          setNWColorScheme("system");
        }
      } catch (error) {
        console.error("Failed to load theme preference", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, [setNWColorScheme]);

  const setTheme = async (newTheme: ThemePreference) => {
    try {
      setThemeState(newTheme);
      setNWColorScheme(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Failed to save theme preference", error);
    }
  };

  const resolvedIsDark =
    theme === "system"
      ? nativeColorScheme === "dark"
      : theme === "dark";

  const colors = resolvedIsDark ? themeColors.dark : themeColors.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark: resolvedIsDark, colors, setTheme, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}
