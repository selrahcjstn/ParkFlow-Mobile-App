export type QrScanResult = {
  qrCodeHash: string;
  parkeeName: string;
  idNumber: string;
  plateNumber: string;
  vehicleBrand: string;
  role: string;
  courseYearSection?: string;
  department?: string;
  entryTime: string;
  entryDate: string;
  status: string;
  entryGracePeriod?: string;
  estimatedExitTime?: string | null;
  maximumExitTime?: string | null;
};

export type ExitResponse = {
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  overstayTime: number;
  penaltyFee: number;
  referenceNumber?: string | null;
  ReferenceNumber?: string | null;
};

export type EntryResponse = {
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber: string;
  status: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  entryTime: string;
  entryDate: string;
  endTime: string;
  maximumExitTime: string;
};

export type ScanRequest = {
  qrCodeHash: string;
  userId: string;
};

export type ProcessPaymentResponse = {
  referenceNumber: string;
  violationType: string;
  penaltyFee: number;
  settlementStatus: string;
  paidAt: string;
  ownerFirstName: string;
  ownerLastName: string;
  plateNumber: string;
  vehicleBrand: string;
  vehicleType: string;
  guardName: string;
};

export type ReservationScanVerificationResponse = {
  isValid: boolean;
  statusMessage: string;
  reservationId: string;
  referenceNumber: string;
  type: number | string;
  typeName: string;
  status: number | string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  driverName: string;
  driverEmail: string;
  vehicleId?: string | null;
  plateNumber: string;
  brand: string;
  vehicleQrCodeHash: string;
  reason: string;
};
