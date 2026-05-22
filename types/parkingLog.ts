export type ParkingLogRequest = {
  qrCodeHash: string;
  userId: string;
};

export type ParkingLogEntryResponse = {
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

export type GetParkingSessionStatsResponse = {
  activeSessionCount: number;
  overstayCount: number;
  maximumCapacity: number;
};

export type ParkingLogData = ParkingLogEntryResponse;

export type ParkingLogExitResponse = {
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

export type GetActiveParkingSessionResponse = {
  firstName: string;
  lastName: string;
  phoneNumber: string;

  status: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;

  entryTime: string;
  maximumExitTime: string;
  totalParkingHours: string;
};
