import { ApiResponse } from "@/types/apiResponse";
import { ParkingLogData, ParkingLogRequest } from "@/types/parkingLog";
import { api } from "./api";

export const parkingLogService = {
  register: async (payload: ParkingLogRequest) => {
    const res = await api.post<ApiResponse<ParkingLogData>>(
      "/parking-logs/entry",
      payload,
    );

    return res.data;
  },
};
