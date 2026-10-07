import { ContentWrapper, DashboardHeader } from "@/components/layouts";
import ActiveParkingSessionList from "@/features/session/components/ActiveParkingSessionList";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { useNotificationStore } from "@/features/notification/store/notification.store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { registerParkingSessionListener } from "@/services/signalr";
import { View, Animated, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GuardActionButtons from "../components/GuardActionButtons";
import GuardOverviewMetrics from "../components/GuardOverviewMetrics";

export default function GuardHomePage() {
  const tabBarHeight = useTabBarHeight();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const headerHeight = Math.max(insets.top, 16) + 56;
  const [scrollY] = useState(() => new Animated.Value(0));

  const {
    activeSession,
    getActiveSession,
    parkingSessionStats,
    getParkingSessionStats,
    sessionLoading,
    statsLoading,
  } = useParkingSessionStore();


  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getActiveSession(true),
        getParkingSessionStats(true),
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
      void getActiveSession(true);
      void getParkingSessionStats(true);
      void useViolationStore.getState().fetchGuardUnpaidCount();
      void useNotificationStore.getState().fetchUnreadCount();
      // Keep the existing realtime fallback active only while the dashboard is visible.
      const interval = setInterval(() => {
        void getActiveSession(true);
        void getParkingSessionStats(true);
        void useViolationStore.getState().fetchGuardUnpaidCount();
      }, 15000);
      return () => clearInterval(interval);
    }, [getActiveSession, getParkingSessionStats]),
  );

  // Real-time SignalR listener for occupancy & parking session changes
  useEffect(() => {
    const unsubscribe = registerParkingSessionListener(() => {
      void getActiveSession(true);
      void getParkingSessionStats(true);
      void useViolationStore.getState().fetchGuardUnpaidCount();
    });

    return () => {
      unsubscribe();
    };
  }, [getActiveSession, getParkingSessionStats]);

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
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View className="px-5 w-full max-w-[1200px] self-center">
            <GuardActionButtons
              onSearch={() => router.push("/(guard)/manual-input")}
              onExit={() => router.push("/(guard)/manual-exit")}
              onScan={() => router.push("/(guard)/(scan)/scan-qr")}
            />
            <GuardOverviewMetrics
              data={metricsData}
              isLoading={statsLoading && !parkingSessionStats}
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
