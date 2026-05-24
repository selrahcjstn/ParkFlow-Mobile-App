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
import { router } from "expo-router";
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
  const pickerRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
  const detailsSheetRef = useRef<BottomSheetModal>(null);
  const vehicle = useVehicleStore((s) => s.vehicle);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const hasHydrated = useVehicleStore((s) => s.hasHydrated);
  const loadVehicle = useVehicleStore((s) => s.loadVehicle);
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | undefined
  >(undefined);
  const vehicles = useMemo(() => (vehicle ? [vehicle] : []), [vehicle]);

  const { parkingHistory, getParkingHistory } = useHistoryStore();
  const [selectedLog, setSelectedLog] = useState<ParkingHistoryResponse | null>(
    null,
  );

  useEffect(() => {
    loadVehicle();
    void getParkingHistory();
  }, [loadVehicle, getParkingHistory]);

  useEffect(() => {
    if (selectedVehicleId) return;
    if (vehicles.length === 0) return;
    const primary = vehicles.find((v) => v.isPrimary);
    setSelectedVehicleId((primary ?? vehicles[0]).id);
  }, [vehicles, selectedVehicleId]);

  useEffect(() => {
    const unsubscribe = useViolationStore.getState().initSignalRListener();
    return unsubscribe;
  }, []);

  return (
    <ContentWrapper noPadding>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
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
  );
}
