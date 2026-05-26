import { AlertModal } from "@/components/shared";
import { AppButton, AppInput, AppSelect } from "@/components/ui";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useApiMutation } from "@/hooks";
import { PLATE_REGEX } from "@/utils/registerValidation";
import { useRouter } from "expo-router";
import { AlertCircle, ChevronLeft } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingVehiclePage() {
  const router = useRouter();
  const { run: updateVehicle, isLoading } = useApiMutation(
    onboardingService.updateVehicle,
  );
  const { vehicle, setVehicleField } = useOnboardingStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<
    "error" | "warning" | "info"
  >("error");
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "error",
      icon?: React.ReactNode,
    ) => {
      setModalTitle(title);
      setModalMessage(message);
      setModalVariant(variant);
      setModalIcon(icon ?? <AlertCircle size={28} color="#F59E0B" />);
      setModalVisible(true);
    },
    [],
  );

  const handleNext = async () => {
    const plateNumber = vehicle.plateNumber.trim().toUpperCase();
    const brand = vehicle.brand.trim();

    if (!plateNumber || !brand) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
        "warning",
      );
      return;
    }

    if (!PLATE_REGEX.test(plateNumber)) {
      showAlert(
        "Invalid Plate Number",
        "Use 4-12 characters (letters, numbers, or hyphens).",
        "warning",
      );
      return;
    }

    if (brand.length < 2 || brand.length > 30) {
      showAlert(
        "Invalid Motor Brand",
        "Brand must be 2-30 characters.",
        "warning",
      );
      return;
    }

    try {
      const response = await updateVehicle({
        plateNumber,
        brand,
        vehicleType: Number(vehicle.vehicleType),
      });

      if (!response?.isSuccess) {
        showAlert(
          "Vehicle Update Failed",
          response?.message || "Please try again.",
          "error",
        );
        return;
      }

      router.replace("/(auth)/onboarding-schedule");
    } catch (error) {
      showAlert("Vehicle Update Failed", "Please try again.", "error");
    }
  };

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        <View className="flex-row items-center justify-between px-4 py-2 bg-light-surface">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
          >
            <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            className="text-light-text text-[17px] font-black text-center flex-1"
          >
            Vehicle Info
          </Text>

          <View className="w-10" />
        </View>
      }
    >
      <View className="flex-1 bg-light-surface px-6 pt-4 pb-12">
        <Text className="text-light-muted font-regular text-[13px] mb-6">
          Register the vehicle you will be parking on premises.
        </Text>

        <AppInput
          label="Vehicle Plate Number"
          placeholder="Enter Plate Number"
          value={vehicle.plateNumber}
          onChangeText={(v) => setVehicleField("plateNumber", v)}
        />
        <AppInput
          label="Motor Brand"
          placeholder="e.g. Honda, Yamaha"
          value={vehicle.brand}
          onChangeText={(v) => setVehicleField("brand", v)}
        />
        <AppSelect
          label="Vehicle Type"
          placeholder="Pick a Vehicle Type"
          options={VEHICLE_TYPE_OPTIONS}
          value={vehicle.vehicleType.toString()}
          onChange={(v) => setVehicleField("vehicleType", Number(v))}
        />

        <AppButton
          label="Continue"
          variant="primary"
          size="lg"
          className="mt-8"
          onPress={handleNext}
          loading={isLoading}
          disabled={isLoading}
        />
      </View>

      <AlertModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        message={modalMessage}
        variant={modalVariant}
        icon={modalIcon}
      />
    </AuthLayout>
  );
}
