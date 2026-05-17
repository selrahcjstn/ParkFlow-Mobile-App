export type ParkingLogRequest = {
  qrCodeHash: string;
  userId: string;
  entryTime: string;
};

export type ParkingLogData = {
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
  entryTime: string;
  entryDate: string;
};

export type ParkingLogTodayResponse = {
  totalCount: number;
  limit: number;
  items: ParkingLogData[];
};
