import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { router } from "expo-router";
import { AlertTriangle, X } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { SubScreenLayout } from "../layout";

type QrScanErrorCardProps = {
  message: string;
  onRetry?: () => void;
};

function ErrorDetailRow({
  label,
  value,
  isLast = false,
  valueColor = "text-light-text",
}: {
  label: string;
  value: string;
  isLast?: boolean;
  valueColor?: string;
}) {
  return (
    <View
      className={`flex-row justify-between items-start py-4 ${!isLast ? "border-b border-light-border/40" : ""}`}
    >
      <Body
        className="text-light-muted font-book mr-4 mt-0.5"
        style={{ fontSize: 13, minWidth: 60 }}
      >
        {label}
      </Body>
      <Body
        className={`flex-1 font-heavy ${valueColor} text-right`}
        style={{ fontSize: 14, lineHeight: 20 }}
      >
        {value}
      </Body>
    </View>
  );
}

export default function QrScanErrorCard({
  message,
  onRetry,
}: QrScanErrorCardProps) {
  const handleBackToHome = () => {
    router.replace("../(tabs)/home");
  };

  return (
    <SubScreenLayout title="Scan Result" onBack={handleBackToHome}>
      {/* ── Main Content Scroll ── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          paddingTop: 10,
        }}
      >
        {/* ── The Receipt Card ── */}
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
          {/* 1. Error Header (Sharp non-blurry red border effect) */}
          <View className="items-center mt-2 mb-7">
            <View
              className="items-center justify-center w-20 h-20 border-4 border-light-danger rounded-full mb-4"
              style={{ shadowColor: "transparent", elevation: 0 }}
            >
              <View className="w-16 h-16 rounded-full items-center justify-center bg-light-danger">
                <X size={32} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>

            {/* Massive Focal Point Title */}
            <Title
              className="text-light-text font-black text-center mb-1"
              style={{ fontSize: 26, lineHeight: 32 }}
            >
              Entry Denied
            </Title>

            {/* Clear Status Subtitle */}
            <Body
              className="text-light-danger font-heavy uppercase tracking-widest text-center"
              style={{ fontSize: 12 }}
            >
              Scan Failed
            </Body>
          </View>

          {/* 2. Details Section Header */}
          <Body
            className="text-light-muted font-heavy tracking-wider uppercase mb-1"
            style={{ fontSize: 11 }}
          >
            Error Details
          </Body>

          {/* 3. Clean Data Rows */}
          <View>
            <ErrorDetailRow
              label="Reason"
              value={message}
              valueColor="text-light-danger"
              isLast={true}
            />
          </View>

          {/* 4. Premium Professional Note Block */}
          <View className="mt-4 bg-light-background rounded-2xl p-4 border border-light-border/60 flex-row items-start">
            {/* Soft Icon Wrapper */}
            <View className="w-8 h-8 rounded-full bg-light-surface border border-light-border/50 items-center justify-center mr-3 mt-0.5">
              <AlertTriangle
                size={15}
                color={lightColors.muted}
                strokeWidth={2}
              />
            </View>

            <View className="flex-1">
              <Body
                className="text-light-text font-heavy uppercase tracking-widest mb-1"
                style={{ fontSize: 10 }}
              >
                Important Notice
              </Body>
              <Body
                className="text-light-muted font-book"
                style={{ fontSize: 13, lineHeight: 18 }}
              >
                Ensure the QR code is valid and not currently linked to an
                active parking session.
              </Body>
            </View>
          </View>

          {/* 5. Bottom Action Buttons */}
          <View className="gap-3 mt-8">
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
              onPress={() => router.replace("../(tabs)/home")}
            />
          </View>
        </View>
      </ScrollView>
    </SubScreenLayout>
  );
}
