import { useAppTheme } from "@/hooks/useAppTheme";
import { Keyboard, LogOut, QrCode } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

interface GuardActionButtonsProps {
  onSearch?: () => void;
  onExit?: () => void;
  onScan?: () => void;
}

export default function GuardActionButtons({ onSearch, onExit, onScan }: GuardActionButtonsProps) {
  const { colors } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 768 && fontScale < 1.5;
  const actions = [
    { title: "Manual entry", subtitle: "Search a plate • Registered users & visitors", icon: Keyboard, onPress: onSearch },
    { title: "Scan QR code", subtitle: "Check a registered parking pass", icon: QrCode, onPress: onScan },
    { title: "Record exit", subtitle: "Find a plate and check out", icon: LogOut, onPress: onExit },
  ];

  return (
    <View className="mt-5">
      <Text className="text-light-text dark:text-dark-text font-bold text-2xl">Gate controls</Text>
      <Text className="text-light-muted dark:text-dark-muted font-regular text-sm mt-1 mb-4">
        Choose an action to record vehicle entry or exit.
      </Text>
      <View className={wide ? "flex-row gap-4" : "gap-3"}>
        {actions.map(action => (
          <TouchableOpacity
            key={action.title}
            accessibilityRole="button"
            accessibilityLabel={action.title}
            accessibilityHint={action.subtitle}
            onPress={action.onPress}
            activeOpacity={0.75}
            className={`rounded-card border p-5 min-h-[112px] justify-center bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border ${wide ? "flex-1" : ""}`}
          >
            <View className="flex-row items-center gap-4">
              <action.icon size={30} color={colors.primary} strokeWidth={2} />
              <View className="flex-1">
                <Text className="font-bold text-xl text-light-text dark:text-dark-text">
                  {action.title}
                </Text>
                <Text className="font-regular text-sm mt-2 text-light-muted dark:text-dark-muted">
                  {action.subtitle}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
