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

export const useParkingLogStore = create<ParkingLogState>((set) => ({
  activeLog: null,
  loading: false,
  error: null,

  createEntry: async (payload): Promise<ApiResponse<ParkingLogData>> => {
    set({ loading: true, error: null });

    try {
      const res = await parkingLogService.register(payload);

      if (res.isSuccess) {
        set({ activeLog: res.data });
      } else {
        set({ error: res.message });
      }

      return res;
    } catch (err: any) {
      const errorRes: ApiResponse<ParkingLogData> = {
        isSuccess: false,
        data: null,
        message: err.message ?? "Something went wrong",
        errorCode: 500,
      };

      set({ error: errorRes.message });

      return errorRes;
    } finally {
      set({ loading: false });
    }
  },
}));
