import {
  GetActiveParkingSessionResponse,
  GetParkingSessionStatsResponse,
  ManualEntryRequest,
  ManualEntryResponse,
  ManualExitRequest,
  ManualExitResponse,
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
    try {
      return await apiRequest<{
        sessionId: string;
        startedAt: string;
        elapsedMinutes: number;
        accruedCharge: number;
        exitBy: string;
      }>("get", `/parking-logs/active/vehicle/${vehicleId}`);
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.response?.status >= 500) {
        return {
          isSuccess: false,
          data: null,
          message: "No active parking session",
        };
      }
      throw error;
    }
  },
  createManualEntry: async (payload: ManualEntryRequest) => {
    return apiRequest<ManualEntryResponse, ManualEntryRequest>(
      "post",
      "/parking-logs/manual-entry",
      payload,
    );
  },
  createManualExit: async (payload: ManualExitRequest) => {
    return apiRequest<ManualExitResponse, ManualExitRequest>(
      "patch",
      "/parking-logs/manual-exit",
      payload,
    );
  },
};
