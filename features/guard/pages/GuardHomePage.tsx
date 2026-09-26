import { ContentWrapper, DashboardHeader } from "@/components/layouts";
import ActiveParkingSessionList from "@/features/session/components/ActiveParkingSessionList";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { useNotificationStore } from "@/features/notification/store/notification.store";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Animated, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GuardActionButtons from "../components/GuardActionButtons";
import GuardOverviewMetrics, {
  GuardOverviewMetricsData,
} from "../components/GuardOverviewMetrics";

export default function GuardHomePage() {
  const tabBarHeight = useTabBarHeight();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const headerHeight = Math.max(insets.top, 16) + 56;
  const scrollY = useRef(new Animated.Value(0)).current;

  const {
    activeSession,
    getActiveSession,
    parkingSessionStats,
    getParkingSessionStats,
    sessionLoading,
    statsLoading,
  } = useParkingSessionStore();

  const guardUnpaidCount = useViolationStore((s) => s.guardUnpaidCount);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getActiveSession(),
        getParkingSessionStats(),
        useViolationStore.getState().fetchGuardUnpaidCount(),
        useNotificationStore.getState().fetchUnreadCount(),
      ]);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [getActiveSession, getParkingSessionStats]);

  useFocusEffect(
    useCallback(() => {
      void getActiveSession();
      void getParkingSessionStats();
      void useViolationStore.getState().fetchGuardUnpaidCount();
      void useNotificationStore.getState().fetchUnreadCount();
    }, [getActiveSession, getParkingSessionStats]),
  );

  // Poll for updates every 2 minutes in the background
  useEffect(() => {
    const interval = setInterval(() => {
      void getActiveSession();
      void getParkingSessionStats();
      void useViolationStore.getState().fetchGuardUnpaidCount();
    }, 1000 * 60 * 2); // 2 minutes

    return () => clearInterval(interval);
  }, [getActiveSession, getParkingSessionStats]);

  const activeCount = useMemo(() => {
    if (!activeSession) return 0;
    return Array.isArray(activeSession) ? activeSession.length : 1;
  }, [activeSession]);

  const activeSessionEntries = useMemo<
    GetActiveParkingSessionResponse[]
  >(() => {
    if (!activeSession) return [];
    return Array.isArray(activeSession) ? activeSession : [activeSession];
  }, [activeSession]);

  const metricsData = useMemo(() => {
    return {
      totalParked: parkingSessionStats?.activeSessionCount ?? 0,
      totalSlots: parkingSessionStats?.maximumCapacity ?? 100,
      overstayCount: parkingSessionStats?.overstayCount ?? 0,
      manualEntriesCount: parkingSessionStats?.manualSessionCount ?? 0,
    };
  }, [parkingSessionStats]);

  return (
    <View style={{ flex: 1 }}>
      <ContentWrapper noPaddingX noPaddingY>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: headerHeight + 16,
            paddingBottom: tabBarHeight + 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#8B0000"]}
              tintColor={isDark ? "#FFFFFF" : "#8B0000"}
            />
          }
        >
          <View className="px-5">
            <UserProfileCard />
            <GuardOverviewMetrics
              data={metricsData}
              isLoading={statsLoading && !parkingSessionStats}
            />

            <GuardActionButtons
              onSearch={() => router.push("/(guard)/manual-input")}
              onExit={() => router.push("/(guard)/manual-exit")}
              onViolations={() => router.push("/(guard)/violations" as any)}
              unpaidViolationsCount={guardUnpaidCount}
            />

            <ActiveParkingSessionList
              entries={activeSessionEntries}
              isLoading={sessionLoading && !activeSession}
              onViewAll={() => router.push("/(guard)/(tabs)/session")}
            />
          </View>
        </Animated.ScrollView>

        <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 }}>
          <DashboardHeader scrollY={scrollY} />
        </View>
      </ContentWrapper>
    </View>
  );
}
