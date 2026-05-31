import { ContentWrapper, DashboardHeader } from "@/components/layouts";
import { HistoryDetailsSheet } from "@/features/history/components";
import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import QRCodeDisplay from "@/features/user/components/QRCodeDisplay";
import UserParkingHistoryPreview from "@/features/user/components/UserParkingHistoryPreview";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import UserQuickActions from "@/features/user/components/UserQuickActions";
import VehiclePickerSheet from "@/features/user/components/VehiclePickerSheet";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useViolationStore } from "@/features/violation/store/violation.store";
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
import { ScrollView, View, Animated } from "react-native";
import CustomCalendarStrip from "../components/CustomCalendarStrip";

export default function UserHomePage() {
  const pickerRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
  const detailsSheetRef = useRef<BottomSheetModal>(null);
  const [isFocusedState, setIsFocusedState] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocusedState(true);
      return () => {
        setIsFocusedState(false);
      };
    }, [])
  );

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
  const vehicles = useVehicleStore((s) => s.vehicles);
  const vehicle = useVehicleStore((s) => s.vehicle);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const hasHydrated = useVehicleStore((s) => s.hasHydrated);
  const loadVehicle = useVehicleStore((s) => s.loadVehicle);
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | undefined
  >(undefined);

  const { parkingHistory, getParkingHistory } = useHistoryStore();
  const [selectedLog, setSelectedLog] = useState<ParkingHistoryResponse | null>(
    null,
  );

  useEffect(() => {
    loadVehicle();
    void getParkingHistory();
  }, [loadVehicle, getParkingHistory]);

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
  const scrollProgress = useMemo(() => {
    return scrollY.interpolate({
      inputRange: [0, 85],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });
  }, [scrollY]);

  useEffect(() => {
    if (selectedLog) {
      detailsSheetRef.current?.present();
    }
  }, [selectedLog]);

  const handleSheetClose = useCallback(() => {
    if (!isFocusedState) return;
    setTimeout(() => {
      if (isFocusedState) {
        setSelectedLog(null);
      }
    }, 200);
  }, [isFocusedState]);

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
          contentContainerStyle={{ paddingTop: 111, paddingBottom: 16 }}
        >
          <View className="px-5">
            <UserProfileCard />
            <QRCodeDisplay
              vehicles={vehicles}
              isLoading={isLoading}
              hasHydrated={hasHydrated}
              selectedVehicleId={selectedVehicleId}
              onOpenPicker={() => pickerRef.current?.present()}
            />
          </View>

          <CustomCalendarStrip />

          <View className="px-5">
            <UserQuickActions
              onRequestSchedule={() => router.push("/(settings)/schedule")}
              onViewCharges={() => router.push("/(users)/(tabs)/history")}
            />

            <UserParkingHistoryPreview
              logs={parkingHistory}
              onViewAll={() => router.push("/(users)/(tabs)/history")}
              onPressLog={(log) => {
                setSelectedLog(log);
              }}
            />
          </View>
        </Animated.ScrollView>

        <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 }}>
          <DashboardHeader scrollProgress={scrollProgress} />
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
