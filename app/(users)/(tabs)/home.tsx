import { DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import DashboardHeader from "@/components/layout/DashboardHeader";
import VehiclePickerSheet from "@/components/shared/VehiclePickerSheet";
import { Title } from "@/components/ui";
import { useVehicleStore } from "@/store/useVehicleStore";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "expo-router";
import { AlertTriangle, CalendarCheck } from "lucide-react-native";
import { connection, registerViolationListener, registerExitResponseListener } from "@/services/signalr";
import * as signalR from "@microsoft/signalr";
import { useCallback, useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import { View } from "react-native";
import { HasViolationNotificationDto } from "@/types/violation";
import {
  ParkingHistoryList,
  QRCodeDisplay,
  QuickActionCard,
  UserProfileCard,
  ViolationPaymentCard,
} from "../../../components/shared";

const MOCK_HISTORY: any[] = [
  {
    id: "1",
    plateNumber: "ABC-1234",
    brand: "Toyota",
    vehicleType: "Sedan",
    entryTime: "8:05 AM",
    entryDate: "May 17, 2026",
    action: "ENTRY",
  },
  {
    id: "2",
    plateNumber: "XYZ-9801",
    brand: "Honda",
    vehicleType: "Motorcycle",
    entryTime: "7:42 AM",
    entryDate: "May 17, 2026",
    action: "EXIT",
  },
  {
    id: "3",
    plateNumber: "JKT-4472",
    brand: "Mitsubishi",
    vehicleType: "Hatchback",
    entryTime: "6:51 AM",
    entryDate: "May 16, 2026",
    action: "ENTRY",
  },
  {
    id: "4",
    plateNumber: "NQR-6680",
    brand: "Ford",
    vehicleType: "SUV",
    entryTime: "9:15 AM",
    entryDate: "May 16, 2026",
    action: "EXIT",
  },
  {
    id: "5",
    plateNumber: "TRM-2307",
    brand: "Yamaha",
    vehicleType: "Scooter",
    entryTime: "5:33 AM",
    entryDate: "May 15, 2026",
    action: "ENTRY",
  },
  {
    id: "6",
    plateNumber: "PLD-7719",
    brand: "Nissan",
    vehicleType: "Pickup",
    entryTime: "4:22 AM",
    entryDate: "May 15, 2026",
    action: "EXIT",
  },
];

export default function Home() {
  const pickerRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
  const vehicle = useVehicleStore((s) => s.vehicle);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const hasHydrated = useVehicleStore((s) => s.hasHydrated);
  const loadVehicle = useVehicleStore((s) => s.loadVehicle);
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | undefined
  >(undefined);
  const [violationModalVisible, setViolationModalVisible] = useState(false);
  const [activeViolation, setActiveViolation] = useState<HasViolationNotificationDto | undefined>(undefined);
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

  // Helper to normalize SignalR / exit response data to HasViolationNotificationDto
  const mapToViolationDto = useCallback(
    (data: any): HasViolationNotificationDto => {
      const refNum =
        data.ReferenceNumber ??
        data.referenceNumber ??
        data.RefNumber ??
        data.refNumber ??
        data.id ??
        data.violationId ??
        `VIO-${Date.now().toString().slice(-5)}`;
      const dateVal =
        data.IssuedDate ??
        data.issuedDate ??
        data.endTime ??
        data.EndTime ??
        data.issuedAt ??
        data.ExitTime ??
        new Date().toISOString();

      return {
        ReferenceNumber: refNum,
        RefNumber: refNum,
        IssuedDate: dateVal,
        IssuedTime: data.IssuedTime ?? data.issuedTime ?? dateVal,
        IssuedBy:
          data.IssuedBy ??
          data.issuedBy ??
          data.officerName ??
          "Automated System Gate",
        OverstayHours: Number(
          data.OverstayHours ??
            data.overstayHours ??
            data.overstayTime ??
            data.OverstayTime ??
            0
        ),
        PlateNumber:
          data.PlateNumber ??
          data.plateNumber ??
          (vehicle?.plateNumber || "ABC-1234"),
        Amount: Number(
          data.Amount ??
            data.amount ??
            data.penaltyFee ??
            data.PenaltyFee ??
            data.fineAmount ??
            0
        ),
        ViolationType:
          data.ViolationType ?? data.violationType ?? "Parking Overstay",
        IsViolation: data.IsViolation ?? data.isViolation ?? true,
      };
    },
    [vehicle]
  );

  // Establish SignalR connection and listen for real-time violations
  useEffect(() => {
    let active = true;

    const startSignalR = async () => {
      try {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
          await connection.start();
          if (active) {
            console.log("[SignalR] Real-time Notifications Hub Connected!");
          }
        }
      } catch (err) {
        console.error("[SignalR] Connection error:", err);
      }
    };

    startSignalR();

    const handleExitResponse = (data: any) => {
      if (!active || !data) return;
      const isViolation =
        data.isViolation ??
        data.IsViolation ??
        !!(
          data.violationType ||
          data.ViolationType ||
          data.referenceNumber ||
          data.ReferenceNumber ||
          data.refNumber ||
          data.RefNumber
        );

      if (isViolation) {
        const dto = mapToViolationDto(data);
        setActiveViolation(dto);
        setViolationModalVisible(true);
      }
    };

    const handleViolationResponse = (violationData: any) => {
      if (active) {
        const dto = mapToViolationDto(violationData);
        setActiveViolation(dto);
        setViolationModalVisible(true);
      }
    };

    // Register our dynamic callbacks on the global proxy listener
    const unsubscribeViolation = registerViolationListener(handleViolationResponse);
    const unsubscribeExitResponse = registerExitResponseListener(handleExitResponse);

    return () => {
      active = false;
      unsubscribeViolation();
      unsubscribeExitResponse();
    };
  }, [vehicle, mapToViolationDto]);

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
                onPress={() => setViolationModalVisible(true)}
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
          <ParkingHistoryList entries={MOCK_HISTORY} />
        </ContentWrapper>
      </DashboardLayout>

      <ViolationPaymentCard
        visible={violationModalVisible}
        onBack={() => setViolationModalVisible(false)}
        violation={activeViolation}
      />

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
          // onClose called after bottom sheet dismisses; no-op to avoid double dismiss
        }}
      />
    </View>
  );
}
