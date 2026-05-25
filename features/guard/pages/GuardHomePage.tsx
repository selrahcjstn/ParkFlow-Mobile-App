import ContentWrapper from "@/components/layouts/ContentWrapper";
import ActiveParkingSessionList from "@/features/session/components/ActiveParkingSessionList";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GuardActionButtons from "../components/GuardActionButtons";
import GuardOverviewMetrics, {
  GuardOverviewMetricsData,
} from "../components/GuardOverviewMetrics";

const dummyGuardOverviewMetrics: GuardOverviewMetricsData = {
  totalParked: 42,
  totalSlots: 100,
  manualEntriesCount: 8,
  overstayCount: 3,
};

export default function GuardHomePage() {
  const tabBarHeight = useBottomTabBarHeight();

  const {
    activeSession,
    getActiveSession,
    parkingSessionStats,
    getParkingSessionStats,
  } = useParkingSessionStore();

  useFocusEffect(
    useCallback(() => {
      void getActiveSession();
      void getParkingSessionStats();
    }, [getActiveSession, getParkingSessionStats]),
  );

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

  return (
    <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
      <ContentWrapper>
        <View style={{ paddingBottom: tabBarHeight + 24 }}>
          <UserProfileCard />
          <GuardOverviewMetrics data={dummyGuardOverviewMetrics} />

          <GuardActionButtons
            onSearch={() => router.push("/(guard)/manual-input")}
          />

          <ActiveParkingSessionList
            entries={activeSessionEntries}
            onViewAll={() => router.push("/(guard)/(tabs)/session")}
          />
        </View>
      </ContentWrapper>
    </SafeAreaView>
  );
}
