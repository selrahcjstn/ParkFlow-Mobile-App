import { apiRequest } from "@/services/common.service";
import { ParkingHistoryResponse } from "../types/history.types";

export const historyService = {
  getParkingHistory: async (pageNumber: number, pageSize: number = 15) => {
    return apiRequest<ParkingHistoryResponse[]>(
      "get",
      `/parking-history/page/${pageNumber}/${pageSize}`
    );
  },
};
