import { ContentWrapper } from "@/components/layouts";
import { userService } from "@/features/user/services/user.service";
import type { UserCredentialsResponse } from "@/features/user/types/user.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import { Mail, ChevronRight, AlertTriangle } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  InteractionManager,
  ActivityIndicator,
} from "react-native";

export default function EmailsPage() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  const [credentials, setCredentials] = useState<UserCredentialsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCredentials = useCallback(async () => {
    try {
      const res = await userService.getUserCredentials();
      if (res?.isSuccess && res.data) {
        setCredentials(res.data);
      }
    } catch (e) {
      console.error("Failed to load user credentials:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const task = InteractionManager.runAfterInteractions(() => {
        void loadCredentials();
      });
      return () => task.cancel();
    }, [loadCredentials])
  );

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        navigation.setParams({ hasScrolled: scrolled } as any);
      }
    }
  };

  const primaryProviderValue = credentials?.primaryProvider ?? "Microsoft";
  const userEmail = credentials?.email ?? "student.parkflow@university.edu.ph";

  const isMicrosoftPrimary =
    primaryProviderValue === "Microsoft" || primaryProviderValue === "1";
  const isManualPrimary =
    primaryProviderValue === "Manual" || primaryProviderValue === "0";

  const manualLink = credentials?.linkedIdentities.find(
    (link) =>
      link.provider === "Manual" ||
      link.provider === "0" ||
      link.provider === "Local" ||
      link.provider === "Email"
  );
  const isManualConfigured = isManualPrimary || !!manualLink;
  const manualEmail = isManualPrimary ? userEmail : (manualLink?.email ?? "");
  const isManualVerified = isManualPrimary ? true : (manualLink?.isVerified ?? false);

  const msLink = credentials?.linkedIdentities.find(
    (link) => link.provider === "Microsoft" || link.provider === "1"
  );
  const isMsConfigured = isMicrosoftPrimary || !!msLink;
  const msEmail = isMicrosoftPrimary ? userEmail : (msLink?.email ?? "");
  const isMsVerified = isMicrosoftPrimary ? true : (msLink?.isVerified ?? false);

  const emailItems = [];

  if (isManualConfigured) {
    emailItems.push({
      provider: "manual",
      email: manualEmail,
      label: "Direct Access",
      isPrimary: isManualPrimary,
      isVerified: isManualVerified,
    });
  }

  if (isMsConfigured) {
    emailItems.push({
      provider: "microsoft",
      email: msEmail,
      label: "Microsoft Account",
      isPrimary: isMicrosoftPrimary,
      isVerified: isMsVerified,
    });
  }

  return (
    <ContentWrapper noPaddingY>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        >
          {/* Header Description Title and Subtitle - NOT inside a card */}
          <View className="px-1 mb-6">
            <Text className="text-light-text dark:text-dark-text font-black text-[22px] tracking-tight">
              Emails
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] mt-1.5">
              Manage your linked email addresses, verification priorities, and credential access.
            </Text>
          </View>

          {/* Linked Emails List */}
          <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border shadow-soft overflow-hidden">
            {emailItems.length === 0 ? (
              <View className="p-6 items-center">
                <AlertTriangle size={24} color={colors.warning} />
                <Text className="text-light-text dark:text-dark-text font-heavy mt-2 text-[13px]">
                  No Emails Configured
                </Text>
              </View>
            ) : (
              emailItems.map((item, index) => {
                const showBorder = index < emailItems.length - 1;
                return (
                  <TouchableOpacity
                    key={item.provider}
                    onPress={() =>
                      router.push({
                        pathname: "/(settings)/email-details",
                        params: { provider: item.provider },
                      })
                    }
                    className={`flex-row items-center justify-between p-4 active:bg-light-border/20 dark:active:bg-dark-border/20 ${
                      showBorder ? "border-b border-light-border/40 dark:border-dark-border/40" : ""
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-1.5 flex-wrap">
                        <Text className="text-light-text dark:text-dark-text font-heavy text-[13.5px]">
                          {item.label}
                        </Text>
                        {item.isPrimary ? (
                          <View className="bg-light-primary/10 dark:bg-dark-primary/10 px-2 py-0.5 rounded-md">
                            <Text className="text-light-primary dark:text-dark-primary font-heavy text-[10px]">
                              Primary
                            </Text>
                          </View>
                        ) : !item.isVerified ? (
                          <View className="bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                            <Text className="text-amber-600 dark:text-amber-500 font-heavy text-[10px]">
                              Unverified
                            </Text>
                          </View>
                        ) : (
                          <View className="bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <Text className="text-emerald-600 dark:text-emerald-400 font-heavy text-[10px]">
                              Linked
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px]" numberOfLines={1}>
                        {item.email}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.muted} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Add Provider Hint */}
          {!isManualConfigured && (
            <TouchableOpacity
              onPress={() => router.push("/(settings)/set-password")}
              className="mt-4 p-4 border border-dashed border-light-border dark:border-dark-border rounded-card items-center active:opacity-60"
            >
              <Text className="text-light-primary dark:text-dark-primary font-heavy text-[13px]">
                + Link Email & Password Account
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </ContentWrapper>
  );
}
