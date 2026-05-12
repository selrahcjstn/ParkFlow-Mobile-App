import type { ApiResponse } from "@/types/apiResponse";
import type { ScheduleRequest } from "@/types/schedule";
import { api } from "./api";

export const scheduleService = {
  create: async (payload: ScheduleRequest) => {
    const res = await api.post<ApiResponse<string>>(
      "/parking-schedules/create",
      payload,
    );
    return res.data;
  },
};
