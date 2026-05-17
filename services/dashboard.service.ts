import { ParkingLogTodayResponse } from "@/types/parkingLog";
import { apiRequest } from "./apiRequest";

export const dashboardService = {
  getTodayLogs: async () => {
    return apiRequest<ParkingLogTodayResponse>("get", "/parking-logs/today");
  },
};
