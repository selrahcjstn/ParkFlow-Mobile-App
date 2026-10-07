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
    return apiRequest<VisitorEntryResponse, VisitorEntryRequest>(
      "post",
      "/visitors/entry",
      payload,
      { handleNetworkErrorLocally: true },
    );
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
