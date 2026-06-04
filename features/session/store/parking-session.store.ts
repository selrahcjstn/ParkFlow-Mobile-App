import { parkingLogService } from "@/features/session/services/parking-log.service";
import {
  GetActiveParkingSessionResponse,
  GetParkingSessionStatsResponse,
} from "@/features/session/types/parking-log.types";
import { ApiResponse } from "@/types/api-response.types";
import { create } from "zustand";
import { queryClient } from "@/services/queryClient";

type ParkingSessionState = {
  activeSession: GetActiveParkingSessionResponse | null;
  parkingSessionStats: GetParkingSessionStatsResponse | null;
  loading: boolean;
  error: string | null;
  getActiveSession: () => Promise<ApiResponse<GetActiveParkingSessionResponse>>;
  getParkingSessionStats: () => Promise<
    ApiResponse<GetParkingSessionStatsResponse>
  >;
};

export const useParkingSessionStore = create<ParkingSessionState>((set, get) => ({
  activeSession: null,
  parkingSessionStats: null,
  loading: false,
  error: null,

  getActiveSession: async (): Promise<
    ApiResponse<GetActiveParkingSessionResponse>
  > => {
    if (get().loading) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<GetActiveParkingSessionResponse>;
    }

    set({ loading: true, error: null });

    try {
      const data = await queryClient.fetchQuery<GetActiveParkingSessionResponse>({
        queryKey: ["activeSession"],
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
          const res = await parkingLogService.getActiveSession();
          const session = res.data ?? res.result;
          if (!res.isSuccess || !session) {
            throw new Error(res.message || "No active session found");
          }
          return session;
        },
      });

      set({ activeSession: data, error: null });

      return { isSuccess: true, message: "Success", data, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";
      const backendData =
        err?.response?.data?.data ?? err?.response?.data ?? null;

      set({ activeSession: null, error: message });

      return {
        isSuccess: false,
        message,
        data: backendData,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<GetActiveParkingSessionResponse>;
    } finally {
      set({ loading: false });
    }
  },

  getParkingSessionStats: async (): Promise<
    ApiResponse<GetParkingSessionStatsResponse>
  > => {
    if (get().loading) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<GetParkingSessionStatsResponse>;
    }

    set({ loading: true, error: null });

    try {
      const data = await queryClient.fetchQuery<GetParkingSessionStatsResponse>({
        queryKey: ["sessionStats"],
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
          const res = await parkingLogService.getParkingSessionStats();
          const stats = res.data ?? res.result;
          if (!res.isSuccess || !stats) {
            throw new Error(res.message || "No stats found");
          }
          return stats;
        },
      });

      set({ parkingSessionStats: data, error: null });

      return { isSuccess: true, message: "Success", data, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";
      const backendData =
        err?.response?.data?.data ?? err?.response?.data ?? null;

      set({ parkingSessionStats: null, error: message });

      return {
        isSuccess: false,
        message,
        data: backendData,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<GetParkingSessionStatsResponse>;
    } finally {
      set({ loading: false });
    }
  },
}));
