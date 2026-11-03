import type { VehicleLookupResponse, VehicleResponse } from "@/features/user/types/vehicle.types";

import { apiRequest } from "../../../services/common.service";

export const vehicleService = {
  getVehicles: async () => {
    return apiRequest<VehicleResponse[]>("get", "/vehicles/owner/my");
  },
  lookupByPlate: async (plateNumber: string) => {
    return apiRequest<VehicleLookupResponse>("get", `/vehicles/lookup/${encodeURIComponent(plateNumber.trim().toUpperCase())}`);
  },
  createVehicle: async (payload: {
    ownerId: string;
    plateNumber?: string | null;
    brand: string;
    vehicleType: number;
    orcrDocumentUrl?: string | null;
    vehiclePictureUrl?: string | null;
  }) => {
    return apiRequest<string, typeof payload>("post", "/vehicles/create", payload);
  },
  updateVehicle: async (id: string, payload: {
    plateNumber?: string | null;
    brand: string;
    vehicleType: number;
    orcrDocumentUrl?: string | null;
    vehiclePictureUrl?: string | null;
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

