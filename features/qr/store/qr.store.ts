import { scanService } from "@/features/qr/services/scan.service";
import {
  EntryResponse,
  ExitResponse,
  ScanRequest,
} from "@/features/qr/types/qr-scan.types";
import { ApiResponse } from "@/types/api-response.types";
import { create } from "zustand";

export type ConflictData = {
  qrCodeHash: string;
  firstName?: string;
  lastName?: string;
  plateNumber?: string;
  brand?: string;
  vehicleType?: string;
  message?: string;
  entryMethod?: string;
};

type QrState = {
  activeLog: EntryResponse | null;
  conflictData: ConflictData | null;
  loading: boolean;
  error: string | null;
  setConflictData: (data: ConflictData) => void;
  clearConflictData: () => void;
  createEntry: (
    payload: ScanRequest,
  ) => Promise<ApiResponse<EntryResponse>>;
  registerExit: (
    payload: ScanRequest,
  ) => Promise<ApiResponse<ExitResponse>>;
  verifyReservationScan: (
    qrCode: string,
  ) => Promise<ApiResponse<import("@/features/qr/types/qr-scan.types").ReservationScanVerificationResponse>>;
  verifyStudentScan: (
    payload: import("@/features/qr/types/qr-scan.types").StudentScanVerificationRequest,
  ) => Promise<ApiResponse<import("@/features/qr/types/qr-scan.types").StudentScanVerificationResponse>>;
};

export const useQrStore = create<QrState>((set, get) => ({
  activeLog: null,
  conflictData: null,
  loading: false,
  error: null,

  setConflictData: (data) => set({ conflictData: data }),
  clearConflictData: () => set({ conflictData: null }),

  createEntry: async (
    payload,
  ): Promise<ApiResponse<EntryResponse>> => {
    if (get().loading) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<EntryResponse>;
    }

    set({ loading: true, error: null });

    try {
      const res = await scanService.register(payload);
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
      } as ApiResponse<EntryResponse>;
    } finally {
      set({ loading: false });
    }
  },

  registerExit: async (
    payload,
  ): Promise<ApiResponse<ExitResponse>> => {
    if (get().loading) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<ExitResponse>;
    }

    set({ loading: true, error: null });

    try {
      const res = await scanService.registerExit(payload);
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
      } as ApiResponse<ExitResponse>;
    } finally {
      set({ loading: false });
    }
  },

  verifyReservationScan: async (qrCode: string) => {
    set({ loading: true, error: null });
    try {
      const res = await scanService.verifyReservationScan(qrCode);
      const data = res.data ?? res.result;
      if (!res.isSuccess || !data) {
        const errorMsg = res.message || "Reservation verification failed.";
        set({ error: errorMsg });
        return { isSuccess: false, message: errorMsg, data: null, errorCode: res.errorCode || 400 };
      }
      return { isSuccess: true, message: res.message || "Success", data, errorCode: 0 };
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err.message ?? "Verification failed";
      set({ error: message });
      return { isSuccess: false, message, data: null, errorCode: err?.response?.status ?? 500 };
    } finally {
      set({ loading: false });
    }
  },

  verifyStudentScan: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await scanService.verifyStudentScan(payload);
      const data = res.data ?? res.result;
      if (!res.isSuccess || !data) {
        const errorMsg = res.message || "Student scan verification failed.";
        set({ error: errorMsg });
        return { isSuccess: false, message: errorMsg, data: data ?? null, errorCode: res.errorCode || 400 };
      }
      return { isSuccess: true, message: res.message || "Success", data, errorCode: 0 };
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err.message ?? "Verification failed";
      const data = err?.response?.data?.data ?? err?.response?.data ?? null;
      set({ error: message });
      return { isSuccess: false, message, data, errorCode: err?.response?.status ?? 500 };
    } finally {
      set({ loading: false });
    }
  },
}));
