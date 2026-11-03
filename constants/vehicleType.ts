export enum VehicleType {
  Motorcycle = 0,
  ElectricBike = 1,
  Car = 2,
}

export const VEHICLE_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "Motorcycle", value: VehicleType.Motorcycle.toString() },
  { label: "E-Bike", value: VehicleType.ElectricBike.toString() },
  { label: "Car", value: VehicleType.Car.toString() },
];

export function getVehicleTypeLabel(vehicleType?: number | string | null) {
  switch (vehicleType) {
    case VehicleType.Motorcycle:
    case VehicleType.Motorcycle.toString():
    case 'Motorcycle':
      return "Motorcycle";
    case VehicleType.ElectricBike:
    case VehicleType.ElectricBike.toString():
    case 'ElectricBike':
    case 'Electric Bike':
    case 'E-Bike':
    case 'E-bike':
      return "E-Bike";
    case VehicleType.Car:
    case VehicleType.Car.toString():
    case 'Car':
      return "Car";
    default:
      return "Vehicle";
  }
}
