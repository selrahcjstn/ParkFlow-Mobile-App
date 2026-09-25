import AppButton from "@/components/ui/AppButton";
import ViolationDetailCard from "@/features/violation/components/ViolationDetailCard";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { HasViolationNotificationDto } from "@/features/violation/types/violation.types";
import { router } from "expo-router";
import { CheckCircle, ChevronLeft } from "lucide-react-native";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const handleBack = () => {
    clearViolation();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const isExplicitViolation = Boolean(violation);
  const showEmptyState =
    !currentViolation ||
    (!isExplicitViolation && currentViolation.IsViolation === false);

  if (showEmptyState) {
    return (
      <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
        <View className="flex-row items-center justify-between py-3 bg-transparent">
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
          >
            <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            className="text-light-text text-[17px] font-heavy text-center flex-1"
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
            Your account is in good standing. There are no pending citations or
            overstay penalties associated with your registered vehicles.
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

  const isPaid =
    currentViolation.IsPaid === true ||
    currentViolation.SettlementStatus === "Settled" ||
    currentViolation.SettlementStatus === "Paid";

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
          className="text-light-text text-[17px] font-heavy text-center flex-1"
        >
          {isPaid ? "Citation Record" : "Violation Notice"}
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ViolationDetailCard
          violation={currentViolation}
          formattedDate={formattedDate}
          formattedTime={formattedTime}
        />

        <AppButton
          label={isPaid ? "Close Record" : "Acknowledge & Close"}
          variant="primary"
          size="lg"
          onPress={handleBack}
          className="rounded-2xl mt-4"
        />

        <Text className="text-center font-light text-[12px] text-light-muted mt-4 px-4 leading-5">
          {isPaid
            ? "This citation has been settled and verified in your account records."
            : "Please settle your citation fee directly with an on-duty parking guard at the exit gate."}
        </Text>
      </ScrollView>
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
