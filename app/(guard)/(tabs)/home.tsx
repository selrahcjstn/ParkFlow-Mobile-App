import { DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { UserProfileCard } from "@/components/shared";
import ActiveParkingSessionList from "@/components/shared/ActiveParkingSessionList";
import GuardActionButtons from "@/components/shared/GuardActionButtons";
import GuardStatCards from "@/components/shared/GuardStatCards";
import { useParkingLogStore } from "@/store/useParkingLogStore";
import { GetActiveParkingSessionResponse } from "@/types/parkingLog";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";

export default function GuardHome() {
  const {
    activeSession,
    getActiveSession,
    parkingSessionStats,
    getParkingSessionStats,
  } = useParkingLogStore();

  const activeSessionEntries = useMemo<
    GetActiveParkingSessionResponse[]
  >(() => {
    if (!activeSession) return [];

    // FIX: Safely extract the array.
    // If your backend returns an array directly:
    if (Array.isArray(activeSession)) {
      return activeSession;
    }

    // If your backend wraps it in a data property (e.g., response.data):
    if (activeSession && Array.isArray(activeSession)) {
      return activeSession;
    }

    return [activeSession];
  }, [activeSession]);

  useFocusEffect(
    useCallback(() => {
      void getActiveSession();
      void getParkingSessionStats();
    }, [getActiveSession, getParkingSessionStats]),
  );

  return (
    <DashboardLayout>
      <DashboardHeader title="ParkFlow" />
      <ContentWrapper>
        <UserProfileCard />

        <GuardStatCards
          totalParkedToday={
            parkingSessionStats && parkingSessionStats.activeSessionCount !== undefined
              ? Math.max(parkingSessionStats.activeSessionCount, activeSessionEntries.length)
              : activeSessionEntries.length
          }
          totalSlots={parkingSessionStats?.maximumCapacity ?? 100}
        />

        <GuardActionButtons
          onScan={() => router.push("/(guard)/(scan)/scan-qr")}
          onSearch={() => router.push("/(guard)/manual-input")}
        />

        <View>
          <ActiveParkingSessionList
            entries={activeSessionEntries}
            isGuardSide
          />
        </View>
      </ContentWrapper>
    </DashboardLayout>
  );
}
