export type HistoryResponse = {
  parkingLogId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;
  status: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  settlementStatus: string;
  totalFee: number;
  mustExitBy: string;
  totalParkingHours: string;
};
