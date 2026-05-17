export enum VehicleType {
  Motorcycle = 0,
  ElectricBike = 1,
  Car = 2,
}

export const VEHICLE_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "Motorcycle", value: VehicleType.Motorcycle.toString() },
  { label: "Electric Bike", value: VehicleType.ElectricBike.toString() },
  { label: "Car", value: VehicleType.Car.toString() },
];

export function getVehicleTypeLabel(vehicleType?: number | string | null) {
  switch (vehicleType) {
    case VehicleType.Motorcycle:
    case VehicleType.Motorcycle.toString():
      return "Motorcycle";
    case VehicleType.ElectricBike:
    case VehicleType.ElectricBike.toString():
      return "Electric Bike";
    case VehicleType.Car:
    case VehicleType.Car.toString():
      return "Car";
    default:
      return "Motor";
  }
}
