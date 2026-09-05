import {
    EntryResponse,
    ExitResponse,
    ProcessPaymentResponse,
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

  processPayment: async (payload: { referenceNumber: string }) => {
    return apiRequest<ProcessPaymentResponse, { referenceNumber: string }>(
      "post",
      "/violations/process-payment",
      payload,
    );
  },

  verifyReservationScan: async (qrCode: string) => {
    return apiRequest<
      import("@/features/qr/types/qr-scan.types").ReservationScanVerificationResponse,
      { qrCode: string }
    >("post", "/parking-reservations/verify-scan", { qrCode });
  },
};
