export type GetParkingSessionStatsResponse = {
  activeSessionCount: number;
  overstayCount: number;
  maximumCapacity: number;
  manualSessionCount: number;
  carCount?: number; motorcycleCount?: number; carCapacity?: number; motorcycleCapacity?: number;
};


export type GetActiveParkingSessionResponse = {
  role?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;

  status: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;

  entryTime: string;
  maximumExitTime: string | null;
  totalParkingHours: string;
  amount?: number | null;
  overstayHours?: number | null;
  entryMethod?: string | number;
};

export type ManualEntryRequest = {
  acceptUnscheduledFee?: boolean;
  plateNumber: string;
  vehicleType: number;
  phoneNumber: string;
  brand: string;
  userId: string;
};

export type ManualEntryResponse = {
  feeOptionAvailable?: boolean;
  entryFee?: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  status: string;
  phoneNumber: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  vehicleType: string;
  entryTime: string;
  entryDate: string;
  maximumExitTime: string | null;
  entryMethod: string;
};

export type ManualExitRequest = {
  plateNumber: string;
  userId: string;
};

export type ManualExitResponse = {
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  status: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  overstayTime: number;
  penaltyFee: number;
  referenceNumber?: string;
  settlementStatus?: string;
};


