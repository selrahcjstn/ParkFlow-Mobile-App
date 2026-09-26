import { apiRequest } from "@/services/common.service";
import { PaginatedParkingHistoryResponse } from "../types/history.types";

export const historyService = {
  getParkingHistory: async (pageNumber: number, pageSize: number = 15) => {
    return apiRequest<PaginatedParkingHistoryResponse>(
      "get",
      `/parking-history/page/${pageNumber}/${pageSize}`
    );
  },
  getViolationHistory: async (pageNumber: number, pageSize: number = 15) => {
    return apiRequest<{
      generatedAt: string;
      items?: any[];
    }>(
      "get",
      `/violations/history/page/${pageNumber}/${pageSize}`
    );
  },
};
