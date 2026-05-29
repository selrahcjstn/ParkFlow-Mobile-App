import type { VehicleResponse } from "@/features/user/types/vehicle.types";

import { apiRequest } from "../../../services/common.service";

export const vehicleService = {
  getVehicles: async () => {
    return apiRequest<VehicleResponse[]>("get", "/vehicles/owner/my");
  },
  createVehicle: async (payload: {
    ownerId: string;
    plateNumber: string;
    brand: string;
    vehicleType: number;
  }) => {
    return apiRequest<string, typeof payload>("post", "/vehicles/create", payload);
  },
  updateVehicle: async (id: string, payload: {
    plateNumber: string;
    brand: string;
    vehicleType: number;
  }) => {
    return apiRequest<string, typeof payload>("put", `/vehicles/${id}`, payload);
  },
  deleteVehicle: async (id: string) => {
    return apiRequest<string>("delete", `/vehicles/${id}`);
  },
  setPrimaryVehicle: async (id: string) => {
    return apiRequest<string>("post", `/vehicles/${id}/set-primary`);
  },
};
