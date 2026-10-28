import { ContentWrapper, DashboardHeader } from "@/components/layouts";
import TodayReservationList from "../components/TodayReservationList";
import ReservationAvailabilityNotice from "@/features/schedule/components/ReservationAvailabilityNotice";
import { useTodayReservations } from "../hooks/useTodayReservations";
import AppButton from "@/components/ui/AppButton";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { useNotificationStore } from "@/features/notification/store/notification.store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router, useFocusEffect } from "expo-router";
import { Search } from "lucide-react-native";
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
    statsError,
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
      void useNotificationStore.getState().fetchUnreadCount();
      // Keep the existing realtime fallback active only while the dashboard is visible.
      const interval = setInterval(() => {
        void getParkingSessionStats(true);
      }, 15000);
      return () => clearInterval(interval);
    }, [getParkingSessionStats]),
  );

  // Real-time SignalR listener for occupancy & parking session changes
  useEffect(() => {
    const unsubscribe = registerParkingSessionListener(() => {
      void getParkingSessionStats(true);
    });

    return () => {
      unsubscribe();
    };
  }, [getParkingSessionStats]);

  const metricsData = useMemo(() => {
    return {
      totalParked: parkingSessionStats?.activeSessionCount ?? null,
      totalSlots: parkingSessionStats?.maximumCapacity ?? null,
      carCount: parkingSessionStats?.carCount, motorcycleCount: parkingSessionStats?.motorcycleCount,
      carCapacity: parkingSessionStats?.carCapacity, motorcycleCapacity: parkingSessionStats?.motorcycleCapacity,
      overstayCount: parkingSessionStats?.overstayCount ?? null,
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

            {statsError && (
              <View className="flex-row items-center gap-2 mt-2">
                <Text className="flex-1 text-light-muted dark:text-dark-muted font-book text-xs">
                  {parkingSessionStats ? "Could not update parking counts. Showing the last available counts." : "Could not load parking counts."}
                </Text>
                <AppButton label="Retry" variant="ghost" size="sm" uppercase={false} onPress={() => void getParkingSessionStats(true)} />
              </View>
            )}

            <View className="mt-6 mb-8">
              <View className="flex-row items-center justify-between gap-2 mb-3">
                <Text className="flex-1 text-light-text dark:text-dark-text font-bold text-lg">{"Today's reservations"}</Text>
                <AppButton
                  label={(reservations.data?.totalCount ?? 0) > 5 ? "View all" : "Search"}
                  variant="outline"
                  size="sm"
                  uppercase={false}
                  icon={<Search size={16} color={colors.primary} strokeWidth={2} />}
                  className="shrink-0 bg-light-surface dark:bg-dark-surface border-light-primary/30 dark:border-dark-primary/30"
                  textClassName="text-light-primary dark:text-dark-primary"
                  accessibilityLabel="Search or view all today's reservations"
                  onPress={() => router.push("/(guard)/reservations")}
                />
              </View>
              <TodayReservationList items={reservations.data?.items ?? []} loading={reservations.isPending} error={reservations.isError} onRetry={() => void refreshReservations()} />
              <View className="mt-3"><ReservationAvailabilityNotice daily data={reservations.data?.capacity} loading={reservations.isPending} error={reservations.isError} onRetry={() => void refreshReservations()} /></View>
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
