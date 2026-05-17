import { ParkingLogData, ParkingLogRequest } from "@/types/parkingLog";
import { apiRequest } from "./apiRequest";

export const parkingLogService = {
  register: async (payload: ParkingLogRequest) => {
    const res = await apiRequest<ParkingLogData, ParkingLogRequest>(
      "post",
      "/parking-logs/entry",
      payload,
    );

    return res.data;
  },
};
