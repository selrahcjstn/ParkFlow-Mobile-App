import AppButton from "@/components/ui/AppButton";
import { CreditCard } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type PaymentMethod = "gcash" | "card" | null;

interface ConfirmModalProps {
  visible: boolean;
  method: PaymentMethod;
  amount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  visible,
  method,
  amount,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const labels: Record<string, string> = {
    gcash: "GCash",
    card: "Credit / Debit Card",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-8"
        onPress={onCancel}
      >
        <Pressable className="w-full bg-light-surface rounded-3xl px-6 pt-8 pb-6 items-center">
          <View className="w-20 h-20 rounded-full bg-light-primary/10 items-center justify-center mb-1">
            <View className="w-14 h-14 rounded-full bg-light-primary/15 items-center justify-center">
              <CreditCard size={28} color="#D22730" strokeWidth={2} />
            </View>
          </View>

          <Text className="text-light-text font-black text-center mt-3 text-[18px]">
            Confirm Payment
          </Text>
          <Text className="text-light-muted font-regular text-center mt-2 leading-6 px-2 text-[13px]">
            You are about to pay{" "}
            <Text className="font-bold" style={{ color: "#18181B" }}>
              ₱{amount.toFixed(2)}
            </Text>{" "}
            via{" "}
            <Text className="font-bold" style={{ color: "#18181B" }}>
              {method ? labels[method] : ""}
            </Text>
            . Proceed?
          </Text>

          <View className="flex-row gap-3 mt-6 w-full">
            <AppButton
              label="Cancel"
              variant="outline"
              size="md"
              onPress={onCancel}
              className="flex-1 rounded-2xl py-3.5"
            />
            <AppButton
              label="Confirm"
              variant="primary"
              size="md"
              onPress={onConfirm}
              className="flex-1 rounded-2xl py-3.5"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
