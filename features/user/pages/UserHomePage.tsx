import { ContentWrapper, DashboardHeader } from "@/components/layouts";
import { HistoryDetailsSheet } from "@/features/history/components";
import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import QRCodeDisplay from "@/features/user/components/QRCodeDisplay";
import UserParkingHistoryPreview from "@/features/user/components/UserParkingHistoryPreview";
import SystemAnnouncementBanner from "@/features/announcement/components/SystemAnnouncementBanner";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import UserQuickActions from "@/features/user/components/UserQuickActions";
import VehiclePickerSheet from "@/features/user/components/VehiclePickerSheet";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { useNotificationStore } from "@/features/notification/store/notification.store";
import { registerSemesterResetListener, registerParkingSessionListener } from "@/services/signalr";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router, useFocusEffect } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ElementRef,
} from "react";
import { ScrollView, View, Animated, Alert, RefreshControl } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomCalendarStrip from "../components/CustomCalendarStrip";

export default function UserHomePage() {
  const insets = useSafeAreaInsets();
  const headerHeight = Math.max(insets.top, 16) + 56;
  const pickerRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
  const detailsSheetRef = useRef<BottomSheetModal>(null);
  const [isFocusedState, setIsFocusedState] = useState(true);

  // Store Hooks (Declared FIRST to avoid TS2448 / TS2454)
  const vehicles = useVehicleStore((s) => s.vehicles);
  const vehicle = useVehicleStore((s) => s.vehicle);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const hasHydrated = useVehicleStore((s) => s.hasHydrated);
  const loadVehicle = useVehicleStore((s) => s.loadVehicle);
  const { parkingHistory, getParkingHistory } = useHistoryStore();

  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | undefined
  >(undefined);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedLog, setSelectedLog] = useState<ParkingHistoryResponse | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      setIsFocusedState(true);
      void loadVehicle();
      void getParkingHistory();
      void useViolationStore.getState().loadActiveViolations(true);
      void useNotificationStore.getState().fetchUnreadCount();

      return () => {
        setIsFocusedState(false);
      };
    }, [loadVehicle, getParkingHistory])
  );

  useEffect(() => {
    const unregisterSession = registerParkingSessionListener(() => {
      console.log('[UserHomePage] Realtime parking session update received!');
      void getParkingHistory();
    });
    return () => {
      unregisterSession();
    };
  }, [getParkingHistory]);

  const [shouldRenderSheets, setShouldRenderSheets] = useState(isFocusedState);

  useEffect(() => {
    if (isFocusedState) {
      setShouldRenderSheets(true);
    } else {
      detailsSheetRef.current?.dismiss();
      pickerRef.current?.dismiss();
      setSelectedLog(null);
      
      const timer = setTimeout(() => {
        setShouldRenderSheets(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFocusedState]);

  useEffect(() => {
    loadVehicle();
    void getParkingHistory();
  }, [loadVehicle, getParkingHistory]);

  useEffect(() => {
    const unregisterReset = registerSemesterResetListener((data: any) => {
      Alert.alert(
        "New Semester Notice",
        data?.Message || "A new semester has started. All student schedules and COR verifications require re-upload.",
        [
          {
            text: "Re-upload Schedule",
            onPress: () => router.push("/(users)/cor-upload" as any)
          },
          { text: "OK", style: "cancel" }
        ]
      );
    });
    return () => {
      unregisterReset();
    };
  }, []);

  useEffect(() => {
    if (vehicle) {
      setSelectedVehicleId(vehicle.id);
    }
  }, [vehicle]);

  const activeViolation = useViolationStore((s) => s.activeViolation);

  useEffect(() => {
    const unsubscribe = useViolationStore.getState().initSignalRListener();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (activeViolation) {
      router.push("/(users)/(violation)/violation");
    }
  }, [activeViolation]);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedLog) {
      detailsSheetRef.current?.present();
    }
  }, [selectedLog]);

  const handleSheetClose = useCallback(() => {
    setSelectedLog(null);
  }, []);

  const { isDark } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadVehicle(),
        getParkingHistory(),
        useViolationStore.getState().loadActiveViolations(true),
      ]);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [loadVehicle, getParkingHistory]);

  const activeViolationsList = useViolationStore((s) => s.activeViolationsList);

  const unpaidCount = useMemo(() => {
    return activeViolationsList.filter(
      (v) =>
        !v.isPaid &&
        v.settlementStatus !== "Paid" &&
        v.settlementStatus !== "Settled"
    ).length;
  }, [activeViolationsList]);

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
          contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: 16 }}
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
            <SystemAnnouncementBanner />
            <UserProfileCard />
            <QRCodeDisplay
              vehicles={vehicles}
              isLoading={isLoading}
              hasHydrated={hasHydrated}
              selectedVehicleId={selectedVehicleId}
              onOpenPicker={() => pickerRef.current?.present()}
              onSelectVehicle={(vehicleId) => {
                setSelectedVehicleId(vehicleId);
                const found = vehicles.find((item) => item.id === vehicleId) ?? null;
                useVehicleStore.getState().setVehicle(found);
              }}
              selectedDate={selectedDate}
              unpaidCount={unpaidCount}
            />
          </View>

          <CustomCalendarStrip onSelectDate={setSelectedDate} />
          <View className="px-5">
            <UserQuickActions
              onRequestSchedule={() => router.push("/(settings)/schedule")}
              onViewCharges={() => router.push("/(settings)/violations")}
              unpaidCount={unpaidCount}
            />

            <UserParkingHistoryPreview
              logs={parkingHistory}
              onViewAll={() => router.push("/(users)/(tabs)/history")}
              onPressLog={(log) => {
                setSelectedLog(log);
                detailsSheetRef.current?.present();
              }}
            />
          </View>
        </Animated.ScrollView>

        <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 }}>
          <DashboardHeader scrollY={scrollY} />
        </View>

        {shouldRenderSheets && (
          <>
            <VehiclePickerSheet
              ref={pickerRef}
              vehicles={vehicles}
              selectedId={selectedVehicleId}
              onSelect={(selected) => {
                setSelectedVehicleId(selected.id);
                const found = vehicles.find((item) => item.id === selected.id) ?? null;
                useVehicleStore.getState().setVehicle(found);
                pickerRef.current?.dismiss();
              }}
              onClose={() => console.debug("VehiclePicker: onClose")}
            />

            <HistoryDetailsSheet
              ref={detailsSheetRef}
              log={selectedLog}
              payment={null}
              onClose={handleSheetClose}
            />
          </>
        )}
      </ContentWrapper>
    </View>
  );
}
