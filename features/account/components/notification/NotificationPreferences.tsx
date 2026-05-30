import { BellRing, MailCheck, MessageSquareCode, Settings2 } from "lucide-react-native";
import React, { useState } from "react";
import { Switch, Text, View } from "react-native";

export default function NotificationPreferences() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);

  return (
    <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft mb-6">
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-9 h-9 rounded-button bg-light-accent/10 items-center justify-center">
          <Settings2 size={18} color="#D22730" strokeWidth={2.2} />
        </View>
        <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
          Alert Preferences
        </Text>
      </View>

      <View className="gap-3.5 mt-1">
        {/* Push notification */}
        <View className="flex-row items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
          <View className="flex-row items-center gap-2">
            <BellRing size={15} color="#71717A" />
            <View>
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                Push Notifications
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                Instant updates on status changes
              </Text>
            </View>
          </View>
          <Switch
            value={push}
            onValueChange={setPush}
            trackColor={{ false: "#ECECF0", true: "#D22730" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#ECECF0"
          />
        </View>

        {/* Email Alerts */}
        <View className="flex-row items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
          <View className="flex-row items-center gap-2">
            <MailCheck size={15} color="#71717A" />
            <View>
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
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
            trackColor={{ false: "#ECECF0", true: "#D22730" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#ECECF0"
          />
        </View>

        {/* SMS alerts */}
        <View className="flex-row items-center justify-between pb-0.5">
          <View className="flex-row items-center gap-2">
            <MessageSquareCode size={15} color="#71717A" />
            <View>
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                SMS Broadcast updates
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                Critical emergency text broadcasts
              </Text>
            </View>
          </View>
          <Switch
            value={sms}
            onValueChange={setSms}
            trackColor={{ false: "#ECECF0", true: "#D22730" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#ECECF0"
          />
        </View>
      </View>
    </View>
  );
}
