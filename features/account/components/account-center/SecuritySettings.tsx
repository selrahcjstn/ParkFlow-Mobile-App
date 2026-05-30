import { AppButton } from "@/components/ui";
import { KeyRound, ShieldAlert, Smartphone } from "lucide-react-native";
import React, { useState } from "react";
import { Switch, Text, View } from "react-native";

interface SecuritySettingsProps {
  onTriggerPasswordReset: () => void;
}

export default function SecuritySettings({
  onTriggerPasswordReset,
}: SecuritySettingsProps) {
  const [twoFactor, setTwoFactor] = useState(false);
  const [biometrics, setBiometrics] = useState(true);

  return (
    <View className="bg-light-surface rounded-card border border-light-border/40 p-5 shadow-soft mt-5">
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-9 h-9 rounded-button bg-light-danger/10 items-center justify-center">
          <KeyRound size={18} color="#D22730" strokeWidth={2.2} />
        </View>
        <Text className="text-light-text font-black text-[15px] tracking-tight">
          Security & Privacy
        </Text>
      </View>

      {/* Toggles */}
      <View className="gap-3.5 mt-1 mb-5">
        {/* Two Factor */}
        <View className="flex-row items-center justify-between border-b border-light-border/30 pb-3">
          <View className="flex-row items-center gap-2">
            <Smartphone size={15} color="#71717A" />
            <View>
              <Text className="text-light-text font-heavy text-[13px]">
                Two-Factor Authentication (2FA)
              </Text>
              <Text className="text-light-muted font-regular text-[11px] mt-0.5">
                Secure your login sessions
              </Text>
            </View>
          </View>
          <Switch
            value={twoFactor}
            onValueChange={setTwoFactor}
            trackColor={{ false: "#ECECF0", true: "#D22730" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#ECECF0"
          />
        </View>

        {/* Biometrics */}
        <View className="flex-row items-center justify-between pb-0.5">
          <View className="flex-row items-center gap-2">
            <ShieldAlert size={15} color="#71717A" />
            <View>
              <Text className="text-light-text font-heavy text-[13px]">
                Biometric Identity Verification
              </Text>
              <Text className="text-light-muted font-regular text-[11px] mt-0.5">
                Quick lock using Face ID / Fingerprint
              </Text>
            </View>
          </View>
          <Switch
            value={biometrics}
            onValueChange={setBiometrics}
            trackColor={{ false: "#ECECF0", true: "#D22730" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#ECECF0"
          />
        </View>
      </View>

      {/* Change Password button */}
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
