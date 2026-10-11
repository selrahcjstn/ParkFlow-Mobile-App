import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { KeyRound } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface SecuritySettingsProps {
  onTriggerPasswordReset: () => void;
}

export default function SecuritySettings({
  onTriggerPasswordReset,
}: SecuritySettingsProps) {
  const { colors } = useAppTheme();
  const iconColor = colors.text;

  return (
    <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft mt-5">
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-9 h-9 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
          <KeyRound size={18} color={iconColor} strokeWidth={2.2} />
        </View>
        <Text className="text-light-text dark:text-dark-text font-bold text-[15px] tracking-tight">
          Security & Privacy
        </Text>
      </View>

      <AppButton
        label="Change Password"
        variant="outline"
        uppercase={false}
        className="w-full mt-1.5"
        onPress={onTriggerPasswordReset}
      />
    </View>
  );
}
