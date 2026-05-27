import { HasViolationNotificationDto } from "@/features/violation/types/violation.types";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import {
  connection,
  registerExitResponseListener,
  registerViolationListener,
} from "@/services/signalr";
import * as signalR from "@microsoft/signalr";
import { create } from "zustand";

type ViolationState = {
  activeViolation: HasViolationNotificationDto | null;
  violationCount: number;
  setActiveViolation: (violation: HasViolationNotificationDto | null) => void;
  clearViolation: () => void;
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

    const unsubscribeViolation = registerViolationListener(handleViolationResponse);
    const unsubscribeExitResponse = registerExitResponseListener(handleExitResponse);

    return () => {
      active = false;
      unsubscribeViolation();
      unsubscribeExitResponse();
    };
  },
}));
