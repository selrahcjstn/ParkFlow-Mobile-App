import { DashboardLayout } from "@/components/layouts";
import ContentWrapper from "@/components/layouts/ContentWrapper";
import DashboardHeader from "@/components/layouts/DashboardHeader";
import GuardActionButtons from "@/features/guard/components/GuardActionButtons";
import GuardStatCards from "@/features/guard/components/GuardStatCards";
import ActiveParkingSessionList from "@/features/session/components/ActiveParkingSessionList";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { View } from "react-native";

export default function GuardHomePage() {
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

  return (
    <DashboardLayout>
      <DashboardHeader title="ParkFlow" />
      <ContentWrapper>
        <UserProfileCard />

        <GuardStatCards
          totalParkedToday={
            parkingSessionStats &&
            parkingSessionStats.activeSessionCount !== undefined
              ? Math.max(parkingSessionStats.activeSessionCount, activeCount)
              : activeCount
          }
          totalSlots={parkingSessionStats?.maximumCapacity ?? 100}
        />

        <GuardActionButtons
          onScan={() => router.push("/(guard)/(scan)/scan-qr")}
          onSearch={() => router.push("/(guard)/manual-input")}
        />

        <View>
          <ActiveParkingSessionList />
        </View>
      </ContentWrapper>
    </DashboardLayout>
  );
}
