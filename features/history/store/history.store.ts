import { historyService } from "@/features/history/services/history.service";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { ApiResponse } from "@/types/api-response.types";
import { create } from "zustand";

type HistoryState = {
  parkingHistory: ParkingHistoryResponse[];
  loading: boolean;
  error: string | null;
  getParkingHistory: () => Promise<ApiResponse<ParkingHistoryResponse[]>>;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  parkingHistory: [],
  loading: false,
  error: null,

  getParkingHistory: async (): Promise<ApiResponse<ParkingHistoryResponse[]>> => {
    if (get().loading) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<ParkingHistoryResponse[]>;
    }

    set({ loading: true, error: null });

    try {
      const res = await historyService.getParkingHistory();
      const data = res.data ?? res.result;

      if (!res.isSuccess || !data) {
        set({ parkingHistory: [], error: res.message || "Failed to fetch parking history" });
        return {
          isSuccess: false,
          message: res.message || "Failed to fetch parking history",
          data: [],
          errorCode: res.errorCode || 400,
        };
      }

      const historyList = Array.isArray(data) ? data : [data];
      set({ parkingHistory: historyList, error: null });

      return { isSuccess: true, message: "Success", data: historyList, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";
      const backendData =
        err?.response?.data?.data ?? err?.response?.data ?? [];

      set({ parkingHistory: [], error: message });

      return {
        isSuccess: false,
        message,
        data: backendData,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<ParkingHistoryResponse[]>;
    } finally {
      set({ loading: false });
    }
  },
}));
