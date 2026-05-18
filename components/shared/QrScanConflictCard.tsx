import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import { router } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { SubScreenLayout } from "../layout";

type QrScanConflictCardProps = {
  message?: string;
  plateNumber?: string;
  entryTime?: string;
  onResolve?: () => void;
};

export default function QrScanConflictCard({
  message = "This QR code is already linked to an active parking session.",
  plateNumber,
  entryTime,
  onResolve,
}: QrScanConflictCardProps) {
  const handleBackToHome = () => router.replace("../(tabs)/home");

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
          <View className="items-center mt-2 mb-7">
            <View
              className="items-center justify-center w-20 h-20 border-4 border-light-accent rounded-full mb-4"
              style={{ shadowColor: "transparent", elevation: 0 }}
            >
              <View className="w-16 h-16 rounded-full items-center justify-center bg-light-accent">
                <AlertTriangle size={28} color="#FFFFFF" strokeWidth={2} />
              </View>
            </View>

            <Title
              className="text-light-text font-black text-center"
              style={{ fontSize: 24 }}
            >
              Conflict Detected
            </Title>

            <Body
              className="text-light-accent font-heavy uppercase tracking-widest text-center"
              style={{ fontSize: 12 }}
            >
              Already Parked
            </Body>
          </View>

          <Body
            className="text-light-muted font-heavy tracking-wider uppercase mb-1"
            style={{ fontSize: 11 }}
          >
            Details
          </Body>

          <View>
            <View className="flex-row justify-between items-center py-3.5 border-b border-light-border/40">
              <Body
                className="text-light-muted font-book mr-4"
                style={{ fontSize: 13 }}
              >
                Reason
              </Body>
              <Body
                className="flex-1 font-heavy text-light-text text-right"
                style={{ fontSize: 14 }}
              >
                {message}
              </Body>
            </View>

            {plateNumber && (
              <View className="flex-row justify-between items-center py-3.5 border-b border-light-border/40">
                <Body
                  className="text-light-muted font-book mr-4"
                  style={{ fontSize: 13 }}
                >
                  Plate
                </Body>
                <Body
                  className="flex-1 font-heavy text-light-text text-right"
                  style={{ fontSize: 14 }}
                >
                  {plateNumber}
                </Body>
              </View>
            )}

            {entryTime && (
              <View className="flex-row justify-between items-center py-3.5">
                <Body
                  className="text-light-muted font-book mr-4"
                  style={{ fontSize: 13 }}
                >
                  Entry Time
                </Body>
                <Body
                  className="flex-1 font-heavy text-light-text text-right"
                  style={{ fontSize: 14 }}
                >
                  {entryTime}
                </Body>
              </View>
            )}
          </View>

          <View className="mt-8">
            {onResolve && (
              <AppButton
                label="Resolve Conflict"
                variant="primary"
                size="lg"
                onPress={onResolve}
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
