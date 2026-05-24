import type { ReactNode } from "react";
import { Text, View, useColorScheme } from "react-native";
import ContentWrapper from "./ContentWrapper";

type TabScreenLayoutProps = {
  title: string;
  children: ReactNode;
  isScrolled?: boolean; // Simple boolean flipped by your page ScrollView
};

export default function TabScreenLayout({
  title,
  children,
  isScrolled = false,
}: TabScreenLayoutProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Strict bottom-only shadow (tight radius and vertical offset so it doesn't bleed out the sides)
  const headerStyle =
    isScrolled && !isDark
      ? {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 3 }, // Pushes shadow down only
          shadowOpacity: 0.05,
          shadowRadius: 2.5, // Tight bounds to prevent top or side bleeding
          elevation: 3, // Android edge tracking
        }
      : {
          elevation: 0,
          shadowOpacity: 0,
        };

  return (
    <ContentWrapper>
      <View className="flex-1">
        {/* HEADER CONTAINER */}
        <View
          className={`bg-light-background dark:bg-dark-background -mx-5 px-5 pt-4 pb-3 z-10 ${
            isScrolled && isDark
              ? "border-b border-dark-border"
              : "border-b border-transparent"
          }`}
          style={headerStyle}
        >
          <Text className="font-bold text-xl text-center text-light-text dark:text-dark-text">
            {title}
          </Text>
        </View>

        {/* CONTENT CANVAS */}
        <View className="flex-1 mt-0">{children}</View>
      </View>
    </ContentWrapper>
  );
}
