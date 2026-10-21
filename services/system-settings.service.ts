import type { ApiResponse } from "@/types/api-response.types";
import { apiRequest } from "./common.service";

export interface VehicleParkingSettings {
  totalCapacity: number;
  reservationAllocationSlots: number;
  violationRatePerHour: number;
  baseFee: number;
  entryFee: number;
  dailyOverstayFee: number;
}

export interface SystemSettings {
  carParking: VehicleParkingSettings;
  motorcycleParking: VehicleParkingSettings;
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

export function getVehicleParkingSettings(settings: SystemSettings | null | undefined, type?: string | number | null) {
  return type === 2 || type === "2" || String(type).toLowerCase() === "car"
    ? settings?.carParking : settings?.motorcycleParking;
}
