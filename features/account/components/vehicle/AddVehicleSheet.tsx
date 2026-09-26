import React, { forwardRef } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChevronDown, Plus, FileText, Camera, UploadCloud, CheckCircle2, X } from "lucide-react-native";
import { AppBottomSheet } from "@/components/shared";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import * as DocumentPicker from "expo-document-picker";
import { validateFileSize } from "@/utils/fileValidation";

interface NewVehicleForm {
  plateNumber: string;
  brand: string;
  vehicleType: string;
}

interface AddVehicleSheetProps {
  form: NewVehicleForm;
  setForm: React.Dispatch<React.SetStateAction<NewVehicleForm>>;
  orcrFile: DocumentPicker.DocumentPickerAsset | null;
  setOrcrFile: React.Dispatch<React.SetStateAction<DocumentPicker.DocumentPickerAsset | null>>;
  motorFile: DocumentPicker.DocumentPickerAsset | null;
  setMotorFile: React.Dispatch<React.SetStateAction<DocumentPicker.DocumentPickerAsset | null>>;
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
      orcrFile,
      setOrcrFile,
      motorFile,
      setMotorFile,
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

    const handlePickOrcr = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const asset = result.assets?.[0];
        if (!asset) return;

        const validation = validateFileSize(asset, 5);
        if (!validation.isValid) {
          Alert.alert("File Too Large", validation.message || "File size cannot exceed 5MB.");
          return;
        }

        setOrcrFile(asset);
      } catch (e) {
        console.error("Error picking OR/CR document:", e);
      }
    };

    const handlePickMotor = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["image/*"],
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const asset = result.assets?.[0];
        if (!asset) return;

        const validation = validateFileSize(asset, 5);
        if (!validation.isValid) {
          Alert.alert("File Too Large", validation.message || "File size cannot exceed 5MB.");
          return;
        }

        setMotorFile(asset);
      } catch (e) {
        console.error("Error picking motor picture:", e);
      }
    };

    return (
      <AppBottomSheet
        ref={ref}
        title="Add Vehicle"
        subtitle="Register a new vehicle to your account"
        snapPoints={["75%", "92%"]}
        onDismiss={onDismiss}
      >
        {/* Plate Number */}
        <View className="mb-4">
          <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
            Plate Number
          </Text>
          <TextInput
            className="bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-xl px-4 py-3.5 font-bold text-[18px] text-light-text dark:text-dark-text tracking-widest"
            placeholder="e.g. ABC 1234"
            placeholderTextColor="#A1A1AA"
            autoCapitalize="characters"
            value={form.plateNumber}
            onChangeText={(v) => setForm((p) => ({ ...p, plateNumber: v }))}
          />
        </View>

        {/* Brand / Model */}
        <View className="mb-4">
          <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
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
          <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
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
                          ? "text-light-primary dark:text-dark-primary font-bold"
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

        {/* OR/CR Document */}
        <View className="mb-4">
          <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
            OR/CR Document (PDF / Photo) *
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePickOrcr}
            className={`border border-dashed rounded-xl p-3.5 flex-row items-center justify-between ${
              orcrFile
                ? "bg-light-primary/5 dark:bg-dark-primary/10 border-light-primary dark:border-dark-primary"
                : "bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
            }`}
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              {orcrFile ? (
                <CheckCircle2 size={20} color="#10B981" />
              ) : (
                <FileText size={20} color="#71717A" />
              )}
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className={`font-book text-[13px] ${
                    orcrFile ? "text-light-text dark:text-dark-text font-bold" : "text-light-muted dark:text-dark-muted"
                  }`}
                >
                  {orcrFile ? orcrFile.name : "Tap to upload OR/CR file..."}
                </Text>
                {orcrFile?.size && (
                  <Text className="text-[10px] text-light-muted dark:text-dark-muted">
                    {(orcrFile.size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                )}
              </View>
            </View>
            {orcrFile ? (
              <TouchableOpacity onPress={() => setOrcrFile(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            ) : (
              <UploadCloud size={18} color="#71717A" />
            )}
          </TouchableOpacity>
        </View>

        {/* Proof of Vehicle Photo */}
        <View className="mb-5">
          <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
            Proof of Vehicle (Photo showing Plate) *
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePickMotor}
            className={`border border-dashed rounded-xl p-3.5 flex-row items-center justify-between ${
              motorFile
                ? "bg-light-primary/5 dark:bg-dark-primary/10 border-light-primary dark:border-dark-primary"
                : "bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
            }`}
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              {motorFile ? (
                <CheckCircle2 size={20} color="#10B981" />
              ) : (
                <Camera size={20} color="#71717A" />
              )}
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className={`font-book text-[13px] ${
                    motorFile ? "text-light-text dark:text-dark-text font-bold" : "text-light-muted dark:text-dark-muted"
                  }`}
                >
                  {motorFile ? motorFile.name : "Tap to upload vehicle photo..."}
                </Text>
                {motorFile?.size && (
                  <Text className="text-[10px] text-light-muted dark:text-dark-muted">
                    {(motorFile.size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                )}
              </View>
            </View>
            {motorFile ? (
              <TouchableOpacity onPress={() => setMotorFile(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            ) : (
              <UploadCloud size={18} color="#71717A" />
            )}
          </TouchableOpacity>
        </View>

        {/* Error message */}
        {formError && (
          <View className="bg-light-danger/8 dark:bg-dark-danger/8 border border-light-danger/20 dark:border-dark-danger/20 rounded-xl px-4 py-3 mb-4">
            <Text className="text-light-danger dark:text-dark-danger font-bold text-[13px]">
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
              <Text className="text-white font-bold text-[15px]">
                Register Vehicle
              </Text>
            </>
          )}
        </TouchableOpacity>
      </AppBottomSheet>
    );
  },
);

