import { ChevronLeft, X } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

export interface AppHeaderProps {
  title?: string;
  backIconType?: "back" | "close";
  onBack?: () => void;
  showBorderOnScroll?: boolean;
  hasScrolled?: boolean;
  rightElement?: React.ReactNode;
  centerElement?: React.ReactNode;
}

export default function AppHeader({
  title,
  backIconType = "close",
  onBack,
  showBorderOnScroll = true,
  hasScrolled = false,
  rightElement,
  centerElement,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const showBorder = showBorderOnScroll && hasScrolled;

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 16) }}
      className={`bg-light-background dark:bg-dark-background px-4 pb-3 flex-row justify-between items-center z-10 ${
        showBorder ? "border-b border-light-border/80 dark:border-dark-border/80 shadow-sm" : ""
      }`}
    >
      {/* Left button slot */}
      <View className="w-10 h-10 justify-center">
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 -ml-2 items-center justify-center rounded-full"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {backIconType === "back" ? (
              <ChevronLeft size={28} color={colors.text} />
            ) : (
              <X size={28} color={colors.text} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Center title/element slot */}
      <View className="flex-1 items-center justify-center px-2">
        {centerElement ? (
          centerElement
        ) : title ? (
          <Text className="font-heavy text-[16px] text-light-text dark:text-dark-text tracking-wide text-center" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      {/* Right slot to keep alignment perfectly balanced */}
      <View className="w-10 h-10 items-end justify-center">
        {rightElement}
      </View>
    </View>
  );
}
