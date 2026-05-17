import type { ApiResponse } from "@/types/apiResponse";
import { ParkingLogTodayResponse } from "@/types/parkingLog";
import { api } from "./api";

export const dashboardService = {
  getTodayLogs: async () => {
    const res = (await api.get(
      "/parking-logs/today",
    )) as ApiResponse<ParkingLogTodayResponse>;
    return res;
  },
};
