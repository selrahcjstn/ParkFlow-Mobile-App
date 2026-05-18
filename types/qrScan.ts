export type QrScanResult = {
  qrCodeHash: string;
  parkeeName: string;
  idNumber: string;
  plateNumber: string;
  vehicleBrand: string;
  role: string;
  courseYearSection?: string;
  department?: string;
  entryTime: string;
  entryDate: string;
  status: string;
  entryGracePeriod?: string;
  estimatedExitTime?: string | null;
  maximumExitTime?: string | null;
};
