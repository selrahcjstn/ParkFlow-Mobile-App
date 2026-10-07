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
  rejectionReason?: string;
};

export type VehicleLookupResponse = {
  lookupType: "Registered" | "Visitor" | "Unknown";
  isRegistered: boolean;
  isVisitor: boolean;
  isInside: boolean;
  plateNumber: string;
  // Registered vehicle info
  vehicleId?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerRole?: string | null;
  // Visitor info
  visitorId?: string | null;
  fullName?: string | null;
  contactNumber?: string | null;
  // Common vehicle info
  brand?: string | null;
  vehicleType?: string | null;
  vehicleTypeValue?: number | null;
  // Active session info
  activeSessionId?: string | null;
  entryTime?: string | null;
  purpose?: string | null;
  destination?: string | null;
  entryMethod?: string | null;
};

export type VisitorEntryRequest = {
  plateNumber: string;
  fullName?: string;
  contactNumber?: string;
  vehicleType: number;
  brand: string;
  purpose?: string;
  destination?: string;
  guardUserId?: string | null;
  entryGate?: string | null;
};

export type VisitorEntryResponse = {
  visitorId: string;
  sessionId: string;
  fullName: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  entryTime: string;
  purpose?: string | null;
  destination?: string | null;
  status: string;
  isReturning: boolean;
};

export type VisitorExitRequest = {
  plateNumber: string;
  guardUserId?: string | null;
  exitGate?: string | null;
};

export type VisitorExitResponse = {
  visitorId: string;
  sessionId: string;
  fullName: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  purpose?: string | null;
  destination?: string | null;
  status: string;
};
