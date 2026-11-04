import React from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  FileText,
  UploadCloud,
  X,
} from "lucide-react-native";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import * as DocumentPicker from "expo-document-picker";
import { validateFileSize } from "@/utils/fileValidation";
import { appDialog } from "@/services/app-dialog";
import { useAppTheme } from "@/hooks/useAppTheme";

interface NewVehicleForm {
  plateNumber: string;
  brand: string;
  vehicleType: string;
}

interface EditVehicleSheetProps {
  visible: boolean;
  form: NewVehicleForm;
  setForm: React.Dispatch<React.SetStateAction<NewVehicleForm>>;
  existingOrcrUrl?: string;
  existingMotorUrl?: string;
  orcrFile: DocumentPicker.DocumentPickerAsset | null;
  setOrcrFile: React.Dispatch<
    React.SetStateAction<DocumentPicker.DocumentPickerAsset | null>
  >;
  motorFile: DocumentPicker.DocumentPickerAsset | null;
  setMotorFile: React.Dispatch<
    React.SetStateAction<DocumentPicker.DocumentPickerAsset | null>
  >;
  typePickerOpen: boolean;
  setTypePickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formError: string | null;
  isSaving: boolean;
  onSave: () => void;
  onClose: () => void;
  slideAnim: any; // Animated.Value
}

