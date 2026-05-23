import AppButton from "@/components/ui/AppButton";
import { Caption, Title } from "@/components/ui/Typography";
import ConfirmModal from "@/features/violation/components/ConfirmModal";
import PaymentOption from "@/features/violation/components/PaymentOption";
import ViolationDetailCard from "@/features/violation/components/ViolationDetailCard";
import { HasViolationNotificationDto } from "@/features/violation/types/violation.types";
import { ChevronLeft, CreditCard, Smartphone } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PaymentMethod = "gcash" | "card" | null;

interface ViolationSummaryPageProps {
  visible: boolean;
  onBack: () => void;
  violation?: HasViolationNotificationDto;
}

export default function ViolationSummaryPage({
  visible,
  onBack,
  violation,
}: ViolationSummaryPageProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (!violation) return null;

  const handleProceed = () => {
    if (!selectedMethod) return;
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);

    const requestPayload = {
      violationId: violation.ReferenceNumber || violation.RefNumber,
      paymentMethod: selectedMethod,
      amountPaid: violation.Amount,
      paidAt: new Date().toISOString(),
    };

    const simulatedResponse = {
      success: true,
      referenceNumber: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      settlementStatus: "Paid",
      message: `Successfully processed simulated payment of ₱${violation.Amount.toFixed(2)} via ${selectedMethod}.`,
    };

    console.log("=== [ViolationSummaryPage] Payment Request ===");
    console.log(JSON.stringify(requestPayload, null, 2));
    console.log("=== [ViolationSummaryPage] Payment Response ===");
    console.log(JSON.stringify(simulatedResponse, null, 2));

    onBack();
  };

  const formattedDate = violation.IssuedDate
    ? new Date(violation.IssuedDate).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const formattedTime = violation.IssuedTime
    ? new Date(violation.IssuedTime).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onBack}
    >
      <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
        {/* Top Header Navigation Bar */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-transparent">
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
          >
            <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
          </TouchableOpacity>

          <Title
            numberOfLines={1}
            className="text-light-text text-[17px] font-heavy text-center flex-1"
          >
            Pay Violation
          </Title>

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
            violation={violation}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
          />

          {/* Payment Method Selection Section */}
          <View className="mb-6">
            <Title
              className="text-light-text font-black mb-2"
              style={{ fontSize: 18 }}
            >
              Select Payment Method
            </Title>

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
          <Caption className="text-center font-book text-[11px] text-light-muted mt-4 px-4">
            Payment records are subject to review and confirmation by the
            parking authority.
          </Caption>
        </ScrollView>
      </SafeAreaView>

      {/* Confirmation Modal Component */}
      <ConfirmModal
        visible={confirmVisible}
        method={selectedMethod}
        amount={violation.Amount}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleConfirm}
      />
    </Modal>
  );
}
