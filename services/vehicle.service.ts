import type { ApiResponse } from "@/types/apiResponse";
import type { VehicleRequest } from "@/types/vehicle";
import { api } from "./api";

export const vehicleService = {
  createVehicle: async (body: VehicleRequest) => {
    const res = (await api.post(
      "/vehicles/create",
      body,
    )) as ApiResponse<string>;
    return res;
  },
};
