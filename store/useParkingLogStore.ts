import { parkingLogService } from "@/services/parking-log.service";
import { ApiResponse } from "@/types/apiResponse";
import {
  GetActiveParkingSessionResponse,
  GetParkingSessionStatsResponse,
  ParkingLogEntryResponse,
  ParkingLogExitResponse,
  ParkingLogRequest,
} from "@/types/parkingLog";
import { create } from "zustand";

export type ConflictData = {
  qrCodeHash: string;
  firstName?: string;
  lastName?: string;
  plateNumber?: string;
  brand?: string;
  vehicleType?: string;
  message?: string;
};

type ParkingLogState = {
  activeLog: ParkingLogEntryResponse | null;
  activeSession: GetActiveParkingSessionResponse | null;
  parkingSessionStats: GetParkingSessionStatsResponse | null;
  conflictData: ConflictData | null;
  loading: boolean;
  error: string | null;
  setConflictData: (data: ConflictData) => void;
  clearConflictData: () => void;
  createEntry: (
    payload: ParkingLogRequest,
  ) => Promise<ApiResponse<ParkingLogEntryResponse>>;
  registerExit: (
    payload: ParkingLogRequest,
  ) => Promise<ApiResponse<ParkingLogExitResponse>>;
  getActiveSession: () => Promise<ApiResponse<GetActiveParkingSessionResponse>>;
  getParkingSessionStats: () => Promise<ApiResponse<GetParkingSessionStatsResponse>>;
};

export const useParkingLogStore = create<ParkingLogState>((set, get) => ({
  activeLog: null,
  activeSession: null,
  parkingSessionStats: null,
  conflictData: null,
  loading: false,
  error: null,

  setConflictData: (data) => set({ conflictData: data }),
  clearConflictData: () => set({ conflictData: null }),

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
      const data = res.data ?? res.result;

      if (!res.isSuccess || !data) {
        const errorMsg = res.message || "Failed to create entry";
        set({ activeLog: null, error: errorMsg });
        return {
          isSuccess: false,
          message: errorMsg,
          data: null,
          errorCode: res.errorCode || 400,
        };
      }

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
      const data = res.data ?? res.result;

      if (!res.isSuccess || !data) {
        const errorMsg = res.message || "Failed to register exit";
        set({ error: errorMsg });
        return {
          isSuccess: false,
          message: errorMsg,
          data: null,
          errorCode: res.errorCode || 400,
        };
      }

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
      console.log("getParkingSessionStats raw response:", JSON.stringify(res, null, 2));
      const data = res.data ?? res.result;
      console.log("getParkingSessionStats parsed data:", JSON.stringify(data, null, 2));

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
