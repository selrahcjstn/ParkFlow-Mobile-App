import { parkingLogService } from "@/features/session/services/parking-log.service";
import {
  GetActiveParkingSessionResponse,
  GetParkingSessionStatsResponse,
} from "@/features/session/types/parking-log.types";
import { ApiResponse } from "@/types/api-response.types";
import { create } from "zustand";

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
      const res = await parkingLogService.getActiveSession();
      const data = res.data ?? res.result;

      if (!res.isSuccess || !data) {
        set({ activeSession: null, error: null });

        return {
          isSuccess: false,
          message: res.message || "No active session found",
          data: null,
          errorCode: res.errorCode || 404,
        };
      }

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
      const res = await parkingLogService.getParkingSessionStats();
      console.log(
        "getParkingSessionStats raw response:",
        JSON.stringify(res, null, 2),
      );
      const data = res.data ?? res.result;
      console.log(
        "getParkingSessionStats parsed data:",
        JSON.stringify(data, null, 2),
      );

      if (!res.isSuccess || !data) {
        set({ parkingSessionStats: null, error: null });

        return {
          isSuccess: false,
          message: res.message || "No stats found",
          data: null,
          errorCode: res.errorCode || 404,
        };
      }

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
