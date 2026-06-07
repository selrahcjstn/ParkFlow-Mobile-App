import {
  GetActiveParkingSessionResponse,
  GetParkingSessionStatsResponse,
  ManualEntryRequest,
  ManualEntryResponse,
} from "@/features/session/types/parking-log.types";
import { apiRequest } from "../../../services/common.service";

export const parkingLogService = {
  getActiveSession: async () => {
    return apiRequest<GetActiveParkingSessionResponse>(
      "get",
      "/parking-logs/active-sessions",
    );
  },

  getParkingSessionStats: async (capacity: number = 100) => {
    return apiRequest<GetParkingSessionStatsResponse>(
      "get",
      `/parking-logs/session-count?parkingCapacity=${capacity}`,
    );
  },
  getActiveVehicleSession: async (vehicleId: string) => {
    return apiRequest<{
      sessionId: string;
      startedAt: string;
      elapsedMinutes: number;
      accruedCharge: number;
      exitBy: string;
    }>("get", `/parking-logs/active/vehicle/${vehicleId}`);
  },
  createManualEntry: async (payload: ManualEntryRequest) => {
    return apiRequest<ManualEntryResponse, ManualEntryRequest>(
      "post",
      "/parking-logs/manual-entry",
      payload,
    );
  },
};
