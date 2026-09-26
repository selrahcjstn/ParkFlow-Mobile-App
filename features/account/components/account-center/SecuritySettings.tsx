import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { KeyRound, ShieldAlert, Smartphone } from "lucide-react-native";
import React, { useState } from "react";
import { Switch, Text, View } from "react-native";

interface SecuritySettingsProps {
  onTriggerPasswordReset: () => void;
}

export default function SecuritySettings({
  onTriggerPasswordReset,
}: SecuritySettingsProps) {
  const { colors, isDark } = useAppTheme();
  const [twoFactor, setTwoFactor] = useState(false);
  const [biometrics, setBiometrics] = useState(true);
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

      <View className="gap-3.5 mt-1 mb-5">
        <View className="flex-row items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
          <View className="flex-row items-center gap-2">
            <Smartphone size={15} color="#71717A" />
            <View>
              <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                Two-Factor Authentication (2FA)
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                Secure your login sessions
              </Text>
            </View>
          </View>
          <Switch
            value={twoFactor}
            onValueChange={setTwoFactor}
            trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.surfaceMuted}
          />
        </View>

        <View className="flex-row items-center justify-between pb-0.5">
          <View className="flex-row items-center gap-2">
            <ShieldAlert size={15} color="#71717A" />
            <View>
              <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                Biometric Identity Verification
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                Quick lock using Face ID / Fingerprint
              </Text>
            </View>
          </View>
          <Switch
            value={biometrics}
            onValueChange={setBiometrics}
            trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.surfaceMuted}
          />
        </View>
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
