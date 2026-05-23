import { DashboardLayout } from "@/components/layouts";
import ContentWrapper from "@/components/layouts/ContentWrapper";
import DashboardHeader from "@/components/layouts/DashboardHeader";
import GuardActionButtons from "@/features/guard/components/GuardActionButtons";
import GuardStatCards from "@/features/guard/components/GuardStatCards";
import ActiveParkingSessionList from "@/features/session/components/ActiveParkingSessionList";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";

export default function GuardHomePage() {
  const {
    activeSession,
    getActiveSession,
    parkingSessionStats,
    getParkingSessionStats,
  } = useParkingSessionStore();

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
            parkingSessionStats &&
            parkingSessionStats.activeSessionCount !== undefined
              ? Math.max(
                  parkingSessionStats.activeSessionCount,
                  activeSessionEntries.length,
                )
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
