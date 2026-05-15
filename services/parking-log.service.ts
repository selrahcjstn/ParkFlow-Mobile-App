import { ApiResponse } from "@/types/apiResponse";
import { ParkingLogRequest, ParkingLogResponse } from "@/types/parkingLog";
import { api } from "./api";

export const parkingLogService = {
  register: async (payload: ParkingLogRequest) => {
    const res = (await api.post(
      "/parking-logs/entry",
      payload,
    )) as ApiResponse<ParkingLogResponse>;
    return res;
  },
};
