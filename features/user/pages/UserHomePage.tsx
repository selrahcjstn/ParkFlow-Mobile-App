import ContentWrapper from "@/components/layouts/ContentWrapper";
import { QuickActionCard } from "@/components/shared";
import ParkingHistoryListItem from "@/components/shared/ParkingHistoryListItem";
import { HistoryDetailsSheet } from "@/features/history/components";
import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import UserProfileCard from "@/features/user/components/UserProfileCard";
import VehiclePickerSheet from "@/features/user/components/VehiclePickerSheet";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { AlertTriangle, CalendarCheck } from "lucide-react-native";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import CustomCalendarStrip from "../components/CustomCalendarStrip";
import QRCodeDisplay from "../components/QRCodeDisplay";

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
    <ContentWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        <UserProfileCard />

        <QRCodeDisplay
          vehicles={vehicles}
          isLoading={isLoading}
          hasHydrated={hasHydrated}
          selectedVehicleId={selectedVehicleId}
          onOpenPicker={() => pickerRef.current?.present()}
        />
        <CustomCalendarStrip />
        <Text
          className="text-light-text font-black mt-6"
          style={{ fontSize: 18 }}
        >
          Quick Actions
        </Text>
        <View className="flex-row gap-3 mt-3">
          <View className="flex-1">
            <QuickActionCard
              icon={
                <AlertTriangle size={26} color="#D22730" strokeWidth={1.8} />
              }
              title="View Charges"
              subtitle="See parking fees"
            />
          </View>
          <View className="flex-1">
            <QuickActionCard
              icon={
                <CalendarCheck size={26} color="#D22730" strokeWidth={1.8} />
              }
              title="Request Schedule"
              subtitle="Reserve parking slot"
            />
          </View>
        </View>

        {/* ── Recent History Title Area ── */}
        <View className="flex-row items-center justify-between mt-7 px-1">
          <Text className="text-light-text font-black" style={{ fontSize: 18 }}>
            Recent History
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(users)/(tabs)/history")}
            className="py-1 px-2"
          >
            <Text className="text-light-primary font-bold text-[13px]">
              View all
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Recent History List ── */}
        <View className="mt-3">
          {parkingHistory.length === 0 ? (
            <View className="bg-light-surface rounded-2xl py-8 px-4 items-center justify-center">
              <Text className="text-light-muted font-regular text-[13px]">
                No recent parking logs
              </Text>
            </View>
          ) : (
            parkingHistory.slice(0, 5).map((log, index) => (
              <ParkingHistoryListItem
                key={`home-log-${index}`}
                log={log}
                containerClassName="bg-light-surface px-4 py-4 rounded-2xl mb-2.5"
                onPress={() => {
                  setSelectedLog(log);
                  detailsSheetRef.current?.present();
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

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
    </ContentWrapper>
  );
}
