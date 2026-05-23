export interface ParkingHistoryResponse {
  firstName: string;
  lastName: string;
  roleName: string;
  brand: string;
  type: string;
  entryTime: string;
  exitTime: string;
  parkingDuration: number;
  hasViolation: boolean;
  plateNumber: string;
}
