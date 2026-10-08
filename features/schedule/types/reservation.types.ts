export enum ReservationStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Cancelled = 3,
  Completed = 4,
}

export type ParkingReservationResponse = {
  availability?: ReservationAvailability | null;
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

export type GuardReservationItem = Pick<ParkingReservationResponse,
  "id" | "userFullName" | "plateNumber" | "reservationDate" | "startTime" | "endTime" | "status" | "type">;
export type GuardReservationPage = {
  items: GuardReservationItem[];
  totalCount: number;
  capacity?: ReservationAvailability | null;
};

export type ReservationAvailability = {
  totalCapacity: number;
  allocationPercent: number;
  reservationCapacity: number;
  bookedSlots: number;
  availableSlots: number;
};
