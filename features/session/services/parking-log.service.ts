import {
  GetActiveParkingSessionResponse,
  GetParkingSessionStatsResponse,
} from "@/features/session/types/parking-log.types";
import { apiRequest } from "../../../services/common.service";

export const parkingLogService = {
  getActiveSession: async () => {
    return apiRequest<GetActiveParkingSessionResponse>(
      "get",
      "/parking-logs/active-sessions",
    );
  },

  getParkingSessionStats: async () => {
    return apiRequest<GetParkingSessionStatsResponse>(
      "get",
      "/parking-logs/session-count",
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
};
