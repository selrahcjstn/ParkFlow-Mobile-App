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
