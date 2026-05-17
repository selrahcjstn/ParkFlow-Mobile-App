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
