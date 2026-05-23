import { apiRequest } from "@/services/common.service";
import { ScheduleResponse } from "../types/schedule.types";

export const ScheduleService = {
  getVehicles: async (userId: string) => {
    return apiRequest<ScheduleResponse[]>(
      "get",
      `/parking-schedules/user/${userId}`,
    );
  },
};
