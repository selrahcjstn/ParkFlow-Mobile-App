import { apiRequest } from "@/services/common.service";
import { ParkingHistoryResponse } from "../types/history.types";

export const historyService = {
  getParkingHistory: async () => {
    return apiRequest<ParkingHistoryResponse[]>("get", "/parking-history");
  },
};
