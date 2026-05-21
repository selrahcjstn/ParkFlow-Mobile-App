import { SystemMessageCard } from "@/components/shared";
import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import { X } from "lucide-react-native";
import React from "react";
import { ScrollView, View } from "react-native";
import { SubScreenLayout } from "../../../components/layout";

type QrScanErrorCardProps = {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
};

export default function QrScanErrorCard({
  message,
  onRetry,
  onBack,
}: QrScanErrorCardProps) {
  const handleBackToHome = onBack ?? (() => {});

  return (
    <SubScreenLayout title="Scan Result" onBack={handleBackToHome}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          paddingTop: 10,
        }}
      >
        <View
          className="bg-light-surface rounded-3xl p-6"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 15,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          {/* Error Header */}
          <View className="items-center mt-2 mb-7">
            <View
              className="items-center justify-center w-20 h-20 border-4 border-light-danger rounded-full mb-4"
              style={{ shadowColor: "transparent", elevation: 0 }}
            >
              <View className="w-16 h-16 rounded-full items-center justify-center bg-light-danger">
                <X size={32} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>

            <Title
              className="text-light-text font-black text-center mb-1"
              style={{ fontSize: 26, lineHeight: 32 }}
            >
              Entry Denied
            </Title>

            <Body
              className="text-light-danger font-heavy uppercase tracking-widest text-center"
              style={{ fontSize: 12 }}
            >
              Scan Failed
            </Body>
          </View>

          {/* Unified SystemMessageCard for the Error reason */}
          <SystemMessageCard
            title="Scan Failure Reason"
            message={message}
            variant="danger"
            actionRequired="Ensure the QR code is valid, active, and belongs to a vehicle cleared for entry."
          />

          {/* Bottom Action Buttons */}
          <View className="gap-3 mt-6">
            {onRetry && (
              <AppButton
                label="Try Again"
                variant="primary"
                size="lg"
                onPress={onRetry}
              />
            )}
            <AppButton
              label="Back to Home"
              variant="outline"
              size="lg"
              onPress={handleBackToHome}
            />
          </View>
        </View>
      </ScrollView>
    </SubScreenLayout>
  );
}
