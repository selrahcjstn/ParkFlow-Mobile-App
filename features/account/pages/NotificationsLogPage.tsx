import { ContentWrapper } from "@/components/layouts";
import { CheckCheck } from "lucide-react-native";
import { useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NotificationList } from "../components/notification";
import { useNotificationStore } from "@/features/notification/store/notification.store";
import { useAppTheme } from "@/hooks/useAppTheme";

type FilterTab = "all" | "unread" | "approvals" | "overdue";

export default function NotificationsLogPage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const { colors, isDark } = useAppTheme();

  const {
    notifications,
    markAllAsRead,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
  } = useNotificationStore();

  useEffect(() => {
    const unsub = useNotificationStore.getState().initRealtimeListeners();
    useNotificationStore.getState().syncRealNotifications();
    return unsub;
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount(),
    ]);
  };

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
        className={`px-3 py-1.5 rounded-full flex-row items-center border self-start ${
          isActive
            ? "bg-blue-50 dark:bg-blue-500/15 border-blue-400 dark:border-blue-500/50"
            : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
        }`}
      >
        <Text
          className={`text-[10.5px] uppercase tracking-wide ${
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 40, flexGrow: 1 }}
      >
        {/* Header Title & Mark All Read bar */}
        <View className="flex-row items-center justify-between mb-2.5 px-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-light-muted font-heavy text-[11px] uppercase tracking-wider">
              Notifications Log
            </Text>
            {unreadCount > 0 && (
              <View className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30">
                <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400">
                  {unreadCount} UNREAD
                </Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={markAllAsRead}
              className="flex-row items-center gap-1 py-1 px-2 rounded-lg bg-blue-50 dark:bg-blue-500/10"
            >
              <CheckCheck size={14} color="#3B82F6" strokeWidth={2.2} />
              <Text className="text-[11px] font-heavy text-blue-600 dark:text-blue-400">
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 8, alignItems: "center" }}
        >
          {renderTabButton("all", "All")}
          {renderTabButton("unread", "Unread")}
          {renderTabButton("approvals", "Approvals & Status")}
          {renderTabButton("overdue", "Overdue & Alerts")}
        </ScrollView>

        {/* Categorized alerts log */}
        <NotificationList activeTab={activeTab} />
      </ScrollView>
    </ContentWrapper>
  );
}
