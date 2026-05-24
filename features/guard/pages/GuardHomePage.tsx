import ContentWrapper from "@/components/layouts/ContentWrapper";
import GuardActionButtons from "@/features/guard/components/GuardActionButtons";
import GuardStatCards from "@/features/guard/components/GuardStatCards";
import ActiveParkingSessionList from "@/features/session/components/ActiveParkingSessionList";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const activeSessionEntries = useMemo<
    GetActiveParkingSessionResponse[]
  >(() => {
    if (!activeSession) return [];
    return Array.isArray(activeSession) ? activeSession : [activeSession];
  }, [activeSession]);

  const totalParkedToday = parkingSessionStats?.activeSessionCount ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
      <ContentWrapper>
        <UserProfileCard />
        <GuardStatCards
          totalParkedToday={Math.max(totalParkedToday, activeCount)}
          totalSlots={parkingSessionStats?.maximumCapacity ?? 100}
        />

        <GuardActionButtons
          onScan={() => router.push("/(guard)/(scan)/scan-qr")}
          onSearch={() => router.push("/(guard)/manual-input")}
        />

        <ActiveParkingSessionList
          entries={activeSessionEntries}
          onViewAll={() => router.push("/(guard)/(tabs)/session")}
        />
      </ContentWrapper>
    </SafeAreaView>
  );
}
