import type { ParkingReservationResponse } from '@/features/schedule/types/reservation.types';
import type { VehicleResponse } from '@/features/user/types/vehicle.types';

export function getReservationVehicleType(
  reservation: Pick<ParkingReservationResponse, 'vehicleType' | 'vehicleId'> | null,
  vehicles: Pick<VehicleResponse, 'id' | 'vehicleType'>[],
) {
  return reservation?.vehicleType ?? vehicles.find(v => v.id === reservation?.vehicleId)?.vehicleType;
}
