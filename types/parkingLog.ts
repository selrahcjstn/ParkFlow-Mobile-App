export type ParkingLogRequest = {
  qrCodeHash: string;
  userId: string;
};

export type ParkingLogEntryResponse = {
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  idNumber: string;
  course: string;
  yearLevel: number;
  section: string;
  department: string;
  plateNumber: string;
  brand: string;
  vehicleType?: string;
  entryTime: string;
  entryDate: string;
  endTime: string;
  maximumExitTime: string | null;
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
  course: string;
  yearLevel: number;
  section: string;
  department: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  entryTime: string;
  entryDate: string;
  exitTime: string;
  entryGracePeriod: string;
  exitGracePeriod: string;
  maximumExitTime: string;
  penaltyFee: number;
  totalParkingHours: number;
};
