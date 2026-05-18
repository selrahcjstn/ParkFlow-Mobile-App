import { dashboardService } from "@/services/dashboard.service";
import type { HistoryResponse } from "@/types/history";
import type { ParkingLogData } from "@/types/parkingLog";
import { create } from "zustand";

type DashboardState = {
  todayLogs: ParkingLogData[];
  totalCount: number;
  limit: number;
  history: HistoryResponse[];
  historyIsLoading: boolean;
  historyError: string | null;

  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;

  loadTodayLogs: () => Promise<void>;
  loadHistory: () => Promise<void>;
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  todayLogs: [],
  totalCount: 0,
  limit: 0,
  history: [],
  historyIsLoading: false,
  historyError: null,
  isLoading: false,
  error: null,
  hasHydrated: false,

  loadTodayLogs: async () => {
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const res = await dashboardService.getTodayLogs();

      if (!res?.isSuccess || !res.data) {
        set({
          todayLogs: [],
          totalCount: 0,
          limit: 0,
          error: res?.message ?? "Failed to load dashboard data",
        });
        return;
      }

      set({
        todayLogs: res.data.items ?? [],
        totalCount: res.data.totalCount ?? 0,
        limit: res.data.limit ?? 0,
        error: null,
      });
    } catch (err: any) {
      set({
        todayLogs: [],
        totalCount: 0,
        limit: 0,
        error:
          err?.response?.data?.message ??
          err?.response?.data?.title ??
          err?.message ??
          "Something went wrong",
      });
    } finally {
      set({ isLoading: false, hasHydrated: true });
    }
  },

  loadHistory: async () => {
    if (get().historyIsLoading) return;

    set({ historyIsLoading: true, historyError: null });

    try {
      const res = await dashboardService.getHistory();

      if (!res?.isSuccess || !res.data) {
        set({
          history: [],
          historyError: res?.message ?? "Failed to load history",
        });
        return;
      }

      set({ history: res.data ?? [], historyError: null });
    } catch (err: any) {
      set({
        history: [],
        historyError: err?.message ?? "Something went wrong",
      });
    } finally {
      set({ historyIsLoading: false });
    }
  },
}));
