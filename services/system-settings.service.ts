import type { ApiResponse } from "@/types/api-response.types";
import { apiRequest } from "./common.service";

export interface VehicleParkingSettings {
  totalCapacity: number;
  reservationAllocationSlots: number;
}

export interface SystemSettings {
  carParking: VehicleParkingSettings;
  motorcycleParking: VehicleParkingSettings;
  personnelFreeParkingStart: string;
  personnelFreeParkingEnd: string;
  isGracePeriodEnabled: boolean;
  gracePeriodMinutes: number;
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
