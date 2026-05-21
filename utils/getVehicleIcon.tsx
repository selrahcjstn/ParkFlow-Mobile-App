import { VehicleType } from "@/constants/vehicleType";
import { Bike, CircleParking, Zap } from "lucide-react-native";
import type { ReactNode } from "react";

/**
 * Returns the appropriate lucide icon for a vehicle type.
 * - Motorcycle → Bike
 * - Electric Bike → Zap
 * - Car → CircleParking
 */
export function getVehicleIcon(
  vehicleType?: number | string | null,
  size = 18,
  color = "#71717A",
  strokeWidth = 2,
): ReactNode {
  switch (vehicleType) {
    case VehicleType.Motorcycle:
    case VehicleType.Motorcycle.toString():
      return <Bike size={size} color={color} strokeWidth={strokeWidth} />;
    case VehicleType.ElectricBike:
    case VehicleType.ElectricBike.toString():
      return <Zap size={size} color={color} strokeWidth={strokeWidth} />;
    case VehicleType.Car:
    case VehicleType.Car.toString():
      return (
        <CircleParking size={size} color={color} strokeWidth={strokeWidth} />
      );
    default:
      return <Bike size={size} color={color} strokeWidth={strokeWidth} />;
  }
}
