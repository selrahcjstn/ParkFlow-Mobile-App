export type ParkingLogRequest = {
  qrCodeHash: string;
  userId: string;
  entryTime: string;
};

export type ParkingLogResponse = {
  id: string;
  qrCodeHash: string;
  guardId: string;
  entryTime: string;
  exitTime: string | null;
};
