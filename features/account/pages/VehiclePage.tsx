import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { vehicleService } from "@/features/user/services/vehicle.service";
import { userService } from "@/features/user/services/user.service";
import { VehicleResponse } from "@/features/user/types/vehicle.types";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { queryClient } from "@/services/queryClient";
import { appDialog } from "@/services/app-dialog";
import { useActionConfirmation } from "@/hooks/useActionConfirmation";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as DocumentPicker from "expo-document-picker";
import { validateFileSize } from "@/utils/fileValidation";
import { useNavigation, useFocusEffect } from "expo-router";
import { useIsFocused } from "expo-router";
import { Plus, Clock } from "lucide-react-native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  VehicleItem,
  AddVehicleSheet,
  EditVehicleSheet,
  VehicleActionSheet,
} from "../components/vehicle";

interface NewVehicleForm {
  plateNumber: string;
  brand: string;
  vehicleType: string;
}

export default function VehiclePage() {
  const confirmAction = useActionConfirmation();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();
  const { vehicles, isLoading, loadVehicle, setVehicles, setVehicle } = useVehicleStore();

  const menuSheetRef = useRef<BottomSheetModal>(null);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleResponse | null>(null);

  const addSheetRef = useRef<BottomSheetModal>(null);
  const [form, setForm] = useState<NewVehicleForm>({
    plateNumber: "",
    brand: "",
    vehicleType: "",
  });
  const [orcrFile, setOrcrFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [motorFile, setMotorFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Vehicle state
  const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editForm, setEditForm] = useState<NewVehicleForm>({
    plateNumber: "",
    brand: "",
    vehicleType: "",
  });
  const [editOrcrFile, setEditOrcrFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [editMotorFile, setEditMotorFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [editTypePickerOpen, setEditTypePickerOpen] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState<"error" | "warning" | "success" | "info">("error");

  const editSlideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    loadVehicle();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        menuSheetRef.current?.dismiss();
        addSheetRef.current?.dismiss();
      };
    }, [])
  );

  useEffect(() => {
    if (editVisible) {
      Animated.timing(editSlideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else {
      editSlideAnim.setValue(500);
    }
  }, [editVisible]);

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      navigation.setParams({ hasScrolled: yOffset > 0 } as any);
    }
  };

  const handleMenuDismiss = useCallback(() => {
    if (!isFocused) return;
    setTimeout(() => {
      if (isFocused) {
        setSelectedVehicle(null);
      }
    }, 200);
  }, [isFocused]);

  const handleAddDismiss = () => {
    setFormError(null);
  };

  const handleOpenMenu = (vehicle: VehicleResponse) => {
    setSelectedVehicle(vehicle);
    menuSheetRef.current?.present();
  };

  const closeMenu = () => {
    menuSheetRef.current?.dismiss();
  };

  const hasOngoingSession = vehicles.some((v) => v.status === "Parked");

  const handleMakePrimary = async () => {
    if (!selectedVehicle) return;
    if (hasOngoingSession) {
      closeMenu();
      setAlertVariant("warning");
      setAlertTitle("Action Locked");
      setAlertMessage("You cannot change your primary vehicle while you have an ongoing parking session.");
      setAlertVisible(true);
      return;
    }
    const vehicle = selectedVehicle;
    closeMenu();
    confirmAction("Change primary vehicle?", `Plate number: ${vehicle.plateNumber}\nVehicle: ${vehicle.brand}\n\nUse this vehicle as your primary parking vehicle?`, async () => {
      if (useVehicleStore.getState().vehicles.some(v => v.status === "Parked")) {
        throw new Error("You cannot change your primary vehicle while you have an ongoing parking session.");
      }
      try {
        const res = await vehicleService.setPrimaryVehicle(vehicle.id);
        if (res?.isSuccess) {
          queryClient.invalidateQueries({ queryKey: ["vehicles"] });
          await loadVehicle();
        } else {
          appDialog.show("Action Failed", res?.message || "Failed to set vehicle as primary.", undefined, { variant: "error" });
        }
      } catch (err: any) {
        console.error(err);
        const errorMsg = err?.response?.data?.message || err?.message || "An unexpected error occurred while setting primary vehicle.";
        appDialog.show("Action Failed", errorMsg, undefined, { variant: "error" });
      }
    }, { confirmLabel: "Set primary" });
  };

  const handleRemoveVehicle = async () => {
    if (!selectedVehicle) return;
    if (hasOngoingSession || selectedVehicle.status === "Parked") {
      closeMenu();
      setAlertVariant("warning");
      setAlertTitle("Action Locked");
      setAlertMessage("You cannot delete a vehicle while you have an ongoing parking session.");
      setAlertVisible(true);
      return;
    }
    const vehicle = selectedVehicle;
    closeMenu();
    confirmAction("Remove vehicle?", `Plate number: ${vehicle.plateNumber}\nVehicle: ${vehicle.brand}\n\nThis vehicle will be removed from your account. To use it again, you will need to register it again.`, async () => {
      if (useVehicleStore.getState().vehicles.some(v => v.status === "Parked")) {
        throw new Error("You cannot delete a vehicle while you have an ongoing parking session.");
      }
      try {
        const res = await vehicleService.deleteVehicle(vehicle.id);
        if (res?.isSuccess) {
          queryClient.invalidateQueries({ queryKey: ["vehicles"] });
          await loadVehicle();
        } else {
          appDialog.show("Delete Failed", res?.message || "Cannot delete this vehicle.", undefined, { variant: "error" });
        }
      } catch (err: any) {
        console.error(err);
        const errorMsg = err?.response?.data?.message || err?.message || "An unexpected error occurred while deleting the vehicle.";
        appDialog.show("Delete Failed", errorMsg, undefined, { variant: "error" });
      }
    }, { confirmLabel: "Remove vehicle", destructive: true });
  };

  const closeEditSheet = () => {
    Animated.timing(editSlideAnim, {
      toValue: 500,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setEditVisible(false);
      setEditingVehicle(null);
      setEditOrcrFile(null);
      setEditMotorFile(null);
      setEditFormError(null);
    });
  };

  const handleSaveEdit = async () => {
    if (!editingVehicle) return;

    const plate = editForm.plateNumber.trim();
    const brand = editForm.brand.trim();

    if (!plate) return setEditFormError("Plate number is required.");
    if (!brand) return setEditFormError("Brand / model is required.");
    if (!editForm.vehicleType && editForm.vehicleType !== "0") return setEditFormError("Please select a vehicle type.");

    if (editOrcrFile) {
      const orcrVal = validateFileSize(editOrcrFile, 5);
      if (!orcrVal.isValid) return setEditFormError(orcrVal.message || "OR/CR file size cannot exceed 5MB.");
    }

    if (editMotorFile) {
      const motorVal = validateFileSize(editMotorFile, 5);
      if (!motorVal.isValid) return setEditFormError(motorVal.message || "Vehicle photo size cannot exceed 5MB.");
    }

    const vehicle = editingVehicle;
    confirmAction("Submit vehicle changes?", [
      `Current plate: ${vehicle.plateNumber}`,
      `Updated plate: ${plate.toUpperCase()}`,
      `Brand / model: ${brand}`,
      `Vehicle type: ${getVehicleTypeLabel(Number(editForm.vehicleType))}`,
      ...(editOrcrFile ? [`New OR/CR: ${editOrcrFile.name}`] : []),
      ...(editMotorFile ? [`New vehicle photo: ${editMotorFile.name}`] : []),
      "", "Your vehicle details will be sent for administrator review.",
    ].join("\n"), async () => {
      if (useVehicleStore.getState().vehicles.some(v => v.status === "Parked")) {
        throw new Error("You cannot edit vehicle details while you have an ongoing parking session.");
      }
      setEditFormError(null);
      setIsSavingEdit(true);

      try {
        let orcrDocumentUrl: string | undefined = undefined;
        if (editOrcrFile) {
          const orcrRes = await userService.uploadOrcrDocument(editOrcrFile.uri, editOrcrFile.name, "");
          if (!orcrRes?.isSuccess || !orcrRes.data?.secureUrl) {
            setEditFormError(orcrRes?.message || "Failed to upload new OR/CR document.");
            setIsSavingEdit(false);
            return;
          }
          orcrDocumentUrl = orcrRes.data.secureUrl;
        }

        let vehiclePictureUrl: string | undefined = undefined;
        if (editMotorFile) {
          const motorRes = await userService.uploadMotorPicture(editMotorFile.uri, editMotorFile.name, "");
          if (!motorRes?.isSuccess || !motorRes.data?.secureUrl) {
            setEditFormError(motorRes?.message || "Failed to upload new vehicle photo.");
            setIsSavingEdit(false);
            return;
          }
          vehiclePictureUrl = motorRes.data.secureUrl;
        }

        const payload = {
          plateNumber: plate.toUpperCase(),
          brand,
          vehicleType: parseInt(editForm.vehicleType),
          ...(orcrDocumentUrl ? { orcrDocumentUrl } : {}),
          ...(vehiclePictureUrl ? { vehiclePictureUrl } : {}),
        };

        const res = await vehicleService.updateVehicle(vehicle.id, payload);

        if (res?.isSuccess) {
          queryClient.invalidateQueries({ queryKey: ["vehicles"] });
          await loadVehicle();
          setIsSavingEdit(false);
          closeEditSheet();
          appDialog.show("Under Review", "Your vehicle details have been updated and are now under review by an administrator.");
        } else {
          setEditFormError(res?.message || "Failed to update vehicle.");
          setIsSavingEdit(false);
        }
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || "An unexpected error occurred while updating vehicle.";
        setEditFormError(errorMsg);
        setIsSavingEdit(false);
      }
    }, { confirmLabel: "Submit changes" });
  };

  const openAddSheet = () => {
    if (hasOngoingSession) {
      setAlertVariant("warning");
      setAlertTitle("Action Locked");
      setAlertMessage("You cannot register or add a vehicle while you have an ongoing parking session. Please exit the parking facility first.");
      setAlertVisible(true);
      return;
    }
    setForm({ plateNumber: "", brand: "", vehicleType: "" });
    setOrcrFile(null);
    setMotorFile(null);
    setFormError(null);
    setTypePickerOpen(false);
    addSheetRef.current?.present();
  };

  const closeAddSheet = () => {
    addSheetRef.current?.dismiss();
  };

  const handleAddVehicle = async () => {
    const plate = form.plateNumber.trim();
    const brand = form.brand.trim();

    if (!plate) return setFormError("Plate number is required.");
    if (!brand) return setFormError("Brand / model is required.");
    if (!form.vehicleType) return setFormError("Please select a vehicle type.");
    if (!orcrFile) return setFormError("Please upload OR/CR document.");
    if (!motorFile) return setFormError("Please upload proof of vehicle photo.");

    const orcrVal = validateFileSize(orcrFile, 5);
    if (!orcrVal.isValid) return setFormError(orcrVal.message || "OR/CR file size cannot exceed 5MB.");

    const motorVal = validateFileSize(motorFile, 5);
    if (!motorVal.isValid) return setFormError(motorVal.message || "Vehicle photo size cannot exceed 5MB.");

    if (!user?.id) return setFormError("Session expired. Please log in again.");

    confirmAction("Register this vehicle?", [
      `Plate number: ${plate.toUpperCase()}`,
      `Brand / model: ${brand}`,
      `Vehicle type: ${getVehicleTypeLabel(Number(form.vehicleType))}`,
      `OR/CR: ${orcrFile.name}`, `Vehicle photo: ${motorFile.name}`,
      "", "Your vehicle will be submitted for administrator review.",
    ].join("\n"), async () => {
      if (useVehicleStore.getState().vehicles.some(v => v.status === "Parked")) {
        throw new Error("You cannot register or add a vehicle while you have an ongoing parking session.");
      }
      setFormError(null);
      setIsSubmitting(true);

      try {
        let orcrDocumentUrl = "";
        if (orcrFile) {
          const orcrRes = await userService.uploadOrcrDocument(orcrFile.uri, orcrFile.name, "");
          if (!orcrRes?.isSuccess || !orcrRes.data?.secureUrl) {
            setFormError(orcrRes?.message || "Failed to upload OR/CR document.");
            setIsSubmitting(false);
            return;
          }
          orcrDocumentUrl = orcrRes.data.secureUrl;
        }

        let vehiclePictureUrl = "";
        if (motorFile) {
          const motorRes = await userService.uploadMotorPicture(motorFile.uri, motorFile.name, "");
          if (!motorRes?.isSuccess || !motorRes.data?.secureUrl) {
            setFormError(motorRes?.message || "Failed to upload vehicle photo.");
            setIsSubmitting(false);
            return;
          }
          vehiclePictureUrl = motorRes.data.secureUrl;
        }

        const payload = {
          ownerId: user.id,
          plateNumber: plate.toUpperCase(),
          brand,
          vehicleType: parseInt(form.vehicleType),
          orcrDocumentUrl,
          vehiclePictureUrl,
        };

        const res = await vehicleService.createVehicle(payload);

        if (res?.isSuccess) {
          const newVehicleId = res.data;
          if (vehicles.length === 0 && newVehicleId) {
            try {
              await vehicleService.setPrimaryVehicle(newVehicleId);
            } catch {}
          }
          queryClient.invalidateQueries({ queryKey: ["vehicles"] });
          await loadVehicle();
          setIsSubmitting(false);
          setOrcrFile(null);
          setMotorFile(null);
          closeAddSheet();
        } else {
          setFormError(res?.message || "Failed to add vehicle.");
          setIsSubmitting(false);
        }
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || "An unexpected error occurred while adding vehicle.";
        setFormError(errorMsg);
        setIsSubmitting(false);
      }
    }, { confirmLabel: "Register vehicle" });
  };

  const renderVehicleItem = ({ item }: { item: VehicleResponse }) => (
    <VehicleItem item={item} onPressMenu={() => handleOpenMenu(item)} />
  );

  return (
    <ContentWrapper noPaddingY>
      {isLoading && vehicles.length === 0 ? (
        <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
          <Text className="text-light-muted dark:text-dark-muted font-book text-sm">Loading vehicles...</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicleItem}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
          ListHeaderComponent={
            hasOngoingSession ? (
              <View className="mb-4 px-4 py-3.5 rounded-2xl bg-light-warning/10 dark:bg-dark-warning/20 border border-light-warning/30 dark:border-dark-warning/30 flex-row items-center gap-3">
                <Clock size={18} color="#F59E0B" strokeWidth={2.2} />
                <Text className="text-light-text dark:text-dark-warning text-xs font-semibold flex-1 leading-relaxed">
                  Active Parking Session: Vehicle edits, removals, and additions are locked until your vehicle exits the parking facility.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            user?.corVerificationStatus === 1 ? (
              <View className="py-14 items-center justify-center px-6 border border-dashed border-light-warning/30 dark:border-dark-warning/20 rounded-card mt-2 bg-light-warning/5 dark:bg-dark-warning/5">
                <View className="w-12 h-12 rounded-full bg-light-warning/10 dark:bg-dark-warning/20 items-center justify-center mb-3">
                  <Clock size={24} color="#F59E0B" strokeWidth={2.2} />
                </View>
                <Text className="font-bold text-sm text-light-text dark:text-dark-warning mb-1 text-center">
                  Vehicle Verification Pending
                </Text>
                <Text className="font-regular text-xs text-light-muted dark:text-dark-muted text-center max-w-[260px] leading-relaxed">
                  Your submitted vehicle is currently being reviewed by campus administrators.
                </Text>
              </View>
            ) : (
              <View className="py-14 items-center justify-center px-6 border border-dashed border-light-border dark:border-dark-border rounded-card mt-2">
                <Text className="font-bold text-sm text-light-text dark:text-dark-text mb-1">
                  No Vehicles Found
                </Text>
                <Text className="font-regular text-xs text-light-muted dark:text-dark-muted text-center">
                  Add your first vehicle to get started
                </Text>
              </View>
            )
          }
        />
      )}

      <TouchableOpacity
        activeOpacity={hasOngoingSession ? 0.9 : 0.85}
        onPress={openAddSheet}
        className={`absolute bottom-6 right-6 h-14 px-5 rounded-full bg-light-primary dark:bg-dark-primary flex-row items-center gap-2 border border-light-primary/20 dark:border-dark-primary/20 ${
          hasOngoingSession ? "opacity-60" : ""
        }`}
      >
        <Plus size={20} color="#FFF" strokeWidth={2.5} />
        <Text className="text-light-textInverse dark:text-dark-background font-bold text-sm">Add Vehicle</Text>
      </TouchableOpacity>

      <VehicleActionSheet
        ref={menuSheetRef}
        selectedVehicle={selectedVehicle}
        onMakePrimary={handleMakePrimary}
        onEditClick={() => {
          const vehicleToEdit = selectedVehicle;
          closeMenu();
          if (hasOngoingSession || vehicleToEdit?.status === "Parked") {
            setAlertVariant("warning");
            setAlertTitle("Action Locked");
            setAlertMessage("You cannot edit vehicle details while you have an ongoing parking session.");
            setAlertVisible(true);
            return;
          }
          if (vehicleToEdit) {
            setEditingVehicle(vehicleToEdit);
            setEditForm({
              plateNumber: vehicleToEdit.plateNumber,
              brand: vehicleToEdit.brand,
              vehicleType: vehicleToEdit.vehicleType !== undefined ? vehicleToEdit.vehicleType.toString() : "0",
            });
            setEditOrcrFile(null);
            setEditMotorFile(null);
            setEditFormError(null);
            setEditTypePickerOpen(false);
            setEditVisible(true);
          }
        }}
        onRemove={handleRemoveVehicle}
        onDismiss={handleMenuDismiss}
      />

      <AddVehicleSheet
        ref={addSheetRef}
        form={form}
        setForm={setForm}
        orcrFile={orcrFile}
        setOrcrFile={setOrcrFile}
        motorFile={motorFile}
        setMotorFile={setMotorFile}
        typePickerOpen={typePickerOpen}
        setTypePickerOpen={setTypePickerOpen}
        formError={formError}
        isSubmitting={isSubmitting}
        onAdd={handleAddVehicle}
        onDismiss={handleAddDismiss}
      />

      <EditVehicleSheet
        visible={editVisible}
        form={editForm}
        setForm={setEditForm}
        existingOrcrUrl={editingVehicle?.orcrDocumentUrl}
        existingMotorUrl={editingVehicle?.vehiclePictureUrl}
        orcrFile={editOrcrFile}
        setOrcrFile={setEditOrcrFile}
        motorFile={editMotorFile}
        setMotorFile={setEditMotorFile}
        typePickerOpen={editTypePickerOpen}
        setTypePickerOpen={setEditTypePickerOpen}
        formError={editFormError}
        isSaving={isSavingEdit}
        onSave={handleSaveEdit}
        onClose={closeEditSheet}
        slideAnim={editSlideAnim}
      />

      <AlertModal
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertTitle}
        message={alertMessage}
        variant={alertVariant}
      />
    </ContentWrapper>
  );
}
