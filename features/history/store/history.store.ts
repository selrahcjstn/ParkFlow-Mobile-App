import { historyService } from "@/features/history/services/history.service";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { ApiResponse } from "@/types/api-response.types";
import { create } from "zustand";

type HistoryState = {
  parkingHistory: ParkingHistoryResponse[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  getParkingHistory: (reset?: boolean) => Promise<ApiResponse<ParkingHistoryResponse[]>>;
  loadMoreParkingHistory: () => Promise<void>;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  parkingHistory: [],
  loading: false,
  loadingMore: false,
  error: null,
  page: 1,
  hasMore: true,

  getParkingHistory: async (reset = true): Promise<ApiResponse<ParkingHistoryResponse[]>> => {
    const pageToFetch = reset ? 1 : get().page;

    if (get().loading || (!reset && get().loadingMore)) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<ParkingHistoryResponse[]>;
    }

    if (reset) {
      set({ loading: true, error: null });
    } else {
      set({ loadingMore: true, error: null });
    }

    try {
      const res = await historyService.getParkingHistory(pageToFetch, 15);
      const data = res.data ?? res.result;

      if (!res.isSuccess || !data) {
        if (reset) {
          set({ parkingHistory: [], error: res.message || "Failed to fetch parking history" });
        }
        return {
          isSuccess: false,
          message: res.message || "Failed to fetch parking history",
          data: [],
          errorCode: res.errorCode || 400,
        };
      }

      const historyList = Array.isArray(data) ? data : [data];

      set((state) => {
        const newList = reset ? historyList : [...state.parkingHistory, ...historyList];
        
        // Remove duplicates by plateNumber + entryTime combinations to be perfectly safe
        const uniqueMap = new Map<string, ParkingHistoryResponse>();
        newList.forEach((item) => {
          if (item && item.plateNumber) {
            const key = `${item.plateNumber}-${item.entryTime || ""}`;
            uniqueMap.set(key, item);
          }
        });
        const mergedList = Array.from(uniqueMap.values());

        const nextPage = pageToFetch + 1;
        // Load more defaults to 15 per page, max 45 records total, up to page 3
        const hasMore = historyList.length === 15 && mergedList.length < 45 && nextPage <= 3;

        return {
          parkingHistory: mergedList,
          page: nextPage,
          hasMore,
          error: null,
        };
      });

      return { isSuccess: true, message: "Success", data: get().parkingHistory, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";
      const backendData =
        err?.response?.data?.data ?? err?.response?.data ?? [];

      if (reset) {
        set({ parkingHistory: [], error: message });
      }

      return {
        isSuccess: false,
        message,
        data: backendData,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<ParkingHistoryResponse[]>;
    } finally {
      set({ loading: false, loadingMore: false });
    }
  },

  loadMoreParkingHistory: async () => {
    const { hasMore, loading, loadingMore, getParkingHistory } = get();
    if (!hasMore || loading || loadingMore) return;
    await getParkingHistory(false);
  },
}));
