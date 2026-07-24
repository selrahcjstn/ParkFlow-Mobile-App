import { AlertModal } from "@/components/shared";
import { AppButton, AppInput, AppSelect } from "@/components/ui";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { userService } from "@/features/user/services/user.service";
import { useApiMutation } from "@/hooks";
import { PLATE_REGEX } from "@/utils/registerValidation";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { AlertCircle, Camera, CheckCircle, ChevronLeft, FileText } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingVehiclePage() {
  const router = useRouter();
  const { run: updateVehicle, isLoading } = useApiMutation(
    onboardingService.updateVehicle,
  );
  const { vehicle, setVehicleField } = useOnboardingStore();

  const [selectedMotorFile, setSelectedMotorFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [selectedOrcrFile, setSelectedOrcrFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "info",
  });

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "error",
    ) => {
      setModal({ visible: true, title, message, variant });
    },
    [],
  );

  const handlePickMotorFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setSelectedMotorFile(asset);
    } catch {
      showAlert("Upload Failed", "Could not select motor photo.", "error");
    }
  };

  const handlePickOrcrFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setSelectedOrcrFile(asset);
    } catch {
      showAlert("Upload Failed", "Could not select OR/CR file.", "error");
    }
  };

  const handleNext = async () => {
    const plateNumber = vehicle.plateNumber.trim().toUpperCase();
    const brand = vehicle.brand.trim();
    const color = vehicle.color?.trim();

    if (!plateNumber || !brand) {
      showAlert(
        "Missing Information",
        "Please complete all required fields.",
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
      let uploadedMotorUrl = vehicle.motorPictureUrl;
      if (selectedMotorFile) {
        const uploadRes = await userService.uploadMotorPicture(
          selectedMotorFile.uri,
          selectedMotorFile.name || `motor_${Date.now()}.jpg`,
        );
        if (uploadRes?.data?.secureUrl) {
          uploadedMotorUrl = uploadRes.data.secureUrl;
        }
      }

      let uploadedOrcrUrl = vehicle.orcrDocumentUrl;
      if (selectedOrcrFile) {
        const uploadRes = await userService.uploadOrcrDocument(
          selectedOrcrFile.uri,
          selectedOrcrFile.name || `orcr_${Date.now()}.jpg`,
        );
        if (uploadRes?.data?.secureUrl) {
          uploadedOrcrUrl = uploadRes.data.secureUrl;
        }
      }

      const response = await updateVehicle({
        plateNumber,
        brand,
        color,
        vehicleType: Number(vehicle.vehicleType),
        motorPictureUrl: uploadedMotorUrl,
        orcrDocumentUrl: uploadedOrcrUrl,
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
    } catch (err: any) {
      showAlert(
        "Vehicle Update Failed",
        err?.response?.data?.message || err?.message || "Please try again.",
        "error",
      );
    }
  };

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        <View className="flex-row items-center justify-between px-4 py-2 bg-light-surface">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(auth)/login");
              }
            }}
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
      <View className="flex-1 bg-light-surface px-6 pt-4 pb-12 gap-4">
        <Text className="text-light-muted font-regular text-[13px] mb-2">
          Register the vehicle details and upload motor & OR/CR photos.
        </Text>

        <AppInput
          label="Vehicle Plate Number"
          placeholder="Enter Plate Number"
          value={vehicle.plateNumber}
          onChangeText={(v) => setVehicleField("plateNumber", v)}
        />
        <AppInput
          label="Motor Brand"
          placeholder="e.g. Honda, Yamaha, Kawasaki"
          value={vehicle.brand}
          onChangeText={(v) => setVehicleField("brand", v)}
        />
        <AppInput
          label="Vehicle Color"
          placeholder="e.g. Black, Red, Silver, Blue"
          value={vehicle.color}
          onChangeText={(v) => setVehicleField("color", v)}
        />
        <AppSelect
          label="Vehicle Type"
          placeholder="Pick a Vehicle Type"
          options={VEHICLE_TYPE_OPTIONS}
          value={vehicle.vehicleType.toString()}
          onChange={(v) => setVehicleField("vehicleType", Number(v))}
        />

        {/* Motor Photo Picker Card */}
        <TouchableOpacity
          onPress={handlePickMotorFile}
          activeOpacity={0.85}
          className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted p-4 rounded-card border border-dashed border-light-primary/50 flex-row items-center gap-3"
        >
          <View className="w-10 h-10 rounded-full bg-light-primary/10 items-center justify-center">
            <Camera size={20} color="#D22730" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-light-text dark:text-dark-text">
              Motor Picture
            </Text>
            <Text className="text-[12px] text-light-muted dark:text-dark-muted font-regular">
              {selectedMotorFile ? selectedMotorFile.name : "Tap to upload vehicle photo"}
            </Text>
          </View>
          {selectedMotorFile && <CheckCircle size={20} color="#10B981" />}
        </TouchableOpacity>

        {/* OR/CR Document Picker Card */}
        <TouchableOpacity
          onPress={handlePickOrcrFile}
          activeOpacity={0.85}
          className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted p-4 rounded-card border border-dashed border-light-primary/50 flex-row items-center gap-3"
        >
          <View className="w-10 h-10 rounded-full bg-light-primary/10 items-center justify-center">
            <FileText size={20} color="#D22730" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-light-text dark:text-dark-text">
              OR/CR Document
            </Text>
            <Text className="text-[12px] text-light-muted dark:text-dark-muted font-regular">
              {selectedOrcrFile ? selectedOrcrFile.name : "Tap to upload OR/CR document photo"}
            </Text>
          </View>
          {selectedOrcrFile && <CheckCircle size={20} color="#10B981" />}
        </TouchableOpacity>

        <AppButton
          label="Continue"
          variant="primary"
          size="lg"
          className="mt-6"
          onPress={handleNext}
          loading={isLoading}
          disabled={isLoading}
        />
      </View>

      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        icon={<AlertCircle size={28} color="#F59E0B" />}
      />
    </AuthLayout>
  );
}
