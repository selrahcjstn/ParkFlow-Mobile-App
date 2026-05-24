import type { ReactNode } from "react";
import { Text, View } from "react-native";
import ContentWrapper from "./ContentWrapper";

type TabScreenLayoutProps = {
  title: string;
  children: ReactNode;
  isScrolled?: boolean;
  showHeaderDivider?: boolean;
};

export default function TabScreenLayout({
  title,
  children,
  isScrolled = false,
  showHeaderDivider = false,
}: TabScreenLayoutProps) {
  // ✂️ Completely removed the shadow object to eliminate the "double chin" line.
  // In your new flat minimal theme, a crisp border line handles 100% of the work!
  const shouldShowBorder = showHeaderDivider && isScrolled;

  return (
    <ContentWrapper>
      {/* Outer view is now completely flush at the top */}
      <View className="flex-1">
        {/* HEADER: Moved pt-4 here so the background color runs all the way to the top */}
        <View
          className={`bg-light-background dark:bg-dark-background -mx-5 px-5 pt-4 pb-4 z-10 ${
            shouldShowBorder
              ? "border-b border-light-border dark:border-dark-border"
              : ""
          }`}
        >
          {/* Mapped cleanly to your new font configuration profile */}
          <Text className="font-heavy text-xl text-center text-light-text dark:text-dark-text">
            {title}
          </Text>
        </View>

        {/* CONTENT CANVAS */}
        <View className="flex-1 mt-2">{children}</View>
      </View>
    </ContentWrapper>
  );
}
