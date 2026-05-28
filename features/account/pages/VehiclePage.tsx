import { ContentWrapper } from "@/components/layouts";
import { vehicleService } from "@/features/user/services/vehicle.service";
import { VehicleResponse } from "@/features/user/types/vehicle.types";
import { useNavigation } from "expo-router";
import { MoreHorizontal, Plus, Search } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function VehiclePage() {
  const navigation = useNavigation();

  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleResponse | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(350)).current;

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
      status: "Exited",
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

  useEffect(() => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(350);
    }
  }, [menuVisible]);

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      navigation.setParams({ hasScrolled: yOffset > 0 } as any);
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

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 350,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const handleMakePrimary = () => {
    if (!selectedVehicle) return;
    setVehicles((prev) =>
      prev.map((v) => ({ ...v, isPrimary: v.id === selectedVehicle.id })),
    );
    closeMenu();
  };

  const handleRemoveVehicle = () => {
    if (!selectedVehicle) return;
    setVehicles((prev) => prev.filter((v) => v.id !== selectedVehicle.id));
    closeMenu();
  };

  const renderVehicleItem = ({ item }: { item: VehicleResponse }) => {
    const isParked = item.status === "Parked";
    const isExited = item.status === "Exited";

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => handleOpenMenu(item)}
        className="mb-3 rounded-card overflow-hidden border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
      >
        <View className="p-5">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-[22px] font-black text-light-text dark:text-dark-text tracking-widest">
                    {item.plateNumber}
                  </Text>
                  {item.isPrimary && (
                    <View className="bg-light-primary/10 dark:bg-dark-primary/10 px-2 py-0.5 rounded-md">
                      <Text className="text-light-primary dark:text-dark-primary font-heavy text-[9px] uppercase tracking-wider">
                        Primary
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="font-book text-[13px] text-light-muted dark:text-dark-muted mt-0.5">
                  {item.brand}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleOpenMenu(item)}
              className="w-8 h-8 items-center justify-center rounded-lg bg-light-background dark:bg-dark-background -mt-0.5 border border-light-border/40 dark:border-dark-border/40"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MoreHorizontal size={16} color="#71717A" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View className="h-px bg-light-border/50 dark:bg-dark-border/50 mb-3" />

          <View className="flex-row items-center justify-between">
            <View className="bg-light-background dark:bg-dark-background px-3 py-1 rounded-lg border border-light-border/60 dark:border-dark-border/60">
              <Text className="text-[11px] font-heavy text-light-muted dark:text-dark-muted uppercase tracking-wider">
                {getVehicleTypeLabel(item.vehicleType)}
              </Text>
            </View>

            <View
              className={`flex-row items-center gap-1.5 px-3 py-1 rounded-lg border ${
                isParked
                  ? "bg-light-warning/10 dark:bg-dark-warning/10 border-light-warning/20"
                  : isExited
                    ? "bg-light-surfaceMuted/40 dark:bg-dark-surfaceMuted/20 border-light-border/40"
                    : "bg-light-success/10 dark:bg-dark-success/10 border-light-success/20"
              }`}
            >
              {!isExited && (
                <View
                  className={`w-1.5 h-1.5 rounded-full ${
                    isParked
                      ? "bg-light-warning dark:bg-dark-warning"
                      : "bg-light-success dark:bg-dark-success"
                  }`}
                />
              )}
              <Text
                className={`font-heavy text-[11px] uppercase tracking-wider ${
                  isParked
                    ? "text-light-warning dark:text-dark-warning"
                    : isExited
                      ? "text-light-muted dark:text-dark-muted"
                      : "text-light-success dark:text-dark-success"
                }`}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ContentWrapper noPaddingY>
      <View className="flex-row items-center bg-light-surface dark:bg-dark-surface rounded-xl px-4 border border-light-border dark:border-dark-border mt-4 mb-4">
        <Search size={16} color="#A1A1AA" strokeWidth={2.2} />
        <TextInput
          className="flex-1 ml-3 font-regular text-[14px] text-light-text dark:text-dark-text py-3.5"
          placeholder="Search plate or model..."
          placeholderTextColor="#A1A1AA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View className="w-5 h-5 rounded-full bg-light-border dark:bg-dark-border items-center justify-center">
              <Text className="text-light-muted dark:text-dark-muted text-[11px] font-black">
                ×
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {!isLoading && filteredVehicles.length > 0 && (
        <Text className="text-[11px] font-heavy text-light-muted dark:text-dark-muted uppercase tracking-wider mb-3">
          {filteredVehicles.length} Vehicle
          {filteredVehicles.length !== 1 ? "s" : ""}
        </Text>
      )}

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
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="py-14 items-center justify-center px-6 border border-dashed border-light-border dark:border-dark-border rounded-card mt-2">
              <Text className="font-heavy text-sm text-light-text dark:text-dark-text mb-1">
                No Vehicles Found
              </Text>
              <Text className="font-regular text-xs text-light-muted dark:text-dark-muted text-center">
                {searchQuery
                  ? "Try a different search term"
                  : "Add your first vehicle to get started"}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        className="absolute bottom-6 right-6 h-14 px-5 rounded-full bg-light-primary dark:bg-dark-primary flex-row items-center gap-2 border border-light-primary/20 dark:border-dark-primary/20"
      >
        <Plus size={20} color="#FFF" strokeWidth={2.5} />
        <Text className="text-white font-heavy text-sm">Add Vehicle</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeMenu}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={closeMenu}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={{ transform: [{ translateY: slideAnim }] }}
              className="bg-light-surface dark:bg-dark-surface rounded-t-[28px] pt-5 pb-10 border border-light-border dark:border-dark-border"
            >
              <View className="w-10 h-1 rounded-full bg-light-border dark:bg-dark-border self-center mb-5" />

              {selectedVehicle && (
                <View className="px-6 mb-5">
                  <View className="flex-row items-center gap-3">
                    <View>
                      <Text className="text-light-text dark:text-dark-text font-black text-[20px] tracking-widest">
                        {selectedVehicle.plateNumber}
                      </Text>
                      <Text className="text-light-muted dark:text-dark-muted font-book text-[13px] mt-0.5">
                        {selectedVehicle.brand} ·{" "}
                        {getVehicleTypeLabel(selectedVehicle.vehicleType)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View className="h-px bg-light-border/40 dark:bg-dark-border/30 mb-2" />

              <View className="px-4">
                <TouchableOpacity
                  activeOpacity={0.65}
                  onPress={handleMakePrimary}
                  className="flex-row items-center px-3 py-4 rounded-xl"
                >
                  <Text className="text-light-text dark:text-dark-text font-heavy text-[15px] flex-1">
                    Make Primary Vehicle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.65}
                  onPress={closeMenu}
                  className="flex-row items-center px-3 py-4 rounded-xl"
                >
                  <Text className="text-light-text dark:text-dark-text font-heavy text-[15px] flex-1">
                    Edit Vehicle
                  </Text>
                </TouchableOpacity>

                <View className="h-px bg-light-border/40 dark:bg-dark-border/20 my-1 mx-3" />

                <TouchableOpacity
                  activeOpacity={0.65}
                  onPress={handleRemoveVehicle}
                  className="flex-row items-center px-3 py-4 rounded-xl"
                >
                  <Text className="text-light-danger dark:text-dark-danger font-heavy text-[15px] flex-1">
                    Remove Vehicle
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </ContentWrapper>
  );
}
