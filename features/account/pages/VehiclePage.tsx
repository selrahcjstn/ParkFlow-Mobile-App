import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { vehicleService } from "@/features/user/services/vehicle.service";
import { VehicleResponse } from "@/features/user/types/vehicle.types";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useNavigation, useFocusEffect } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Plus } from "lucide-react-native";
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
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editForm, setEditForm] = useState<NewVehicleForm>({
    plateNumber: "",
    brand: "",
    vehicleType: "",
  });
  const [editTypePickerOpen, setEditTypePickerOpen] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

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

  const handleMakePrimary = async () => {
    if (!selectedVehicle) return;
    try {
      const res = await vehicleService.setPrimaryVehicle(selectedVehicle.id);
      if (res?.isSuccess) {
        await loadVehicle();
      } else {
        setAlertTitle("Action Failed");
        setAlertMessage(res?.message || "Failed to set vehicle as primary.");
        setAlertVisible(true);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.response?.data?.message || err?.message || "An unexpected error occurred while setting primary vehicle.";
      setAlertTitle("Action Failed");
      setAlertMessage(errorMsg);
      setAlertVisible(true);
    }
    closeMenu();
  };

  const handleRemoveVehicle = async () => {
    if (!selectedVehicle) return;
    try {
      const res = await vehicleService.deleteVehicle(selectedVehicle.id);
      if (res?.isSuccess) {
        await loadVehicle();
      } else {
        setAlertTitle("Delete Failed");
        setAlertMessage(res?.message || "Cannot delete this vehicle.");
        setAlertVisible(true);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.response?.data?.message || err?.message || "An unexpected error occurred while deleting the vehicle.";
      setAlertTitle("Delete Failed");
      setAlertMessage(errorMsg);
      setAlertVisible(true);
    }
    closeMenu();
  };

  const closeEditSheet = () => {
    Animated.timing(editSlideAnim, {
      toValue: 500,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setEditVisible(false));
  };

  const handleSaveEdit = async () => {
    if (!selectedVehicle) return;

    const plate = editForm.plateNumber.trim();
    const brand = editForm.brand.trim();

    if (!plate) return setEditFormError("Plate number is required.");
    if (!brand) return setEditFormError("Brand / model is required.");
    if (!editForm.vehicleType) return setEditFormError("Please select a vehicle type.");

    setEditFormError(null);
    setIsSavingEdit(true);

    try {
      const payload = {
        plateNumber: plate.toUpperCase(),
        brand,
        vehicleType: parseInt(editForm.vehicleType),
      };

      const res = await vehicleService.updateVehicle(selectedVehicle.id, payload);

      if (res?.isSuccess) {
        await loadVehicle();
        setIsSavingEdit(false);
        closeEditSheet();
      } else {
        setEditFormError(res?.message || "Failed to update vehicle.");
        setIsSavingEdit(false);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "An unexpected error occurred while updating vehicle.";
      setEditFormError(errorMsg);
      setIsSavingEdit(false);
    }
  };

  const openAddSheet = () => {
    setForm({ plateNumber: "", brand: "", vehicleType: "" });
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
    if (!user?.id) return setFormError("Session expired. Please log in again.");

    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ownerId: user.id,
        plateNumber: plate.toUpperCase(),
        brand,
        vehicleType: parseInt(form.vehicleType),
      };

      const res = await vehicleService.createVehicle(payload);

      if (res?.isSuccess) {
        const newVehicleId = res.data;
        if (vehicles.length === 0 && newVehicleId) {
          try {
            await vehicleService.setPrimaryVehicle(newVehicleId);
          } catch {}
        }
        await loadVehicle();
        setIsSubmitting(false);
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
  };

  const renderVehicleItem = ({ item }: { item: VehicleResponse }) => (
    <VehicleItem item={item} onPressMenu={() => handleOpenMenu(item)} />
  );

  return (
    <ContentWrapper noPaddingY>
      {isLoading && vehicles.length === 0 ? (
        <View className="flex-1 items-center justify-center">
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
          ListEmptyComponent={
            <View className="py-14 items-center justify-center px-6 border border-dashed border-light-border dark:border-dark-border rounded-card mt-2">
              <Text className="font-heavy text-sm text-light-text dark:text-dark-text mb-1">
                No Vehicles Found
              </Text>
              <Text className="font-regular text-xs text-light-muted dark:text-dark-muted text-center">
                Add your first vehicle to get started
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openAddSheet}
        className="absolute bottom-6 right-6 h-14 px-5 rounded-full bg-light-primary dark:bg-dark-primary flex-row items-center gap-2 border border-light-primary/20 dark:border-dark-primary/20"
      >
        <Plus size={20} color="#FFF" strokeWidth={2.5} />
        <Text className="text-white font-heavy text-sm">Add Vehicle</Text>
      </TouchableOpacity>

      <VehicleActionSheet
        ref={menuSheetRef}
        selectedVehicle={selectedVehicle}
        onMakePrimary={handleMakePrimary}
        onEditClick={() => {
          const vehicleToEdit = selectedVehicle;
          closeMenu();
          if (vehicleToEdit) {
            setEditForm({
              plateNumber: vehicleToEdit.plateNumber,
              brand: vehicleToEdit.brand,
              vehicleType: vehicleToEdit.vehicleType.toString(),
            });
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
        variant="error"
      />
    </ContentWrapper>
  );
}
