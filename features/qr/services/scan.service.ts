import {
    EntryResponse,
    ExitResponse,
    ScanRequest,
    StudentScanVerificationRequest,
    StudentScanVerificationResponse,
} from "@/features/qr/types/qr-scan.types";
import { apiRequest } from "@/services/common.service";

export const scanService = {
  processPayment: (payload: { referenceNumber: string }) =>
    apiRequest<import('../types/qr-scan.types').ProcessPaymentResponse, { referenceNumber: string }>('post', '/violations/process-payment', payload),
  preview: (qrCode: string) => apiRequest<import('../types/qr-scan.types').VehicleScanPreview>('post', '/parking-logs/preview', { qrCode }),
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


  verifyReservationScan: async (qrCode: string) => {
    return apiRequest<
      import("@/features/qr/types/qr-scan.types").ReservationScanVerificationResponse,
      { qrCode: string }
    >("post", "/parking-reservations/verify-scan", { qrCode });
  },

  verifyStudentScan: async (payload: StudentScanVerificationRequest) => {
    return apiRequest<
      StudentScanVerificationResponse,
      StudentScanVerificationRequest
    >("post", "/parking-logs/verify-student-scan", payload);
  },
};
