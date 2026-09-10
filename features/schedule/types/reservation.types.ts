export enum ReservationStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Cancelled = 3,
}

export type ParkingReservationResponse = {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  referenceNumber: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: ReservationStatus;
  type?: "Normal" | "Special" | 0 | 1;
  vehicleId?: string | null;
  plateNumber?: string | null;
  brand?: string | null;
  vehicleQrCodeHash?: string | null;
  adminNotes?: string | null;
  approvedAt?: string | null;
  approvedByAdminId?: string | null;
  createdAt: string;
};

export type CreateReservationRequest = {
  reservationDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss or HH:mm
  endTime: string; // HH:mm:ss or HH:mm
  reason: string;
  vehicleId?: string | null;
};
