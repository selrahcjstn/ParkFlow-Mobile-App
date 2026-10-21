import type { ApiResponse } from "@/types/api-response.types";
import { apiRequest } from "./common.service";

export interface SystemSettings {
  personnelFreeParkingStart: string;
  personnelFreeParkingEnd: string;
  violationRatePerHour: number;
  feeCalculationMode: "per_hour" | "per_day" | "one_time" | "one_time_hourly" | "no_fee";
  baseFee: number;
  isGracePeriodEnabled: boolean;
  gracePeriodMinutes: number;
  isEarlyParkingAllowed: boolean;
  earlyParkingMinutes: number;
  academicYear: string;
  currentSemester: string;
  totalCapacity: number;
  reservationAllocationSlots: number;
  maxVehiclesPerUser: number;
}

export const systemSettingsService = {
  getSettings: async (): Promise<ApiResponse<SystemSettings>> => {
    return apiRequest<SystemSettings>("GET", "/system-settings");
  },
};
