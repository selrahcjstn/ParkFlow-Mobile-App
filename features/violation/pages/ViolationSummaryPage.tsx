import DetailRow from "@/components/layouts/DetailRow";
import AppButton from "@/components/ui/AppButton";
import {
    Body,
    Caption,
    Heading,
    Label,
    Title,
} from "@/components/ui/Typography";
import { HasViolationNotificationDto } from "@/features/violation/types/violation.types";
import {
    AlertTriangle,
    ChevronLeft,
    CreditCard,
    Shield,
    Smartphone,
} from "lucide-react-native";
import { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Types ──
type PaymentMethod = "gcash" | "handson" | "guard" | null;

interface ViolationPaymentCardProps {
  visible: boolean;
  onBack: () => void;
  violation?: HasViolationNotificationDto;
}

// Replaced private InfoRow with the global reusable DetailRow component

// ── Payment Option Button ──
function PaymentOption({
  icon,
  label,
  sublabel,
  selected,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 rounded-2xl border ${
        selected
          ? "bg-light-primary/5 border-light-primary"
          : "bg-light-surface border-light-border"
      }`}
    >
      {/* Icon Badge */}
      <View
        className={`w-11 h-11 rounded-xl items-center justify-center mr-3.5 ${
          selected ? "bg-light-primary/10" : "bg-light-background"
        }`}
      >
        {icon}
      </View>

      {/* Labels */}
      <View className="flex-1">
        <Body
          className={`font-heavy text-[14px] ${
            selected ? "text-light-primary" : "text-light-text"
          }`}
        >
          {label}
        </Body>
        <Caption className="font-book text-[12px] mt-0.5">{sublabel}</Caption>
      </View>

      {/* Radio indicator */}
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
          selected ? "border-light-primary" : "border-light-border"
        }`}
      >
        {selected && (
          <View className="w-2.5 h-2.5 rounded-full bg-light-primary" />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Confirm Modal ──
function ConfirmModal({
  visible,
  method,
  amount,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  method: PaymentMethod;
  amount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const labels: Record<string, string> = {
    gcash: "GCash",
    handson: "Hands-on Payment",
    guard: "Pay to Guard",
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
        <Pressable className="w-full bg-light-surface rounded-3xl px-6 pt-8 pb-6 items-center border border-light-border">
          {/* Icon */}
          <View className="w-20 h-20 rounded-full bg-light-primary/10 items-center justify-center mb-1">
            <View className="w-14 h-14 rounded-full bg-light-primary/15 items-center justify-center">
              <CreditCard size={28} color="#D22730" strokeWidth={2} />
            </View>
          </View>

          <Title className="text-light-text text-center mt-3 text-[18px]">
            Confirm Payment
          </Title>
          <Body className="text-light-muted text-center mt-2 leading-6 px-2 text-[13px]">
            You are about to pay{" "}
            <Text style={{ fontFamily: "AvenirHeavy", color: "#18181B" }}>
              ₱{amount.toFixed(2)}
            </Text>{" "}
            via{" "}
            <Text style={{ fontFamily: "AvenirHeavy", color: "#18181B" }}>
              {method ? labels[method] : ""}
            </Text>
            . Proceed?
          </Body>

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

// ══════════════════════════════════════════════
// ── ViolationPaymentCard ──
// ══════════════════════════════════════════════
export default function ViolationSummaryPage({
  visible,
  onBack,
  violation,
}: ViolationPaymentCardProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (!violation) return null;

  const handleProceed = () => {
    if (!selectedMethod) return;
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);

    // Log the request and response payload matching our TS types
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

    console.log("=== [ViolationPaymentCard] Payment Request ===");
    console.log(JSON.stringify(requestPayload, null, 2));
    console.log("=== [ViolationPaymentCard] Payment Response ===");
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

  const overstayText =
    violation.OverstayHours > 0
      ? `Limit exceeded by ${violation.OverstayHours.toFixed(1)} hours.`
      : "";

  const description = `Violation type: ${violation.ViolationType}. ${overstayText} Please settle the penalty amount.`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onBack}
    >
      <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
        {/* ── Header / Top Bar ── */}
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

          {/* Spacer to balance the back button */}
          <View className="w-10" />
        </View>

        {/* ── Scrollable body ── */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Violation Badge ── */}
          <View className="bg-light-surface rounded-2xl overflow-hidden mb-4 border border-light-border/40">
            {/* Red accent strip at top */}
            <View className="h-1 bg-light-primary" />

            <View className="px-5 pt-4 pb-5">
              {/* Violation tag */}
              <View className="flex-row items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-xl bg-light-danger/10 items-center justify-center">
                  <AlertTriangle size={16} color="#EF4444" strokeWidth={2.5} />
                </View>
                <Caption className="font-heavy uppercase tracking-widest text-[10px] text-light-danger">
                  Violation Notice
                </Caption>
              </View>

              {/* Plate number hero */}
              <View className="bg-light-background rounded-xl px-4 py-3 items-center mb-4">
                <Caption className="font-heavy uppercase tracking-widest text-[10px] mb-1">
                  Plate Number
                </Caption>
                <Title className="text-light-text text-[22px]">
                  {violation.PlateNumber}
                </Title>
              </View>

              {/* Violation type + description */}
              <Heading className="text-light-text font-black text-[15px] mb-1">
                {violation.ViolationType}
              </Heading>
              <Caption className="font-book text-[12px] leading-5 mb-4">
                {description}
              </Caption>

              {/* Info rows using standard DetailRow component */}
              <DetailRow
                label="Reference No."
                value={violation.ReferenceNumber || violation.RefNumber}
              />
              <DetailRow label="Issued Date" value={formattedDate} />
              <DetailRow label="Issued Time" value={formattedTime} />
              {violation.IssuedBy && (
                <DetailRow label="Issued By" value={violation.IssuedBy} />
              )}

              {/* Fine amount */}
              <View className="mt-4 bg-light-primary/5 border border-light-primary/20 rounded-xl px-4 py-3 flex-row items-center justify-between">
                <Caption className="font-heavy text-[13px] text-light-muted">
                  Fine Amount
                </Caption>
                <Title className="text-light-primary text-[22px]">
                  ₱{violation.Amount.toFixed(2)}
                </Title>
              </View>
            </View>
          </View>

          {/* ── Payment Method ── */}
          <View className="mb-5">
            <Label className="text-light-text font-heavy text-[13px] mb-3 uppercase tracking-widest">
              Select Payment Method
            </Label>

            <View className="gap-2.5">
              <PaymentOption
                icon={
                  <Smartphone
                    size={20}
                    color={selectedMethod === "gcash" ? "#D22730" : "#71717A"}
                    strokeWidth={2}
                  />
                }
                label="GCash"
                sublabel="Pay online via GCash e-wallet"
                selected={selectedMethod === "gcash"}
                onPress={() => setSelectedMethod("gcash")}
              />

              <PaymentOption
                icon={
                  <CreditCard
                    size={20}
                    color={selectedMethod === "handson" ? "#D22730" : "#71717A"}
                    strokeWidth={2}
                  />
                }
                label="Hands-on / Actual Payment"
                sublabel="Pay directly at the cashier or office"
                selected={selectedMethod === "handson"}
                onPress={() => setSelectedMethod("handson")}
              />

              <PaymentOption
                icon={
                  <Shield
                    size={20}
                    color={selectedMethod === "guard" ? "#D22730" : "#71717A"}
                    strokeWidth={2}
                  />
                }
                label="Pay to Guard"
                sublabel="Hand payment to the assigned guard"
                selected={selectedMethod === "guard"}
                onPress={() => setSelectedMethod("guard")}
              />
            </View>
          </View>

          {/* ── Proceed Button using reusable AppButton ── */}
          <AppButton
            label="Proceed to Pay"
            variant="primary"
            size="lg"
            disabled={!selectedMethod}
            onPress={handleProceed}
            className="rounded-2xl"
          />

          {/* Disclaimer */}
          <Caption className="text-center font-book text-[11px] text-light-muted mt-3 px-4">
            Payment records are subject to review and confirmation by the
            parking authority.
          </Caption>
        </ScrollView>
      </SafeAreaView>

      {/* ── Confirm Modal ── */}
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
