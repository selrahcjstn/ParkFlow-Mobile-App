export type GetParkingSessionStatsResponse = {
  activeSessionCount: number;
  overstayCount: number;
  maximumCapacity: number;
  manualSessionCount: number;
};


export type GetActiveParkingSessionResponse = {
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;

  status: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;

  entryTime: string;
  maximumExitTime: string;
  totalParkingHours: string;
  amount?: number | null;
  overstayHours?: number | null;
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
  maximumExitTime: string;
  entryMethod: string;
};

