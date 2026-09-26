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
import { ChevronDown, X } from "lucide-react-native";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";

interface NewVehicleForm {
  plateNumber: string;
  brand: string;
  vehicleType: string;
}

interface EditVehicleSheetProps {
  visible: boolean;
  form: NewVehicleForm;
  setForm: React.Dispatch<React.SetStateAction<NewVehicleForm>>;
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
  typePickerOpen,
  setTypePickerOpen,
  formError,
  isSaving,
  onSave,
  onClose,
  slideAnim,
}: EditVehicleSheetProps) {
  const selectedTypeLabel =
    VEHICLE_TYPE_OPTIONS.find((t) => t.value === form.vehicleType)?.label ?? null;

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
              className="bg-light-surface dark:bg-dark-surface rounded-t-[28px] border border-light-border dark:border-dark-border"
            >
              <View className="w-10 h-1 rounded-full bg-light-border dark:bg-dark-border self-center mt-4" />

              <View className="flex-row items-center justify-between px-6 pt-4 pb-5">
                <View>
                  <Text className="text-light-text dark:text-dark-text font-bold text-[20px]">
                    Edit Vehicle
                  </Text>
                  <Text className="text-light-muted dark:text-dark-muted font-book text-[13px] mt-0.5">
                    Update your vehicle registration details
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 rounded-button bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border items-center justify-center"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={15} color="#71717A" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <View className="h-px bg-light-border dark:bg-dark-border" />

              <ScrollView
                className="px-6 pt-5"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
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
                    onChangeText={(v) =>
                      setForm((p) => ({ ...p, plateNumber: v }))
                    }
                  />
                </View>

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

                <View className="mb-5">
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
                        form.vehicleType
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

                {formError && (
                  <View className="bg-light-danger/8 dark:bg-dark-danger/8 border border-light-danger/20 dark:border-dark-danger/20 rounded-xl px-4 py-3 mb-4">
                    <Text className="text-light-danger dark:text-dark-danger font-bold text-[13px]">
                      {formError}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onSave}
                  disabled={isSaving}
                  className="bg-light-primary dark:bg-dark-primary rounded-xl py-4 items-center justify-center mb-10 flex-row gap-2"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text className="text-white font-bold text-[15px]">
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
