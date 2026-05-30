import { AppButton } from "@/components/ui";
import { Link2 } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Text, View, ActivityIndicator } from "react-native";

export type LinkedIdentity = {
  provider: string;
  email: string;
  providerId: string;
  isVerified: boolean;
};

export type UserCredentialsResponse = {
  email: string;
  primaryProvider: string;
  externalProviderId: string;
  linkedIdentities: LinkedIdentity[];
};

interface AccountLinkingProps {
  credentials: UserCredentialsResponse | null;
  onShowSuccessAlert: (title: string, message: string) => void;
  onTriggerSetPassword: () => void;
}

export default function AccountLinking({
  credentials,
  onShowSuccessAlert,
  onTriggerSetPassword,
}: AccountLinkingProps) {
  const primaryProviderValue = credentials?.primaryProvider ?? "Microsoft";
  const userEmail = credentials?.email ?? "student.parkflow@university.edu.ph";

  const isMicrosoftPrimary =
    primaryProviderValue === "Microsoft" || primaryProviderValue === "1";
  const isManualPrimary =
    primaryProviderValue === "Manual" || primaryProviderValue === "0";

  const [microsoftLinked, setMicrosoftLinked] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isMicrosoftPrimary) {
      setMicrosoftLinked(true);
    } else {
      const hasMsLink = credentials?.linkedIdentities.some(
        (link) => link.provider === "Microsoft"
      );
      setMicrosoftLinked(!!hasMsLink);
    }
  }, [credentials, isMicrosoftPrimary]);

  const handleToggleLink = async () => {
    setActionLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    if (microsoftLinked) {
      setMicrosoftLinked(false);
      onShowSuccessAlert(
        "Account Unlinked",
        "Your Microsoft Institutional account has been disconnected."
      );
    } else {
      setMicrosoftLinked(true);
      onShowSuccessAlert(
        "Account Linked",
        "Your Microsoft Institutional account has been successfully connected."
      );
    }
    
    setActionLoading(false);
  };

  return (
    <View className="bg-light-surface rounded-card border border-light-border/40 p-5 shadow-soft mt-5">
      <View className="flex-row items-center gap-3 mb-5">
        <View className="w-9 h-9 rounded-button bg-light-accent/10 items-center justify-center">
          <Link2 size={18} color="#D22730" strokeWidth={2.2} />
        </View>
        <Text className="text-light-text font-black text-[15px] tracking-tight">
          Linked Accounts
        </Text>
      </View>

      <View className="gap-4">
        <View className="flex-row items-center justify-between border-b border-light-border/30 pb-4">
          <View>
            <Text className="text-light-text font-heavy text-[13.5px]">
              Email & Password
            </Text>
            <Text className="text-light-muted font-regular text-[12px] mt-0.5">
              {isManualPrimary ? userEmail : "No password configured"}
            </Text>
          </View>
          {isManualPrimary ? (
            <View className="bg-light-primary/10 px-2.5 py-0.5 rounded-md">
              <Text className="text-light-primary font-heavy text-[9px] uppercase tracking-wider">
                Primary
              </Text>
            </View>
          ) : (
            <AppButton
              label="Set Password"
              variant="outline"
              size="sm"
              uppercase={false}
              className="py-1 px-3.5"
              onPress={onTriggerSetPassword}
            />
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-light-text font-heavy text-[13.5px]">
              Microsoft Account
            </Text>
            <Text className="text-light-muted font-regular text-[12px] mt-0.5">
              {microsoftLinked || isMicrosoftPrimary ? userEmail : "Not linked"}
            </Text>
          </View>
          {isMicrosoftPrimary ? (
            <View className="bg-light-primary/10 px-2.5 py-0.5 rounded-md">
              <Text className="text-light-primary font-heavy text-[9px] uppercase tracking-wider">
                Primary
              </Text>
            </View>
          ) : actionLoading ? (
            <ActivityIndicator size="small" color="#D22730" />
          ) : (
            <AppButton
              label={microsoftLinked ? "Disconnect" : "Connect"}
              variant={microsoftLinked ? "outline" : "primary"}
              size="sm"
              uppercase={false}
              className="py-1 px-3.5"
              onPress={handleToggleLink}
            />
          )}
        </View>
      </View>
    </View>
  );
}
