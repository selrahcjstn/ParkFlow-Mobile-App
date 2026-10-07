import { ContentWrapper, DashboardHeader } from "@/components/layouts";
import TodayReservationList from "../components/TodayReservationList";
import { useTodayReservations } from "../hooks/useTodayReservations";
import AppButton from "@/components/ui/AppButton";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { useNotificationStore } from "@/features/notification/store/notification.store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { registerParkingSessionListener } from "@/services/signalr";
import { View, Text, Animated, RefreshControl } from "react-native";
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
    parkingSessionStats,
    getParkingSessionStats,
    statsLoading,
  } = useParkingSessionStore();
  const reservations = useTodayReservations();
  const refreshReservations = reservations.refetch;


  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshReservations(),
        getParkingSessionStats(true),
        useViolationStore.getState().fetchGuardUnpaidCount(),
        useNotificationStore.getState().fetchUnreadCount(),
      ]);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [refreshReservations, getParkingSessionStats]);

  useFocusEffect(
    useCallback(() => {
      void getParkingSessionStats(true);
      void useViolationStore.getState().fetchGuardUnpaidCount();
      void useNotificationStore.getState().fetchUnreadCount();
      // Keep the existing realtime fallback active only while the dashboard is visible.
      const interval = setInterval(() => {
        void getParkingSessionStats(true);
        void useViolationStore.getState().fetchGuardUnpaidCount();
      }, 15000);
      return () => clearInterval(interval);
    }, [getParkingSessionStats]),
  );

  // Real-time SignalR listener for occupancy & parking session changes
  useEffect(() => {
    const unsubscribe = registerParkingSessionListener(() => {
      void getParkingSessionStats(true);
      void useViolationStore.getState().fetchGuardUnpaidCount();
    });

    return () => {
      unsubscribe();
    };
  }, [getParkingSessionStats]);

  const metricsData = useMemo(() => {
    return {
      totalParked: parkingSessionStats?.activeSessionCount ?? 0,
      totalSlots: parkingSessionStats?.maximumCapacity ?? 100,
      overstayCount: parkingSessionStats?.overstayCount ?? 0,
      reservedTodayCount: reservations.isError ? null : reservations.data?.totalCount ?? null,
    };
  }, [parkingSessionStats, reservations.data, reservations.isError]);

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

            <View className="mt-6 mb-8">
              <View className="flex-row items-center justify-between gap-2 mb-3">
                <Text className="flex-1 text-light-text dark:text-dark-text font-bold text-lg">{"Today's reservations"}</Text>
                <AppButton label={(reservations.data?.totalCount ?? 0) > 5 ? "View all" : "Search"} variant="ghost" size="sm" uppercase={false} onPress={() => router.push("/(guard)/reservations")} />
              </View>
              <TodayReservationList items={reservations.data?.items ?? []} loading={reservations.isPending} error={reservations.isError} onRetry={() => void refreshReservations()} />
            </View>
          </View>
        </Animated.ScrollView>

        <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 }}>
          <DashboardHeader scrollY={scrollY} />
        </View>
      </ContentWrapper>
    </View>
  );
}
