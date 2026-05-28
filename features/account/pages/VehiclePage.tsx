import { ContentWrapper } from "@/components/layouts";
import { vehicleService } from "@/features/user/services/vehicle.service";
import { VehicleResponse } from "@/features/user/types/vehicle.types";
import { Search, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "expo-router";

export default function VehiclePage() {
  const navigation = useNavigation();

  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const mockVehicles: VehicleResponse[] = [
    {
      id: "mock-1",
      plateNumber: "ABC 1234",
      brand: "Toyota Vios",
      vehicleType: 1,
      status: "Parked",
      isPrimary: true,
      qrCodeHash: "mock-qr-1",
    },
    {
      id: "mock-2",
      plateNumber: "NDG 5732",
      brand: "Honda Civic",
      vehicleType: 1,
      status: "Active",
      isPrimary: false,
      qrCodeHash: "mock-qr-2",
    },
    {
      id: "mock-3",
      plateNumber: "XYZ 9999",
      brand: "Yamaha NMAX",
      vehicleType: 0,
      status: "Active",
      isPrimary: false,
      qrCodeHash: "mock-qr-3",
    },
  ];

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const res = await vehicleService.getVehicles();
      if (res?.isSuccess && res.data && res.data.length > 0) {
        setVehicles(res.data);
      } else {
        setVehicles(mockVehicles);
      }
    } catch {
      setVehicles(mockVehicles);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      navigation.setParams({ hasScrolled: scrolled } as any);
    }
  };

  const getVehicleTypeLabel = (type: any) => {
    if (type === 0 || type === "0") return "Motorcycle";
    if (type === 1 || type === "1") return "Sedan";
    if (type === 2 || type === "2") return "SUV / AUV";
    return "Sedan";
  };

  const filteredVehicles = vehicles.filter((v) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      v.plateNumber.toLowerCase().includes(query) ||
      v.brand.toLowerCase().includes(query)
    );
  });

  const handleOpenMenu = (vehicle: VehicleResponse) => {
    setSelectedVehicle(vehicle);
    setMenuVisible(true);
  };

  const handleMakePrimary = () => {
    if (!selectedVehicle) return;
    setVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        isPrimary: v.id === selectedVehicle.id,
      }))
    );
    setMenuVisible(false);
  };

  const handleRemoveVehicle = () => {
    if (!selectedVehicle) return;
    setVehicles((prev) => prev.filter((v) => v.id !== selectedVehicle.id));
    setMenuVisible(false);
  };

  const renderVehicleItem = ({ item }: { item: VehicleResponse }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleOpenMenu(item)}
        className="bg-light-surface dark:bg-dark-surface rounded-card p-6 border border-light-border dark:border-dark-border mb-4 flex-row justify-between items-center"
      >
        <View className="flex-1 pr-3">
          <Text className="text-[26px] font-black text-light-text dark:text-dark-text tracking-wide mb-1">
            {item.plateNumber}
          </Text>
          <Text className="font-heavy text-sm text-light-text/75 dark:text-dark-text/75 mb-3">
            {item.brand}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="bg-light-background dark:bg-dark-background px-2.5 py-0.5 rounded-md border border-light-border/40 dark:border-dark-border/40">
              <Text className="text-[10px] font-heavy text-light-muted dark:text-dark-muted uppercase tracking-wider">
                {getVehicleTypeLabel(item.vehicleType)}
              </Text>
            </View>
            {item.isPrimary && (
              <View className="bg-light-success/15 px-2.5 py-0.5 rounded-md border border-light-success/20">
                <Text className="text-light-success font-heavy text-[9px] uppercase tracking-wider">
                  Primary
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="items-end justify-center">
          <View className={`px-3 py-1 rounded-full ${item.status === "Parked" ? "bg-light-warning/10 border border-light-warning/20" : "bg-light-success/10 border border-light-success/20"}`}>
            <Text className={`font-heavy text-[10px] uppercase tracking-wider ${item.status === "Parked" ? "text-light-warning" : "text-light-success"}`}>
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ContentWrapper noPaddingY>
      <View className="flex-row items-center bg-light-surface dark:bg-dark-surface rounded-xl px-4 py-2 border border-light-border dark:border-dark-border mt-4 mb-5">
        <Search size={18} color="#71717A" strokeWidth={2.2} />
        <TextInput
          className="flex-1 ml-3 font-regular text-[14px] text-light-text dark:text-dark-text py-1.5"
          placeholder="Search plate or model..."
          placeholderTextColor="#A1A1AA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D22730" />
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicleItem}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 80,
          }}
          ListEmptyComponent={
            <View className="py-12 items-center justify-center px-6 border border-dashed border-light-border dark:border-dark-border rounded-card">
              <Text className="font-heavy text-sm text-light-muted dark:text-dark-muted">
                No Vehicles Found
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-light-danger items-center justify-center border border-light-danger"
      >
        <Plus size={24} color="#FFF" strokeWidth={3} />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/45 justify-end"
          onPress={() => setMenuVisible(false)}
        >
          <View className="bg-light-surface dark:bg-dark-surface rounded-t-[28px] px-6 pt-5 pb-8 border-t border-light-border dark:border-dark-border">
            <View className="w-10 h-1.5 rounded-full bg-light-border/80 dark:bg-dark-border/80 self-center mb-5" />
            
            {selectedVehicle && (
              <View className="mb-4">
                <Text className="text-light-text dark:text-dark-text font-black text-[22px] tracking-wide">
                  {selectedVehicle.plateNumber}
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-heavy text-sm mt-1">
                  {selectedVehicle.brand} · {getVehicleTypeLabel(selectedVehicle.vehicleType)}
                </Text>
              </View>
            )}

            <View className="h-px bg-light-border/40 dark:bg-dark-border/20 my-4" />

            <View className="gap-1">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleMakePrimary}
                className="py-4 w-full"
              >
                <Text className="text-light-text dark:text-dark-text font-heavy text-base">
                  Make Primary Vehicle
                </Text>
              </TouchableOpacity>

              <View className="h-[1px] bg-light-border/40 dark:bg-dark-border/20" />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setMenuVisible(false)}
                className="py-4 w-full"
              >
                <Text className="text-light-text dark:text-dark-text font-heavy text-base">
                  View QR Code
                </Text>
              </TouchableOpacity>

              <View className="h-[1px] bg-light-border/40 dark:bg-dark-border/20" />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setMenuVisible(false)}
                className="py-4 w-full"
              >
                <Text className="text-light-text dark:text-dark-text font-heavy text-base">
                  Edit Vehicle
                </Text>
              </TouchableOpacity>

              <View className="h-[1px] bg-light-border/40 dark:bg-dark-border/20" />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleRemoveVehicle}
                className="py-4 w-full"
              >
                <Text className="text-light-danger font-heavy text-base">
                  Remove Vehicle
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ContentWrapper>
  );
}