export function EditVehicleSheet({
  visible,
  form,
  setForm,
  existingOrcrUrl,
  existingMotorUrl,
  orcrFile,
  setOrcrFile,
  motorFile,
  setMotorFile,
  typePickerOpen,
  setTypePickerOpen,
  formError,
  isSaving,
  onSave,
  onClose,
  slideAnim,
}: EditVehicleSheetProps) {
  const { colors } = useAppTheme();
  const selectedTypeLabel =
    VEHICLE_TYPE_OPTIONS.find((t) => t.value === form.vehicleType)?.label ??
    null;

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
        appDialog.show(
          "File Too Large",
          validation.message || "File size cannot exceed 5MB.", undefined, { variant: "error" }
        );
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
        appDialog.show(
          "File Too Large",
          validation.message || "File size cannot exceed 5MB.", undefined, { variant: "error" }
        );
        return;
      }

      setMotorFile(asset);
    } catch (e) {
      console.error("Error picking motor picture:", e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={onClose}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={{ transform: [{ translateY: slideAnim }] }}
              className="bg-light-surface dark:bg-dark-surface rounded-t-[28px] border border-light-border dark:border-dark-border max-h-[90%]"
            >
              <View className="w-10 h-1 rounded-full bg-light-border dark:bg-dark-border self-center mt-4" />

              <View className="flex-row items-center justify-between px-6 pt-4 pb-5">
                <View>
                  <Text className="text-light-text dark:text-dark-text font-bold text-[20px]">
                    Edit Vehicle
                  </Text>
                  <Text className="text-light-muted dark:text-dark-muted font-book text-[13px] mt-0.5">
                    Update your vehicle details, type, or documents
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 rounded-button bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border items-center justify-center"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={15} color={colors.muted} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <View className="h-px bg-light-border dark:bg-dark-border" />

              <ScrollView
                className="px-6 pt-5"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Plate Number */}
                {form.vehicleType !== "1" && (
                  <View className="mb-4">
                    <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                      Plate Number
                    </Text>
                    <TextInput
                      className="bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-xl px-4 py-3.5 font-bold text-[18px] text-light-text dark:text-dark-text tracking-widest"
                      placeholder="e.g. ABC 1234"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="characters"
                      value={form.plateNumber}
                      onChangeText={(v) =>
                        setForm((p) => ({ ...p, plateNumber: v }))
                      }
                    />
                  </View>
                )}

                {/* Brand / Model */}
                <View className="mb-4">
                  <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                    Brand / Model
                  </Text>
                  <TextInput
                    className="bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-xl px-4 py-3.5 font-book text-[14px] text-light-text dark:text-dark-text"
                    placeholder="e.g. Toyota Vios"
                    placeholderTextColor={colors.muted}
                    value={form.brand}
                    onChangeText={(v) => setForm((p) => ({ ...p, brand: v }))}
                  />
                </View>

                {/* Vehicle Type */}
                <View className="mb-4">
                  <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                    Vehicle Type
                  </Text>

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
                      color={colors.muted}
                      strokeWidth={2.2}
                      style={{
                        transform: [
                          { rotate: typePickerOpen ? "180deg" : "0deg" },
                        ],
                      }}
                    />
                  </TouchableOpacity>

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
                                ...(type.value === "1" ? { plateNumber: "" } : {}),
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

                {/* OR/CR Document Update / Replace */}
                {form.vehicleType !== "1" && (
                  <View className="mb-4">
                    <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-1">
                      OR/CR Document (PDF / Photo)
                    </Text>
                    <Text className="text-[11px] text-light-muted dark:text-dark-muted mb-2">
                      Annual Renewal: Vehicle OR/CR expires annually. Upload your updated registration document each year to maintain verified campus access.
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handlePickOrcr}
                      className={`border border-dashed rounded-xl p-3.5 flex-row items-center justify-between ${
                        orcrFile
                          ? "bg-light-primary/5 dark:bg-dark-primary/10 border-light-primary dark:border-dark-primary"
                          : existingOrcrUrl
                          ? "bg-light-success/5 dark:bg-dark-success/10 border-light-success/40 dark:border-dark-success/40"
                          : "bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                      }`}
                    >
                      <View className="flex-row items-center gap-3 flex-1 mr-2">
                        {orcrFile ? (
                          <CheckCircle2 size={20} color={colors.success} />
                        ) : existingOrcrUrl ? (
                          <FileText size={20} color={colors.success} />
                        ) : (
                          <FileText size={20} color={colors.muted} />
                        )}
                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className={`font-book text-[13px] ${
                              orcrFile
                                ? "text-light-text dark:text-dark-text font-bold"
                                : existingOrcrUrl
                                ? "text-light-text dark:text-dark-text font-medium"
                                : "text-light-muted dark:text-dark-muted"
                            }`}
                          >
                            {orcrFile
                              ? orcrFile.name
                              : existingOrcrUrl
                              ? "Current OR/CR on file (Tap to replace)"
                              : "Tap to upload OR/CR file..."}
                          </Text>
                          {orcrFile?.size && (
                            <Text className="text-[10px] text-light-muted dark:text-dark-muted">
                              New file: {(orcrFile.size / (1024 * 1024)).toFixed(2)} MB
                            </Text>
                          )}
                        </View>
                      </View>
                      {orcrFile ? (
                        <TouchableOpacity
                          onPress={() => setOrcrFile(null)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <X size={16} color={colors.danger} />
                        </TouchableOpacity>
                      ) : (
                        <UploadCloud size={18} color={colors.muted} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Proof of Vehicle Photo Update / Replace */}
                <View className="mb-5">
                  <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                    {form.vehicleType === "1" ? "Clear Photo of Entire E-Bike" : "Proof of Vehicle (Photo showing Plate)"}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handlePickMotor}
                    className={`border border-dashed rounded-xl p-3.5 flex-row items-center justify-between ${
                      motorFile
                        ? "bg-light-primary/5 dark:bg-dark-primary/10 border-light-primary dark:border-dark-primary"
                        : existingMotorUrl
                        ? "bg-light-success/5 dark:bg-dark-success/10 border-light-success/40 dark:border-dark-success/40"
                        : "bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border"
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1 mr-2">
                      {motorFile ? (
                        <CheckCircle2 size={20} color={colors.success} />
                      ) : existingMotorUrl ? (
                        <Camera size={20} color={colors.success} />
                      ) : (
                        <Camera size={20} color={colors.muted} />
                      )}
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className={`font-book text-[13px] ${
                            motorFile
                              ? "text-light-text dark:text-dark-text font-bold"
                              : existingMotorUrl
                              ? "text-light-text dark:text-dark-text font-medium"
                              : "text-light-muted dark:text-dark-muted"
                          }`}
                        >
                          {motorFile
                            ? motorFile.name
                            : existingMotorUrl
                            ? "Current Photo on file (Tap to replace)"
                            : "Tap to upload vehicle photo..."}
                        </Text>
                        {motorFile?.size && (
                          <Text className="text-[10px] text-light-muted dark:text-dark-muted">
                            New file: {(motorFile.size / (1024 * 1024)).toFixed(2)} MB
                          </Text>
                        )}
                      </View>
                    </View>
                    {motorFile ? (
                      <TouchableOpacity
                        onPress={() => setMotorFile(null)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <X size={16} color={colors.danger} />
                      </TouchableOpacity>
                    ) : (
                      <UploadCloud size={18} color={colors.muted} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Error message */}
                {formError && (
                  <View className="bg-light-danger/8 dark:bg-dark-danger/8 border border-light-danger/20 dark:border-dark-danger/20 rounded-xl px-4 py-3 mb-4">
                    <Text className="text-light-text dark:text-dark-danger font-bold text-[13px]">
                      {formError}
                    </Text>
                  </View>
                )}

                {/* Save Changes Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onSave}
                  disabled={isSaving}
                  className="bg-light-primary dark:bg-dark-primary rounded-xl py-4 items-center justify-center mb-10 flex-row gap-2"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text className="text-light-textInverse dark:text-dark-background font-bold text-[15px]">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
