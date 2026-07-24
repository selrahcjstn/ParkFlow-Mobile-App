import { ActiveViolationDto, HasViolationNotificationDto } from "@/features/violation/types/violation.types";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useHistoryStore } from "@/features/history/store/history.store";
import { violationService } from "@/features/violation/services/violation.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  connection,
  registerExitResponseListener,
  registerViolationListener,
  registerPaymentProcessedListener,
} from "@/services/signalr";
import * as signalR from "@microsoft/signalr";
import { create } from "zustand";

type ViolationState = {
  activeViolation: HasViolationNotificationDto | null;
  violationCount: number;
  activeViolationsList: ActiveViolationDto[];
  isLoadingActiveViolations: boolean;
  setActiveViolation: (violation: HasViolationNotificationDto | null) => void;
  clearViolation: () => void;
  loadActiveViolations: (forceRefresh?: boolean) => Promise<void>;
  initSignalRListener: () => () => void;
};

const mapToViolationDto = (data: any, vehiclePlate?: string): HasViolationNotificationDto => {
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
        0,
    ),
    PlateNumber:
      data.PlateNumber ??
      data.plateNumber ??
      (vehiclePlate || "ABC-1234"),
    Amount: Number(
      data.Amount ??
        data.amount ??
        data.penaltyFee ??
        data.PenaltyFee ??
        data.fineAmount ??
        0,
    ),
    ViolationType:
      data.ViolationType ?? data.violationType ?? "Parking Overstay",
    IsViolation: data.IsViolation ?? data.isViolation ?? (
      Number(
        data.Amount ??
        data.amount ??
        data.penaltyFee ??
        data.PenaltyFee ??
        data.fineAmount ??
        0
      ) > 0
    ),
  };
};

export const useViolationStore = create<ViolationState>((set, get) => ({
  activeViolation: null,
  violationCount: 0,
  activeViolationsList: [],
  isLoadingActiveViolations: false,

  setActiveViolation: (violation) =>
    set({
      activeViolation: violation,
      violationCount: violation ? 1 : 0,
    }),

  clearViolation: () =>
    set({
      activeViolation: null,
      violationCount: 0,
    }),

  loadActiveViolations: async (forceRefresh = false) => {
    try {
      const cached = await AsyncStorage.getItem("cached_active_violations");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          set({ activeViolationsList: parsed });
        }
      }
    } catch (e) {
      console.warn("Failed to load active violations cache:", e);
    }

    const hasCachedData = get().activeViolationsList.length > 0;
    if (!hasCachedData || forceRefresh) {
      set({ isLoadingActiveViolations: true });
    }

    try {
      const res = await violationService.getActiveViolations();
      const list = res?.data ?? [];
      set({ activeViolationsList: list });
      await AsyncStorage.setItem("cached_active_violations", JSON.stringify(list));
    } catch (err) {
      console.error("Failed to fetch active violations:", err);
    } finally {
      set({ isLoadingActiveViolations: false });
    }
  },

  initSignalRListener: () => {
    let active = true;

    const startSignalR = async () => {
      try {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
          await connection.start();
          console.log("[SignalR Hub] Hub connected in Violation Store.");
        }
      } catch (err) {
        console.error("[SignalR Hub] Hub connection failed in Violation Store:", err);
      }
    };

    startSignalR();

    const handleExitResponse = (data: any) => {
      if (!active || !data) return;
      const primaryVehiclePlate = useVehicleStore.getState().vehicle?.plateNumber;
      const dto = mapToViolationDto(data, primaryVehiclePlate);
      get().setActiveViolation(dto);
    };

    const handleViolationResponse = (violationData: any) => {
      if (!active || !violationData) return;
      const primaryVehiclePlate = useVehicleStore.getState().vehicle?.plateNumber;
      const dto = mapToViolationDto(violationData, primaryVehiclePlate);
      get().setActiveViolation(dto);
    };

    const handlePaymentProcessed = (paymentData: any) => {
      if (!active || !paymentData) return;
      console.log("[SignalR Hub] PaymentProcessed received in Violation Store:", paymentData);
      
      const targetRef = paymentData.ReferenceNumber || paymentData.referenceNumber || paymentData.PlateNumber || paymentData.plateNumber;
      
      // Update history store in real time across all clients
      useHistoryStore.getState().markLogAsPaid(targetRef);

      // If active violation matches, clear it
      const current = get().activeViolation;
      if (current) {
        const curRef = current.ReferenceNumber || current.RefNumber || current.PlateNumber;
        if (!targetRef || (curRef && targetRef && curRef.toLowerCase() === targetRef.toLowerCase())) {
          get().clearViolation();
        }
      }

      // Refresh active violations list
      void get().loadActiveViolations(true);
    };

    const unsubscribeViolation = registerViolationListener(handleViolationResponse);
    const unsubscribeExitResponse = registerExitResponseListener(handleExitResponse);
    const unsubscribePaymentProcessed = registerPaymentProcessedListener(handlePaymentProcessed);

    return () => {
      active = false;
      unsubscribeViolation();
      unsubscribeExitResponse();
      unsubscribePaymentProcessed();
    };
  },
}));
