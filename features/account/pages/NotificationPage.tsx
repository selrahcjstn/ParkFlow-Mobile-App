import { ContentWrapper } from "@/components/layouts";
import { useNavigation } from "expo-router";
import React, { useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
    NotificationList,
    NotificationPreferences,
} from "../components/notification";

type FilterTab = "all" | "system" | "activity";

export default function NotificationPage() {
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
            ? "bg-light-background dark:bg-dark-surfaceMuted border-light-border dark:border-dark-border"
            : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
        }`}
      >
        <Text
          className={`text-[12.5px] uppercase tracking-wider ${
            isActive
              ? "font-black text-light-text dark:text-dark-text"
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
        {/* Toggle Preferences Card */}
        <NotificationPreferences />

        {/* Filters and List Title */}
        <View className="mb-4">
          <Text className="text-light-muted font-heavy text-[11px] uppercase tracking-wider mb-3.5 px-0.5">
            Notifications Log
          </Text>

          {/* Filter Bar */}
          <View className="flex-row gap-2">
            {renderTabButton("all", "All")}
            {renderTabButton("system", "System")}
            {renderTabButton("activity", "Activity")}
          </View>
        </View>

        {/* Categorized mock alerts log */}
        <NotificationList activeTab={activeTab} />
      </ScrollView>
    </ContentWrapper>
  );
}
