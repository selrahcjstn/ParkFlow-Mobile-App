import { historyService } from "@/features/history/services/history.service";
import { ParkingHistoryResponse, PaginatedParkingHistoryResponse } from "@/features/history/types/history.types";
import { ApiResponse } from "@/types/api-response.types";
import { create } from "zustand";

type HistoryState = {
  markLogAsPaid: (reference: string) => void;
  parkingHistory: ParkingHistoryResponse[];
  generatedAt: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  getParkingHistory: (reset?: boolean) => Promise<ApiResponse<PaginatedParkingHistoryResponse>>;
  loadMoreParkingHistory: () => Promise<void>;
  lastFetchedAt: number;
  /** Refetch only when the cached list is older than maxAgeMs (used on tab focus). */
  refreshIfStale: (maxAgeMs?: number) => Promise<void>;
};

// Guards overlapping reloads without toggling the visible `loading` flag.
let reloadInFlight = false;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  markLogAsPaid: (reference) => set(state => ({ parkingHistory: state.parkingHistory.map(log =>
    log.referenceNumber === reference ? { ...log, isPaid: true } : log) })),
  parkingHistory: [],
  generatedAt: null,
  loading: false,
  loadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
  lastFetchedAt: 0,

  refreshIfStale: async (maxAgeMs = 60_000) => {
    if (Date.now() - get().lastFetchedAt < maxAgeMs) return;
    await get().getParkingHistory(true);
  },

  getParkingHistory: async (reset = true): Promise<ApiResponse<PaginatedParkingHistoryResponse>> => {
    const pageToFetch = reset ? 1 : get().page;

    if ((reset && reloadInFlight) || (!reset && get().loadingMore)) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<PaginatedParkingHistoryResponse>;
    }

    if (reset) {
      reloadInFlight = true;
      // Show the skeleton only on first load; later refreshes keep the current list on screen.
      set({ loading: get().parkingHistory.length === 0, error: null });
    } else {
      set({ loadingMore: true, error: null });
    }

    try {
      const res = await historyService.getParkingHistory(pageToFetch, 15);
      const data = res.data ?? res.result;

      if (!res.isSuccess || !data) {
        if (reset) {
          set({ parkingHistory: [], generatedAt: null, error: res.message || "Failed to fetch parking history" });
        }
        return {
          isSuccess: false,
          message: res.message || "Failed to fetch parking history",
          data: null,
          errorCode: res.errorCode || 400,
        };
      }

      const historyList = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.parkingHistory)
        ? data.parkingHistory
        : [];
      const generatedAt = data.generatedAt || null;

      set((state) => {
        const newList = reset ? historyList : [...state.parkingHistory, ...historyList];

        // Remove duplicates by sessionId/id or plateNumber + entryTime combinations
        const uniqueMap = new Map<string, ParkingHistoryResponse>();
        newList.forEach((item) => {
          if (item) {
            const id = item.sessionId || item.id;
            const key = id ? String(id) : `${item.plateNumber || 'N/A'}-${item.entryTime || ""}`;
            uniqueMap.set(key, item);
          }
        });
        const mergedList = Array.from(uniqueMap.values());

        const nextPage = pageToFetch + 1;
        // Load more defaults to 15 per page, max 45 records total, up to page 3
        const hasMore = historyList.length === 15 && mergedList.length < 45 && nextPage <= 3;

        return {
          parkingHistory: mergedList,
          generatedAt,
          page: nextPage,
          hasMore,
          error: null,
          lastFetchedAt: reset ? Date.now() : state.lastFetchedAt,
        };
      });

      return { isSuccess: true, message: "Success", data, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";
      const backendData =
        err?.response?.data?.data ?? err?.response?.data ?? null;

      if (reset) {
        set({ parkingHistory: [], generatedAt: null, error: message });
      }

      return {
        isSuccess: false,
        message,
        data: backendData as any,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<PaginatedParkingHistoryResponse>;
    } finally {
      if (reset) reloadInFlight = false;
      set({ loading: false, loadingMore: false });
    }
  },

  loadMoreParkingHistory: async () => {
    const { hasMore, loading, loadingMore, getParkingHistory } = get();
    if (!hasMore || loading || loadingMore) return;
    await getParkingHistory(false);
  },
}));
