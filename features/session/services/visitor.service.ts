import { api } from '@/services/axios';
import { addFile } from '@/features/auth/services/registration.service';
import type { ApiResponse } from '@/types/api-response.types';
import type {
  VehicleLookupResponse,
  VisitorEntryRequest,
  VisitorEntryResponse,
  VisitorExitRequest,
  VisitorExitResponse,
} from "@/features/user/types/vehicle.types";
import { apiRequest } from "@/services/common.service";

export const visitorService = {
  lookupByPlate: async (plateNumber: string) => {
    return apiRequest<VehicleLookupResponse>(
      "get",
      `/visitors/lookup/${encodeURIComponent(plateNumber.trim().toUpperCase())}`,
      undefined,
      { handleNetworkErrorLocally: true },
    );
  },

  createVisitorEntry: async (payload: VisitorEntryRequest) => {
    const form = new FormData();
    const { license, profilePhoto, vehiclePhoto, ...fields } = payload;
    for (const [key, value] of Object.entries(fields)) if (value != null) form.append(key, String(value));
    if (license) addFile(form, 'license', license);
    if (profilePhoto) addFile(form, 'profilePhoto', profilePhoto);
    if (vehiclePhoto) addFile(form, 'vehiclePhoto', vehiclePhoto);
    return api.post('/visitors/entry', form, { timeout: 120000, handleNetworkErrorLocally: true } as any) as unknown as ApiResponse<VisitorEntryResponse>;
  },

  exitVisitor: async (payload: VisitorExitRequest) => {
    return apiRequest<VisitorExitResponse, VisitorExitRequest>(
      "patch",
      "/visitors/exit",
      payload,
      { handleNetworkErrorLocally: true },
    );
  },
};
