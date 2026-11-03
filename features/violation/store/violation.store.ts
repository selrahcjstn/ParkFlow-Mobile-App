import { ActiveViolationDto, HasViolationNotificationDto } from "@/features/violation/types/violation.types";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useHistoryStore } from "@/features/history/store/history.store";
import { violationService } from "@/features/violation/services/violation.service";
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

  // Guard state
  guardViolationsList: ActiveViolationDto[];
  guardUnpaidCount: number;
  isLoadingGuardViolations: boolean;

  setActiveViolation: (violation: HasViolationNotificationDto | null) => void;
  clearViolation: () => void;
  resetFinancialState: () => void;
  loadActiveViolations: (forceRefresh?: boolean) => Promise<void>;
  loadGuardViolations: (forceRefresh?: boolean, unpaidOnly?: boolean) => Promise<void>;
  fetchGuardUnpaidCount: () => Promise<number>;
  markViolationAsPaid: (refOrPlate: string) => void;
  initSignalRListener: () => () => void;
};

const mapToViolationDto = (data: any, vehiclePlate?: string | null): HasViolationNotificationDto => {
  const refNum =
    data.ReferenceNumber ??
    data.referenceNumber ??
    data.RefNumber ??
    data.refNumber ??
    data.referenceCode ??
    data.ReferenceCode ??
    data.id ??
    data.violationId ??
    `VIO-${Date.now().toString().slice(-5)}`;
  const dateVal =
    data.IssuedDate ??
    data.issuedDate ??
    data.ExitTime ??
    data.exitTime ??
    data.endTime ??
    data.EndTime ??
    data.issuedAt ??
    new Date().toISOString();

  const isVio =
    data.IsViolation !== undefined
      ? Boolean(data.IsViolation)
      : data.isViolation !== undefined
      ? Boolean(data.isViolation)
      : data.ViolationType && data.ViolationType !== "Normal Exit" && data.ViolationType !== "Campus Parking Exit" && data.ViolationType !== "Reservation Parking Exit"
      ? true
      : false;

  const amount = Number(
    data.Amount ??
    data.amount ??
    data.penaltyFee ??
    data.PenaltyFee ??
    data.fineAmount ??
    0
  );

  return {
    ReferenceNumber: refNum,
    RefNumber: refNum,
    IssuedDate: dateVal,
    IssuedTime: data.IssuedTime ?? data.issuedTime ?? dateVal,
    IssuedBy:
      data.IssuedBy ??
      data.issuedBy ??
      data.GuardName ??
      data.guardName ??
      data.issuer ??
      data.officerName ??
      "Gate Security",
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
      data.vehiclePlate ??
      (vehiclePlate || "ABC-1234"),
    Brand:
      data.Brand ??
      data.brand ??
      data.vehicleBrand ??
      data.VehicleBrand,
    VehicleType:
      data.VehicleType ??
      data.vehicleType,
    DriverName:
      data.DriverName ??
      data.driverName ??
      (data.FirstName ? `${data.FirstName} ${data.LastName ?? ""}`.trim() : undefined) ??
      (data.firstName ? `${data.firstName} ${data.lastName ?? ""}`.trim() : undefined),
    Amount: amount,
    ViolationType:
      data.ViolationType ??
      data.violationType ??
      (isVio ? "Parking Overstay" : "Normal Exit"),
    IsViolation: isVio,
    SettlementStatus:
      data.SettlementStatus ??
      data.settlementStatus ??
      (data.IsPaid || data.isPaid ? "Settled" : undefined),
    IsPaid: data.IsPaid ?? data.isPaid ?? false,
  };
};

