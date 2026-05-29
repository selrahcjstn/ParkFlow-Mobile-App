import React, { forwardRef } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChevronDown, Plus } from "lucide-react-native";
import { AppBottomSheet } from "@/components/shared";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";

interface NewVehicleForm {
  plateNumber: string;
  brand: string;
  vehicleType: string;
}

interface AddVehicleSheetProps {
  form: NewVehicleForm;
  setForm: React.Dispatch<React.SetStateAction<NewVehicleForm>>;
  typePickerOpen: boolean;
  setTypePickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formError: string | null;
  isSubmitting: boolean;
  onAdd: () => void;
  onDismiss: () => void;
}

export const AddVehicleSheet = forwardRef<BottomSheetModal, AddVehicleSheetProps>(
  function AddVehicleSheet(
    {
      form,
      setForm,
      typePickerOpen,
      setTypePickerOpen,
      formError,
      isSubmitting,
      onAdd,
      onDismiss,
    },
    ref,
  ) {
    const selectedTypeLabel =
      VEHICLE_TYPE_OPTIONS.find((t) => t.value === form.vehicleType)?.label ?? null;

    return (
      <AppBottomSheet
        ref={ref}
        title="Add Vehicle"
        subtitle="Register a new vehicle to your account"
        snapPoints={["60%", "85%"]}
        onDismiss={onDismiss}
      >
        {/* Plate Number */}
        <View className="mb-4">
          <Text className="text-[11px] font-heavy text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
            Plate Number
          </Text>
          <TextInput
            className="bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-xl px-4 py-3.5 font-black text-[18px] text-light-text dark:text-dark-text tracking-widest"
            placeholder="e.g. ABC 1234"
            placeholderTextColor="#A1A1AA"
            autoCapitalize="characters"
            value={form.plateNumber}
            onChangeText={(v) => setForm((p) => ({ ...p, plateNumber: v }))}
          />
        </View>

        {/* Brand / Model */}
        <View className="mb-4">
          <Text className="text-[11px] font-heavy text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
            Brand / Model
          </Text>
          <TextInput
            className="bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-xl px-4 py-3.5 font-book text-[14px] text-light-text dark:text-dark-text"
            placeholder="e.g. Toyota Vios"
            placeholderTextColor="#A1A1AA"
            value={form.brand}
            onChangeText={(v) => setForm((p) => ({ ...p, brand: v }))}
          />
        </View>

        {/* Vehicle Type */}
        <View className="mb-5">
          <Text className="text-[11px] font-heavy text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
            Vehicle Type
          </Text>

          {/* Type selector trigger */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setTypePickerOpen((o) => !o)}
            className={`bg-light-background dark:bg-dark-background border rounded-xl px-4 py-3.5 flex-row items-center justify-between ${
              typePickerOpen
                ? "border-light-primary/40 dark:border-dark-primary/40"
                : "border-light-border dark:border-dark-border"
            }`}
          >
            <Text
              className={`font-book text-[14px] ${
                selectedTypeLabel
                  ? "text-light-text dark:text-dark-text"
                  : "text-light-muted dark:text-dark-muted"
              }`}
            >
              {selectedTypeLabel ?? "Select type..."}
            </Text>
            <ChevronDown
              size={16}
              color="#71717A"
              strokeWidth={2.2}
              style={{
                transform: [{ rotate: typePickerOpen ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>

          {/* Inline options */}
          {typePickerOpen && (
            <View className="mt-1.5 bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-xl overflow-hidden">
              {VEHICLE_TYPE_OPTIONS.map((type, idx) => (
                <React.Fragment key={type.value}>
                  <TouchableOpacity
                    activeOpacity={0.65}
                    onPress={() => {
                      setForm((p) => ({
                        ...p,
                        vehicleType: type.value,
                      }));
                      setTypePickerOpen(false);
                    }}
                    className={`flex-row items-center justify-between px-4 py-3.5 ${
                      form.vehicleType === type.value
                        ? "bg-light-primary/5 dark:bg-dark-primary/5"
                        : ""
                    }`}
                  >
                    <Text
                      className={`font-book text-[14px] ${
                        form.vehicleType === type.value
                          ? "text-light-primary dark:text-dark-primary font-heavy"
                          : "text-light-text dark:text-dark-text"
                      }`}
                    >
                      {type.label}
                    </Text>
                    {form.vehicleType === type.value && (
                      <View className="w-2 h-2 rounded-full bg-light-primary dark:bg-dark-primary" />
                    )}
                  </TouchableOpacity>
                  {idx < VEHICLE_TYPE_OPTIONS.length - 1 && (
                    <View className="h-px bg-light-border/50 dark:bg-dark-border/50 mx-4" />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* Error message */}
        {formError && (
          <View className="bg-light-danger/8 dark:bg-dark-danger/8 border border-light-danger/20 dark:border-dark-danger/20 rounded-xl px-4 py-3 mb-4">
            <Text className="text-light-danger dark:text-dark-danger font-heavy text-[13px]">
              {formError}
            </Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAdd}
          disabled={isSubmitting}
          className="bg-light-primary dark:bg-dark-primary rounded-xl py-4 items-center justify-center mb-10 flex-row gap-2"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Plus size={17} color="#FFF" strokeWidth={2.5} />
              <Text className="text-white font-heavy text-[15px]">
                Register Vehicle
              </Text>
            </>
          )}
        </TouchableOpacity>
      </AppBottomSheet>
    );
  },
);
