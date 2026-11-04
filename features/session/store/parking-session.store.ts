import { parkingLogService } from "@/features/session/services/parking-log.service";
import {
  GetActiveParkingSessionResponse,
  GetParkingSessionStatsResponse,
  ManualEntryResponse,
} from "@/features/session/types/parking-log.types";
import { ApiResponse } from "@/types/api-response.types";
import { create } from "zustand";

/** How long (ms) before cached data is considered stale and refetched */
const STALE_TIME_MS = 30_000; // 30 seconds

type ParkingSessionState = {
  activeSession: GetActiveParkingSessionResponse | GetActiveParkingSessionResponse[] | null;
  parkingSessionStats: GetParkingSessionStatsResponse | null;
  lastManualPass: ManualEntryResponse | null;
  sessionLoading: boolean;
  statsLoading: boolean;
  statsError: string | null;
  sessionLastFetched: number | null;  // epoch ms
  statsLastFetched: number | null;    // epoch ms
  error: string | null;
  setLastManualPass: (pass: ManualEntryResponse | null) => void;
  getActiveSession: (force?: boolean) => Promise<ApiResponse<GetActiveParkingSessionResponse | GetActiveParkingSessionResponse[]>>;
  getParkingSessionStats: (force?: boolean) => Promise<ApiResponse<GetParkingSessionStatsResponse>>;
};

const isStale = (lastFetched: number | null) => {
  if (lastFetched === null) return true;
  return Date.now() - lastFetched > STALE_TIME_MS;
};

export const useParkingSessionStore = create<ParkingSessionState>((set, get) => ({
  activeSession: null,
  parkingSessionStats: null,
  lastManualPass: null,
  sessionLoading: false,
  statsLoading: false,
  statsError: null,
  sessionLastFetched: null,
  statsLastFetched: null,
  error: null,

  setLastManualPass: (lastManualPass) => set({ lastManualPass }),

  getActiveSession: async (force = false): Promise<ApiResponse<GetActiveParkingSessionResponse | GetActiveParkingSessionResponse[]>> => {
    // Skip fetch if data is still fresh (unless forced)
    if (!force && !isStale(get().sessionLastFetched)) {
      return { isSuccess: true, message: "Cached", data: get().activeSession, errorCode: 0 } as ApiResponse<GetActiveParkingSessionResponse | GetActiveParkingSessionResponse[]>;
    }

    if (get().sessionLoading) {
      return {
        isSuccess: false,
        message: "Already fetching session",
      } as ApiResponse<GetActiveParkingSessionResponse>;
    }

    set({ sessionLoading: true, error: null });

    try {
      const res = await parkingLogService.getActiveSession();
      const session = res.data ?? res.result;

      if (!res.isSuccess) {
        const errorMsg = res.message || "Failed to fetch active sessions";
        set({ activeSession: null, error: errorMsg });
        return { isSuccess: false, message: errorMsg, data: null, errorCode: res.errorCode || 400 } as ApiResponse<GetActiveParkingSessionResponse>;
      }

      const sessionList = session ?? [];
      set({ activeSession: sessionList, sessionLastFetched: Date.now(), error: null });
      return { isSuccess: true, message: "Success", data: sessionList, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";

      set({ activeSession: null, error: message });

      return {
        isSuccess: false,
        message,
        data: null,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<GetActiveParkingSessionResponse>;
    } finally {
      set({ sessionLoading: false });
    }
  },

  getParkingSessionStats: async (force = false): Promise<ApiResponse<GetParkingSessionStatsResponse>> => {
    // Skip fetch if data is still fresh (unless forced)
    if (!force && !isStale(get().statsLastFetched)) {
      return { isSuccess: true, message: "Cached", data: get().parkingSessionStats, errorCode: 0 } as ApiResponse<GetParkingSessionStatsResponse>;
    }

    if (get().statsLoading) {
      return {
        isSuccess: false,
        message: "Already fetching stats",
      } as ApiResponse<GetParkingSessionStatsResponse>;
    }

    set({ statsLoading: true, statsError: null, error: null });

    try {
      const res = await parkingLogService.getParkingSessionStats();
      const stats = res.data ?? res.result;

      if (!res.isSuccess || !stats) {
        const errorMsg = res.message || "No stats found";
        set({ statsError: errorMsg, error: errorMsg });
        return { isSuccess: false, message: errorMsg, data: null, errorCode: 0 } as ApiResponse<GetParkingSessionStatsResponse>;
      }

      set({ parkingSessionStats: stats, statsLastFetched: Date.now(), statsError: null, error: null });
      return { isSuccess: true, message: "Success", data: stats, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";

      set({ statsError: message, error: message });

      return {
        isSuccess: false,
        message,
        data: null,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<GetParkingSessionStatsResponse>;
    } finally {
      set({ statsLoading: false });
    }
  },
}));
