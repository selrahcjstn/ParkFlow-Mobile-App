import { ContentWrapper, DashboardHeader } from "@/components/layouts";
import ActiveParkingSessionList from "@/features/session/components/ActiveParkingSessionList";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { queryClient } from "@/services/queryClient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GuardActionButtons from "../components/GuardActionButtons";
import GuardOverviewMetrics, {
  GuardOverviewMetricsData,
} from "../components/GuardOverviewMetrics";

export default function GuardHomePage() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const headerHeight = Math.max(insets.top, 16) + 56;
  const scrollY = useRef(new Animated.Value(0)).current;

  const {
    activeSession,
    getActiveSession,
    parkingSessionStats,
    getParkingSessionStats,
  } = useParkingSessionStore();

  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        await queryClient.invalidateQueries({ queryKey: ["activeSession"] });
        await queryClient.invalidateQueries({ queryKey: ["sessionStats"] });
        void getActiveSession();
        void getParkingSessionStats();
      };
      void refreshData();
    }, [getActiveSession, getParkingSessionStats]),
  );

  // Poll for updates every 2 minutes in the background
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["sessionStats"] });
      void getActiveSession();
      void getParkingSessionStats();
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
    const active = parkingSessionStats?.activeSessionCount ?? 0;
    const manual = parkingSessionStats?.manualSessionCount ?? 0;
    return {
      totalParked: active + manual,
      totalSlots: parkingSessionStats?.maximumCapacity ?? 100,
      overstayCount: parkingSessionStats?.overstayCount ?? 0,
      manualEntriesCount: manual,
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
        >
          <View className="px-5">
            <UserProfileCard />
            <GuardOverviewMetrics data={metricsData} />

            <GuardActionButtons
              onSearch={() => router.push("/(guard)/manual-input")}
            />

            <ActiveParkingSessionList
              entries={activeSessionEntries}
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
