import AppButton from "@/components/ui/AppButton";
import ConfirmModal from "@/features/violation/components/ConfirmModal";
import PaymentOption from "@/features/violation/components/PaymentOption";
import ViolationDetailCard from "@/features/violation/components/ViolationDetailCard";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { HasViolationNotificationDto } from "@/features/violation/types/violation.types";
import { router } from "expo-router";
import { CheckCircle, ChevronLeft, CreditCard, Smartphone } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PaymentMethod = "gcash" | "card" | null;

interface ViolationSummaryPageProps {
  visible?: boolean;
  onBack?: () => void;
  violation?: HasViolationNotificationDto;
}

export default function ViolationSummaryPage({
  visible,
  onBack,
  violation,
}: ViolationSummaryPageProps) {
  const storeActiveViolation = useViolationStore((s) => s.activeViolation);
  const clearViolation = useViolationStore((s) => s.clearViolation);

  const currentViolation = violation ?? storeActiveViolation;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (!currentViolation) {
    return (
      <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
        {/* Top Header Navigation Bar */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-transparent">
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
          >
            <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            className="text-light-text text-[17px] font-bold text-center flex-1"
          >
            Violation
          </Text>

          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8 pb-16">
          <View className="w-24 h-24 rounded-full bg-light-success/10 items-center justify-center mb-6">
            <View className="w-16 h-16 rounded-full bg-light-success/15 items-center justify-center">
              <CheckCircle size={36} color="#10B981" strokeWidth={2.5} />
            </View>
          </View>

          <Text className="text-light-text font-black text-center text-[20px] mb-2">
            No Active Violations
          </Text>

          <Text className="text-light-muted font-regular text-center leading-6 text-[13px] mb-8">
            Your account is in good standing. There are no pending citations or overstay penalties associated with your registered vehicles.
          </Text>

          <AppButton
            label="Back to Home"
            variant="outline"
            size="md"
            onPress={handleBack}
            className="rounded-2xl px-8"
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleProceed = () => {
    if (!selectedMethod) return;
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);

    const requestPayload = {
      violationId: currentViolation.ReferenceNumber || currentViolation.RefNumber,
      paymentMethod: selectedMethod,
      amountPaid: currentViolation.Amount,
      paidAt: new Date().toISOString(),
    };

    const simulatedResponse = {
      success: true,
      referenceNumber: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      settlementStatus: "Paid",
      message: `Successfully processed simulated payment of ₱${currentViolation.Amount.toFixed(2)} via ${selectedMethod}.`,
    };

    console.log("=== [ViolationSummaryPage] Payment Request ===");
    console.log(JSON.stringify(requestPayload, null, 2));
    console.log("=== [ViolationSummaryPage] Payment Response ===");
    console.log(JSON.stringify(simulatedResponse, null, 2));

    clearViolation();
    handleBack();
  };

  const formattedDate = currentViolation.IssuedDate
    ? new Date(currentViolation.IssuedDate).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const formattedTime = currentViolation.IssuedTime
    ? new Date(currentViolation.IssuedTime).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A";

  const pageContent = (
    <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
      {/* Top Header Navigation Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-transparent">
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
        >
          <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
        </TouchableOpacity>

        <Text
          numberOfLines={1}
          className="text-light-text text-[17px] font-bold text-center flex-1"
        >
          Pay Violation
        </Text>

        <View className="w-10" />
      </View>

      {/* Scrollable Container */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Violation Detail Card Component */}
        <ViolationDetailCard
          violation={currentViolation}
          formattedDate={formattedDate}
          formattedTime={formattedTime}
        />

        {/* Payment Method Selection Section */}
        <View className="mb-6">
          <Text
            className="text-light-text font-black mb-2"
            style={{ fontSize: 18 }}
          >
            Select Payment Method
          </Text>

          <View className="gap-2.5">
            {/* GCash E-wallet Option */}
            <PaymentOption
              icon={
                <Smartphone
                  size={20}
                  color={selectedMethod === "gcash" ? "#10B981" : "#71717A"}
                  strokeWidth={2}
                />
              }
              label="GCash"
              sublabel="Pay online via GCash e-wallet"
              selected={selectedMethod === "gcash"}
              onPress={() => setSelectedMethod("gcash")}
            />

            {/* Credit / Debit Card Option */}
            <PaymentOption
              icon={
                <CreditCard
                  size={20}
                  color={selectedMethod === "card" ? "#10B981" : "#71717A"}
                  strokeWidth={2}
                />
              }
              label="Credit / Debit Card"
              sublabel="Pay online with Visa, Mastercard, or JCB"
              selected={selectedMethod === "card"}
              onPress={() => setSelectedMethod("card")}
            />
          </View>
        </View>

        {/* Proceed Button */}
        <AppButton
          label="Proceed to Pay"
          variant="primary"
          size="lg"
          disabled={!selectedMethod}
          onPress={handleProceed}
          className="rounded-2xl"
        />

        {/* Disclaimer Text */}
        <Text className="text-center font-light text-[11px] text-light-muted mt-4 px-4">
          Payment records are subject to review and confirmation by the
          parking authority.
        </Text>
      </ScrollView>

      {/* Confirmation Modal Component */}
      <ConfirmModal
        visible={confirmVisible}
        method={selectedMethod}
        amount={currentViolation.Amount}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleConfirm}
      />
    </SafeAreaView>
  );

  if (visible) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleBack}
      >
        {pageContent}
      </Modal>
    );
  }

  return pageContent;
}
