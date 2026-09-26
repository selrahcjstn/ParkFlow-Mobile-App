import { useAppTheme } from "@/hooks/useAppTheme";
import {
  BellRing,
  MailCheck,
  MessageSquareCode,
  Volume2,
  Vibrate,
  Car,
  AlertTriangle,
  Settings2,
  SlidersHorizontal,
} from "lucide-react-native";
import React, { useState } from "react";
import { Switch, Text, View } from "react-native";

export default function NotificationPreferences() {
  const { colors } = useAppTheme();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [parkingAlerts, setParkingAlerts] = useState(true);
  const [violationAlerts, setViolationAlerts] = useState(true);
  const iconColor = colors.text;

  return (
    <View className="gap-5">
      {/* Alert Channels Card */}
      <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
            <Settings2 size={18} color={iconColor} strokeWidth={2.2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
            Notification Channels
          </Text>
        </View>

        <View className="gap-3.5 mt-1">
          {/* Push notification */}
          <View className="flex-row items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <BellRing size={16} color="#71717A" />
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                  Push Notifications
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                  Instant updates on status changes & alerts
                </Text>
              </View>
            </View>
            <Switch
              value={push}
              onValueChange={setPush}
              trackColor={{ false: "#ECECF0", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#ECECF0"
            />
          </View>

          {/* Email Alerts */}
          <View className="flex-row items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <MailCheck size={16} color="#71717A" />
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                  Email Digests
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                  Monthly reports and compliance receipts
                </Text>
              </View>
            </View>
            <Switch
              value={email}
              onValueChange={setEmail}
              trackColor={{ false: "#ECECF0", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#ECECF0"
            />
          </View>

          {/* SMS alerts */}
          <View className="flex-row items-center justify-between pb-0.5">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <MessageSquareCode size={16} color="#71717A" />
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                  SMS Broadcast Updates
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                  Critical emergency text broadcasts
                </Text>
              </View>
            </View>
            <Switch
              value={sms}
              onValueChange={setSms}
              trackColor={{ false: "#ECECF0", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#ECECF0"
            />
          </View>
        </View>
      </View>

      {/* Sound & Vibration Card */}
      <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
            <Volume2 size={18} color={iconColor} strokeWidth={2.2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
            Sound & Vibration
          </Text>
        </View>

        <View className="gap-3.5 mt-1">
          {/* Sound */}
          <View className="flex-row items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Volume2 size={16} color="#71717A" />
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                  Notification Sounds
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                  Play audible tone for incoming alerts
                </Text>
              </View>
            </View>
            <Switch
              value={sound}
              onValueChange={setSound}
              trackColor={{ false: "#ECECF0", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#ECECF0"
            />
          </View>

          {/* Vibration */}
          <View className="flex-row items-center justify-between pb-0.5">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Vibrate size={16} color="#71717A" />
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                  Vibration
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                  Haptic feedback on notification arrival
                </Text>
              </View>
            </View>
            <Switch
              value={vibration}
              onValueChange={setVibration}
              trackColor={{ false: "#ECECF0", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#ECECF0"
            />
          </View>
        </View>
      </View>

      {/* Category Preferences Card */}
      <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
            <SlidersHorizontal size={18} color={iconColor} strokeWidth={2.2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
            Notification Categories
          </Text>
        </View>

        <View className="gap-3.5 mt-1">
          {/* Parking Updates */}
          <View className="flex-row items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Car size={16} color="#71717A" />
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                  Parking & Session Updates
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                  Time-remaining reminders and checkpoint entries
                </Text>
              </View>
            </View>
            <Switch
              value={parkingAlerts}
              onValueChange={setParkingAlerts}
              trackColor={{ false: "#ECECF0", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#ECECF0"
            />
          </View>

          {/* Violation Alerts */}
          <View className="flex-row items-center justify-between pb-0.5">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <AlertTriangle size={16} color="#71717A" />
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                  Violations & Penalty Notices
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                  Immediate alerts for overstay & violation fees
                </Text>
              </View>
            </View>
            <Switch
              value={violationAlerts}
              onValueChange={setViolationAlerts}
              trackColor={{ false: "#ECECF0", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#ECECF0"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
