export type QrScanResult = {
  qrCodeHash: string;
  parkeeName: string;
  idNumber: string;
  plateNumber: string;
  vehicleBrand: string;
  role: string;
  course?: string;
  entryTime: string;
  entryDate: string;
  parkingLogId: string;
  status: "Active";
};
