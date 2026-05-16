import { parkingLogService } from "@/services/parking-log.service";
import { ApiResponse } from "@/types/apiResponse";
import { ParkingLogData, ParkingLogRequest } from "@/types/parkingLog";
import { create } from "zustand";

type ParkingLogState = {
  activeLog: ParkingLogData | null;
  loading: boolean;
  error: string | null;
  createEntry: (
    payload: ParkingLogRequest,
  ) => Promise<ApiResponse<ParkingLogData>>;
};

export const useParkingLogStore = create<ParkingLogState>((set, get) => ({
  activeLog: null,
  loading: false,
  error: null,

  createEntry: async (payload): Promise<ApiResponse<ParkingLogData>> => {
    if (get().loading) {
      return {
        isSuccess: false,
        message: "Already processing",
      } as ApiResponse<ParkingLogData>;
    }

    set({ loading: true, error: null });

    try {
      const res = await parkingLogService.register(payload);

      // res IS the ParkingLogData directly, wrap it
      const data = res as unknown as ParkingLogData;

      set({ activeLog: data, error: null });

      return { isSuccess: true, message: "Success", data, errorCode: 0 };
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err.message ??
        "Something went wrong";

      set({ activeLog: null, error: message });

      return {
        isSuccess: false,
        message,
        data: null,
        errorCode: err?.response?.status ?? 500,
      } as ApiResponse<ParkingLogData>;
    } finally {
      set({ loading: false });
    }
  },
}));
