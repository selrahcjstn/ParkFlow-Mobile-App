import {
  GetActiveParkingSessionResponse,
  GetParkingSessionStatsResponse,
  ParkingLogEntryResponse,
  ParkingLogExitResponse,
  ParkingLogRequest,
} from "@/types/parkingLog";
import { apiRequest } from "./common.api";

export const parkingLogService = {
  register: async (payload: ParkingLogRequest) => {
    return apiRequest<ParkingLogEntryResponse, ParkingLogRequest>(
      "post",
      "/parking-logs/entry",
      payload,
    );
  },

  registerExit: async (payload: ParkingLogRequest) => {
    return apiRequest<ParkingLogExitResponse, ParkingLogRequest>(
      "patch",
      "/parking-logs/exit",
      payload,
    );
  },

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
};
