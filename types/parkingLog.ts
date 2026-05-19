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

export type ParkingLogTodayResponse = {
  totalCount: number;
  limit: number;
  items: ParkingLogEntryResponse[];
};

export type ParkingLogData = ParkingLogEntryResponse;

export type ParkingLogExitResponse = {
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  idNumber: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  overstayTime: number;
  penaltyFee: number;
};
