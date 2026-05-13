import { useVehicleStore } from "@/store/useVehicleStore";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function GuardDashboard() {
  const vehicle = useVehicleStore((state) => state.vehicle);
  const loadVehicle = useVehicleStore((state) => state.loadVehicle);

  useEffect(() => {
    loadVehicle();
  }, []);

  if (!vehicle) {
    return <Text>Loading vehicle...</Text>;
  }

  return (
    <View>
      <Text>Guard Dashboard</Text>
      <Text>Vehicle Plate: {vehicle.plateNumber}</Text>
      <Text>Vehicle Brand: {vehicle.brand}</Text>
    </View>
  );
}
