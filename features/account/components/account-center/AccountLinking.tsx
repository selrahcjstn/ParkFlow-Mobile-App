import { useAppTheme } from "@/hooks/useAppTheme";
import { Link2, ChevronRight } from "lucide-react-native";
import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

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
  onRefreshCredentials: () => void;
}

export default function AccountLinking({
  credentials,
}: AccountLinkingProps) {
  const { colors } = useAppTheme();
  const router = useRouter();

  const primaryProviderValue = credentials?.primaryProvider ?? "Microsoft";
  const userEmail = credentials?.email ?? "student.parkflow@university.edu.ph";

  const isMicrosoftPrimary =
    primaryProviderValue === "Microsoft" || primaryProviderValue === "1";

  return (
    <TouchableOpacity
      onPress={() => router.push("/(settings)/emails")}
      className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft mt-5 active:opacity-70 flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3 flex-1 mr-3">
        <View className="w-9 h-9 rounded-button bg-light-danger/10 dark:bg-dark-primary/10 items-center justify-center">
          <Link2 size={18} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="text-light-text dark:text-dark-text font-black text-[14.5px] tracking-tight">
            Linked Emails & Accounts
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[12.5px] mt-0.5" numberOfLines={1}>
            {userEmail}
          </Text>
        </View>
      </View>
      <ChevronRight size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}
