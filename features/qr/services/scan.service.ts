import {
    EntryResponse,
    ExitResponse,
    ScanRequest,
} from "@/features/qr/types/qr-scan.types";
import { apiRequest } from "@/services/common.service";

export const scanService = {
  register: async (payload: ScanRequest) => {
    return apiRequest<EntryResponse, ScanRequest>(
      "post",
      "/parking-logs/entry",
      payload,
    );
  },

  registerExit: async (payload: ScanRequest) => {
    return apiRequest<ExitResponse, ScanRequest>(
      "patch",
      "/parking-logs/exit",
      payload,
    );
  },
};
