import { ContentWrapper } from "@/components/layouts";
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
import { router, useNavigation } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from "react";
import { ScrollView, View } from "react-native";
import CustomCalendarStrip from "../components/CustomCalendarStrip";

export default function UserHomePage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const pickerRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
  const detailsSheetRef = useRef<BottomSheetModal>(null);
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

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        navigation.setParams({ hasScrolled: scrolled } as any);
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ContentWrapper noPaddingX noPaddingY>
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: 16 }}
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
            <UserQuickActions />

            <UserParkingHistoryPreview
              logs={parkingHistory}
              onViewAll={() => router.push("/(users)/(tabs)/history")}
              onPressLog={(log) => {
                setSelectedLog(log);
                detailsSheetRef.current?.present();
              }}
            />
          </View>
        </ScrollView>

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
          onClose={() => setSelectedLog(null)}
        />
      </ContentWrapper>
    </View>
  );
}