let financialEpoch = 0;
export const useViolationStore = create<ViolationState>((set, get) => ({
  activeViolation: null,
  violationCount: 0,
  activeViolationsList: [],
  isLoadingActiveViolations: false,

  guardViolationsList: [],
  guardUnpaidCount: 0,
  isLoadingGuardViolations: false,

  setActiveViolation: (violation) =>
    set({
      activeViolation: violation,
      violationCount: violation ? 1 : 0,
    }),

  clearViolation: () => set({ activeViolation: null, violationCount: 0 }),
  resetFinancialState: () => {
    financialEpoch++;
    set({
      activeViolation: null,
      violationCount: 0,
      activeViolationsList: [], guardViolationsList: [], guardUnpaidCount: 0,
      isLoadingActiveViolations: false, isLoadingGuardViolations: false,
    });
  },

  loadActiveViolations: async (forceRefresh = false) => {
    const epoch = financialEpoch;

    const hasCachedData = get().activeViolationsList.length > 0;
    if (!hasCachedData || forceRefresh) {
      set({ isLoadingActiveViolations: true });
    }

    try {
      const res = await violationService.getActiveViolations();
      if (epoch !== financialEpoch) return;
      const list = res?.data ?? [];
      set({ activeViolationsList: list });
    } catch (err) {
      console.error("Failed to fetch active violations:", err);
    } finally {
      if (epoch === financialEpoch) set({ isLoadingActiveViolations: false });
    }
  },

  loadGuardViolations: async (forceRefresh = false, unpaidOnly?: boolean) => {
    const epoch = financialEpoch;
    if (forceRefresh || get().guardViolationsList.length === 0) {
      set({ isLoadingGuardViolations: true });
    }
    try {
      const res = await violationService.getViolationHistory(1, 45, unpaidOnly);
      if (epoch !== financialEpoch) return;
      const items = res?.data?.items ?? [];
      set({ guardViolationsList: items });

      if (unpaidOnly === true) {
        set({ guardUnpaidCount: items.length });
      } else {
        const unpaid = items.filter(
          (i) => !i.isPaid && i.settlementStatus !== "Settled" && i.settlementStatus !== "Paid"
        ).length;
        set({ guardUnpaidCount: unpaid });
      }
    } catch (err) {
      console.error("Failed to load guard violations:", err);
    } finally {
      if (epoch === financialEpoch) set({ isLoadingGuardViolations: false });
    }
  },

  fetchGuardUnpaidCount: async () => {
    const epoch = financialEpoch;
    try {
      const res = await violationService.getViolationHistory(1, 45, true);
      if (epoch !== financialEpoch) return 0;
      const count = res?.data?.items?.length ?? 0;
      set({ guardUnpaidCount: count });
      return count;
    } catch (err) {
      console.error("Failed to fetch guard unpaid count:", err);
      return get().guardUnpaidCount;
    }
  },

  markViolationAsPaid: (refOrPlate: string) => {
    if (!refOrPlate) return;
    const target = refOrPlate.trim().toLowerCase();

    set((state) => {
      const updatedActive = state.activeViolationsList.map((item) => {
        const match =
          (item.referenceNumber && item.referenceNumber.toLowerCase() === target) ||
          (item.plateNumber && item.plateNumber.toLowerCase() === target) ||
          (item.violationId && item.violationId.toLowerCase() === target);
        if (match) {
          return { ...item, isPaid: true, settlementStatus: "Settled" };
        }
        return item;
      });

      const updatedGuard = state.guardViolationsList.map((item) => {
        const match =
          (item.referenceNumber && item.referenceNumber.toLowerCase() === target) ||
          (item.plateNumber && item.plateNumber.toLowerCase() === target) ||
          (item.violationId && item.violationId.toLowerCase() === target);
        if (match) {
          return { ...item, isPaid: true, settlementStatus: "Settled" };
        }
        return item;
      });

      const newGuardUnpaid = updatedGuard.filter(
        (i) => !i.isPaid && i.settlementStatus !== "Settled" && i.settlementStatus !== "Paid"
      ).length;

      return {
        activeViolationsList: updatedActive,
        guardViolationsList: updatedGuard,
        guardUnpaidCount: newGuardUnpaid,
      };
    });
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
      void get().fetchGuardUnpaidCount();
      void get().loadActiveViolations(true);
    };

    const handleViolationResponse = (violationData: any) => {
      if (!active || !violationData) return;
      const primaryVehiclePlate = useVehicleStore.getState().vehicle?.plateNumber;
      const dto = mapToViolationDto(violationData, primaryVehiclePlate);
      get().setActiveViolation(dto);
      void get().fetchGuardUnpaidCount();
      void get().loadActiveViolations(true);
    };

    const handlePaymentProcessed = (paymentData: any) => {
      if (!active || !paymentData) return;
      console.log("[SignalR Hub] PaymentProcessed received in Violation Store:", paymentData);

      const targetRef = paymentData.ReferenceNumber || paymentData.referenceNumber || paymentData.PlateNumber || paymentData.plateNumber;

      // Update history store in real time across all clients
      useHistoryStore.getState().markLogAsPaid(targetRef);

      // Update violation store in real time
      if (targetRef) {
        get().markViolationAsPaid(targetRef);
      }

      // If active violation matches, mark it settled so user sees paid receipt
      const current = get().activeViolation;
      if (current) {
        const curRef = current.ReferenceNumber || current.RefNumber || current.PlateNumber;
        if (!targetRef || (curRef && targetRef && curRef.toLowerCase() === targetRef.toLowerCase())) {
          get().setActiveViolation({
            ...current,
            IsPaid: true,
            SettlementStatus: "Settled",
          });
        }
      }

      // Refresh active violations list and guard count
      void get().loadActiveViolations(true);
      void get().fetchGuardUnpaidCount();
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
