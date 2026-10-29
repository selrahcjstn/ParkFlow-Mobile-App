export type GetParkingSessionStatsResponse = {
  visitorCount?: number; registeredVehicleCount?: number;
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
  overstayHours?: number | null;
  entryMethod?: string | number;
};

export type ManualEntryRequest = {
  plateNumber: string;
  vehicleType: number;
  phoneNumber: string;
  brand: string;
  userId: string;
};

export type ManualEntryResponse = {
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
  penaltyFee?: number; referenceNumber?: string; settlementStatus?: string;
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
};


