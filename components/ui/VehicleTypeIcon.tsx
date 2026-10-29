import { Bike, Car, ParkingSquare } from 'lucide-react-native';
import { getVehicleTypeLabel } from '@/constants/vehicleType';
import { MotorcycleIcon } from './MotorcycleIcon';

export default function VehicleTypeIcon({ vehicleType, size = 16, color }: {
  vehicleType?: number | string | null;
  size?: number;
  color?: string;
}) {
  const label = getVehicleTypeLabel(vehicleType);
  if (label === 'Motorcycle') return <MotorcycleIcon size={size} color={color} />;
  const Icon = label === 'Car' ? Car : label === 'Electric Bike' ? Bike : ParkingSquare;
  return <Icon size={size} color={color} />;
}
