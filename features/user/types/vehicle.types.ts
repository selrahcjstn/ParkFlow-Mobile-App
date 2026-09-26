import { VehicleType } from "@/constants/vehicleType";

export type VehicleResponse = {
  id: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  vehicleType: VehicleType;
  status: string;
  isPrimary?: boolean;
  orcrDocumentUrl?: string;
  vehiclePictureUrl?: string;
  verificationStatus?: number;
};
