import {
  GetActiveParkingSessionResponse,
  ParkingLogEntryResponse,
  ParkingLogExitResponse,
  ParkingLogRequest,
} from "@/types/parkingLog";
import { apiRequest } from "./apiRequest";

export const parkingLogService = {
  register: async (payload: ParkingLogRequest) => {
    const res = await apiRequest<ParkingLogEntryResponse, ParkingLogRequest>(
      "post",
      "/parking-logs/entry",
      payload,
    );

    return res.data;
  },

  registerExit: async (payload: ParkingLogRequest) => {
    const res = await apiRequest<ParkingLogExitResponse, ParkingLogRequest>(
      "patch",
      "/parking-logs/exit",
      payload,
    );

    return res.data;
  },

  getActiveSession: async () => {
    const res = await apiRequest<GetActiveParkingSessionResponse>(
      "get",
      "/parking-logs/active-sessions",
    );

    return res.data;
  },
};
