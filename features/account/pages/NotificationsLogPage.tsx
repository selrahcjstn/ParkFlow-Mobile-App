import { ContentWrapper } from "@/components/layouts";
import { ChevronRight, Settings } from "lucide-react-native";
import { router, useNavigation } from "expo-router";
import React, { useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NotificationList } from "../components/notification";

type FilterTab = "all" | "system" | "activity";

export default function NotificationsLogPage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  // Filter state
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        navigation.setParams({ hasScrolled: scrolled } as any);
      }
    }
  };

  const renderTabButton = (tab: FilterTab, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setActiveTab(tab)}
        className={`flex-1 py-2 rounded-button items-center justify-center border ${
          isActive
            ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
            : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
        }`}
      >
        <Text
          className={`text-[12.5px] uppercase tracking-wider ${
            isActive
              ? "font-black text-blue-600 dark:text-blue-400"
              : "font-heavy text-light-muted dark:text-dark-muted"
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ContentWrapper noPaddingY>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Navigation shortcut to Notification Settings */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/(settings)/notification" as any)}
          className="flex-row items-center justify-between bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4 mb-5 shadow-soft"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-button bg-blue-50 dark:bg-blue-500/10 items-center justify-center">
              <Settings size={18} color="#3B82F6" strokeWidth={2.2} />
            </View>
            <View>
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13.5px]">
                Notification Preferences
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                Manage alert channels, sound, and vibration
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#A1A1AA" />
        </TouchableOpacity>

        {/* Filters and List Title */}
        <View className="mb-4">
          <Text className="text-light-muted font-heavy text-[11px] uppercase tracking-wider mb-3 px-0.5">
            Notifications Log
          </Text>

          {/* Filter Bar */}
          <View className="flex-row gap-2">
            {renderTabButton("all", "All")}
            {renderTabButton("system", "System")}
            {renderTabButton("activity", "Activity")}
          </View>
        </View>

        {/* Categorized alerts log */}
        <NotificationList activeTab={activeTab} />
      </ScrollView>
    </ContentWrapper>
  );
}
