import { DashboardLayout } from "@/components/layouts";
import ContentWrapper from "@/components/layouts/ContentWrapper";
import DashboardHeader from "@/components/layouts/DashboardHeader";
import { QuickActionCard } from "@/components/shared";
import ParkingHistoryListItem from "@/components/shared/ParkingHistoryListItem";
import { Title } from "@/components/ui";
import { Body } from "@/components/ui/Typography";
import { HistoryDetailsSheet } from "@/features/history/components";
import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import QRCodeDisplay from "@/features/qr/components/QRCodeDisplay";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import VehiclePickerSheet from "@/features/user/components/VehiclePickerSheet";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router, useFocusEffect } from "expo-router";
import { AlertTriangle, CalendarCheck } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from "react";
import { TouchableOpacity, View } from "react-native";

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

  useFocusEffect(
    useCallback(() => {
      loadVehicle();
      void getParkingHistory();
    }, [loadVehicle, getParkingHistory]),
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

          {/* ── Recent History Title Area ── */}
          <View className="flex-row items-center justify-between mt-6 px-1">
            <Title
              className="text-light-text font-black"
              style={{ fontSize: 18 }}
            >
              Recent History
            </Title>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(users)/(tabs)/history")}
              className="py-1 px-2"
            >
              <Body className="text-light-primary font-heavy text-[13px]">
                View all
              </Body>
            </TouchableOpacity>
          </View>

          {/* ── Recent History List ── */}
          <View className="gap-2.5 mt-2">
            {parkingHistory.length === 0 ? (
              <View className="bg-light-surface rounded-2xl py-8 px-4 items-center justify-center">
                <Body className="text-light-muted font-book text-[13px]">
                  No recent parking logs
                </Body>
              </View>
            ) : (
              parkingHistory.slice(0, 5).map((log, index) => (
                <ParkingHistoryListItem
                  key={`home-log-${index}`}
                  log={log}
                  onPress={() => {
                    setSelectedLog(log);
                    detailsSheetRef.current?.present();
                  }}
                />
              ))
            )}
          </View>
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

      <HistoryDetailsSheet
        ref={detailsSheetRef}
        log={selectedLog}
        payment={null}
        onClose={() => {
          setSelectedLog(null);
        }}
      />
    </View>
  );
}
