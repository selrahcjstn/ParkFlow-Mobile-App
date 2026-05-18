import { parkingLogService } from "@/services/parking-log.service";
import { ApiResponse } from "@/types/apiResponse";
import {
  ParkingLogEntryResponse,
  ParkingLogExitResponse,
  ParkingLogRequest,
} from "@/types/parkingLog";
import { create } from "zustand";

type ParkingLogState = {
  activeLog: ParkingLogEntryResponse | null;
  loading: boolean;
  error: string | null;
  createEntry: (
    payload: ParkingLogRequest,
  ) => Promise<ApiResponse<ParkingLogEntryResponse>>;
  registerExit: (
    payload: ParkingLogRequest,
  ) => Promise<ApiResponse<ParkingLogExitResponse>>;
};

export const useParkingLogStore = create<ParkingLogState>((set, get) => ({
  activeLog: null,
  loading: false,
  error: null,

  createEntry: async (
    payload,
  ): Promise<ApiResponse<ParkingLogEntryResponse>> => {
    if (get().loading) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<ParkingLogEntryResponse>;
    }

    set({ loading: true, error: null });

    try {
      const res = await parkingLogService.register(payload);

      // The service already returns the unwrapped data, but we'll check for result just in case
      const data = (res as any).result ? (res as any).result as ParkingLogEntryResponse : res as unknown as ParkingLogEntryResponse;

      set({ activeLog: data, error: null });

      return { isSuccess: true, message: "Success", data, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";
      const backendData =
        err?.response?.data?.data ?? err?.response?.data ?? null;

      set({ activeLog: null, error: message });

      return {
        isSuccess: false,
        message,
        data: backendData,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<ParkingLogEntryResponse>;
    } finally {
      set({ loading: false });
    }
  },

  registerExit: async (
    payload,
  ): Promise<ApiResponse<ParkingLogExitResponse>> => {
    if (get().loading) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<ParkingLogExitResponse>;
    }

    set({ loading: true, error: null });

    try {
      const res = await parkingLogService.registerExit(payload);
      const data = (res as any).result ? (res as any).result as ParkingLogExitResponse : res as unknown as ParkingLogExitResponse;

      return { isSuccess: true, message: "Success", data, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";
      const backendData =
        err?.response?.data?.data ?? err?.response?.data ?? null;

      set({ error: message });

      return {
        isSuccess: false,
        message,
        data: backendData,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<ParkingLogExitResponse>;
    } finally {
      set({ loading: false });
    }
  },
}));
