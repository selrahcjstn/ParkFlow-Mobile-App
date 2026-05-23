import { DashboardLayout } from "@/components/layouts";
import ContentWrapper from "@/components/layouts/ContentWrapper";
import DashboardHeader from "@/components/layouts/DashboardHeader";
import { QuickActionCard } from "@/components/shared";
import { Title } from "@/components/ui";
import QRCodeDisplay from "@/features/qr/components/QRCodeDisplay";
import ParkingHistoryList from "@/features/session/components/ActiveParkingSessionList";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import VehiclePickerSheet from "@/features/user/components/VehiclePickerSheet";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "expo-router";
import { AlertTriangle, CalendarCheck } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from "react";
import { View } from "react-native";

export default function UserHomePage() {
  const pickerRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
  const vehicle = useVehicleStore((s) => s.vehicle);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const hasHydrated = useVehicleStore((s) => s.hasHydrated);
  const loadVehicle = useVehicleStore((s) => s.loadVehicle);
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | undefined
  >(undefined);
  const vehicles = useMemo(() => (vehicle ? [vehicle] : []), [vehicle]);

  useFocusEffect(
    useCallback(() => {
      loadVehicle();
    }, [loadVehicle]),
  );

  // Auto-select the primary or first vehicle once loaded
  useEffect(() => {
    if (selectedVehicleId) return;
    if (vehicles.length === 0) return;
    const primary = vehicles.find((v) => v.isPrimary);
    setSelectedVehicleId((primary ?? vehicles[0]).id);
  }, [vehicles, selectedVehicleId]);

  // Establish SignalR hub connections inside our centralized Violation Store
  useEffect(() => {
    const unsubscribe = useViolationStore.getState().initSignalRListener();
    return unsubscribe;
  }, []);

  return (
    <View className="flex-1">
      <DashboardLayout>
        <DashboardHeader title="ParkFlow" />
        <ContentWrapper>
          <UserProfileCard />
          <QRCodeDisplay
            vehicles={vehicles}
            isLoading={isLoading}
            hasHydrated={hasHydrated}
            selectedVehicleId={selectedVehicleId}
            onOpenPicker={() => pickerRef.current?.present()}
          />

          <Title
            className="text-light-text font-black mt-4"
            style={{ fontSize: 18 }}
          >
            Quick Actions
          </Title>
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <QuickActionCard
                icon={
                  <AlertTriangle size={28} color="#D22730" strokeWidth={1.8} />
                }
                title="View Charges"
                subtitle="See parking fees"
              />
            </View>
            <View className="flex-1">
              <QuickActionCard
                icon={
                  <CalendarCheck size={28} color="#D22730" strokeWidth={1.8} />
                }
                title="Request Schedule"
                subtitle="Reserve parking slot"
              />
            </View>
          </View>
          <ParkingHistoryList entries={[]} />
        </ContentWrapper>
      </DashboardLayout>

      <VehiclePickerSheet
        ref={pickerRef}
        vehicles={vehicles}
        selectedId={selectedVehicleId}
        onSelect={(selected) => {
          console.debug("VehiclePicker: selected", selected.id);
          setSelectedVehicleId(selected.id);
          pickerRef.current?.dismiss();
        }}
        onClose={() => {
          console.debug("VehiclePicker: onClose");
        }}
      />
    </View>
  );
}
