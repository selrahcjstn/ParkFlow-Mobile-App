export type VehicleScanPreview = {
  fullName: string; role: string; phoneNumber?: string | null; profilePictureUrl?: string | null; vehiclePictureUrl?: string | null;
  plateNumber: string; brand: string; vehicleType: string; qrCodeHash: string; isCurrentlyParked: boolean; canEnter: boolean; entryRestriction?: string | null;
};
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
  estimatedExitTime?: string | null;
  maximumExitTime?: string | null;
};

export type ExitResponse = {
  profilePictureUrl?: string | null; vehiclePictureUrl?: string | null;
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
};

export type EntryResponse = {
  profilePictureUrl?: string | null; vehiclePictureUrl?: string | null;
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
  maximumExitTime: string | null;
  entryMethod?: string;
  qrCodeHash?: string;
};

export type ScanRequest = {
  qrCodeHash: string;
  userId: string;
};


export type ReservationScanVerificationResponse = {
  vehicleType?: string; isCurrentlyParked?: boolean;
  profilePictureUrl?: string | null; vehiclePictureUrl?: string | null;
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

export type StudentScanVerificationRequest = {
  qrContent?: string;
  studentNumber?: string;
  fullName?: string;
  program?: string;
};

export type StudentScanVerificationResponse = {
  isValid: boolean;
  entryStatus: "Approved" | "OutOfSchedule" | "NoScheduleToday" | "CorNotVerified" | "NotFound" | string;
  statusMessage: string;
  studentNumber: string;
  fullName: string;
  program: string;
  section?: string | null;
  yearLevel?: number | null;
  profilePictureUrl?: string | null;
  vehiclePictureUrl?: string | null;
  todaySchedule: string;
  allowedEntryWindow?: string | null;
  corStatus: string;
  hasRegisteredVehicle: boolean;
  vehicleId?: string | null;
  plateNumber?: string | null;
  vehicleBrand?: string | null;
  vehicleType?: string | null;
  vehicleQrCodeHash?: string | null;
  isCurrentlyParked: boolean;
};
