import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { authService } from "@/features/auth/services/auth.service";
import { userService } from "@/features/user/services/user.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { queryClient } from "@/services/queryClient";
import type { UserCredentialsResponse } from "@/features/user/types/user.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import * as AuthSession from "expo-auth-session";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { jwtDecode } from "jwt-decode";
import { AlertTriangle, ChevronRight } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    InteractionManager,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SvgXml } from "react-native-svg";

const microsoftSvg = `<?xml version="1.0" encoding="utf-8"?>
<svg width="800px" height="800px" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="17" y="17" width="10" height="10" fill="#FEBA08"/>
<rect x="5" y="17" width="10" height="10" fill="#05A6F0"/>
<rect x="17" y="5" width="10" height="10" fill="#80BC06"/>
<rect x="5" y="5" width="10" height="10" fill="#F25325"/>
</svg>`;

WebBrowser.maybeCompleteAuthSession();

const MS_CLIENT_ID = process.env.EXPO_PUBLIC_MS_CLIENT_ID || "7075e648-9e9f-4263-b8d8-109ad880696b";
const MS_TENANT_ID = process.env.EXPO_PUBLIC_MS_TENANT_ID || "cceb61f2-e867-476f-8597-b4cf22555bc4";
const redirectUri = AuthSession.makeRedirectUri({
  scheme: "parkflow",
  path: "redirect",
});
console.log("🔑 [auth] Microsoft Link Redirect URI:", redirectUri);

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
};

export default function EmailsPage() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  const [credentials, setCredentials] =
    useState<UserCredentialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [msLoading, setMsLoading] = useState(false);

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "success" as "error" | "warning" | "info" | "success",
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: MS_CLIENT_ID,
      scopes: ["openid", "profile", "email", "User.Read"],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

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
    }, [loadCredentials]),
  );

  useEffect(() => {
    if (response?.type === "success" && "params" in response) {
      const code = response.params?.code;
      if (code) {
        void handleMicrosoftLinkSuccess(code);
      } else {
        setMsLoading(false);
      }
      return;
    }

    if (response?.type === "error" || response?.type === "cancel") {
      setMsLoading(false);
    }
  }, [response]);

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

  const showAlert = (
    title: string,
    message: string,
    variant: "error" | "warning" | "info" | "success" = "error",
  ) => {
    setModal({
      visible: true,
      title,
      message,
      variant,
    });
  };

  const handleMicrosoftLinkSuccess = async (authCode: string) => {
    try {
      setMsLoading(true);

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: MS_CLIENT_ID,
          code: authCode,
          redirectUri,
          extraParams: {
            code_verifier: request?.codeVerifier ?? "",
          },
        },
        discovery,
      );

      const idToken = tokenResponse.idToken;

      if (!idToken) {
        showAlert("Link Failed", "Missing identity token.", "error");
        return;
      }

      const decoded = jwtDecode<{
        sub?: string;
        email?: string;
        name?: string;
        given_name?: string;
        family_name?: string;
      }>(idToken);

      const payload = {
        externalProviderId: decoded.sub ?? "",
        email: decoded.email ?? "",
        firstName: decoded.given_name ?? "",
        lastName: decoded.family_name ?? "",
        displayName: decoded.name ?? "",
      };

      if (!payload.externalProviderId || !payload.email) {
        showAlert("Link Failed", "Missing Microsoft account details.", "error");
        return;
      }

      const res = await authService.linkMicrosoft(payload);
      if (!res?.isSuccess) {
        showAlert(
          "Link Failed",
          res?.message || "Microsoft link failed.",
          "error",
        );
        return;
      }

      showAlert(
        "Microsoft Linked",
        "Your Microsoft account is now linked.",
        "success",
      );
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      void useAuthStore.getState().loadUser();
      await loadCredentials();
    } catch (e: any) {
      const backendMessage =
        e?.response?.data?.message ||
        e?.message ||
        "An unexpected error occurred.";
      showAlert("Link Failed", backendMessage, "error");
    } finally {
      setMsLoading(false);
    }
  };

  const handleLinkMicrosoft = async () => {
    if (!MS_CLIENT_ID || !MS_TENANT_ID) {
      showAlert(
        "Link Failed",
        "Missing Microsoft OAuth configuration.",
        "error",
      );
      return;
    }

    console.log("🔑 [auth] Initiating Microsoft Link with redirectUri:", redirectUri);
    setMsLoading(true);
    const result = await promptAsync();
    if (result?.type !== "success") {
      setMsLoading(false);
    }
  };

  const rawPrimary = credentials?.primaryProvider;
  const primaryStr = rawPrimary !== undefined && rawPrimary !== null ? String(rawPrimary).trim() : "";
  const primaryLower = primaryStr.toLowerCase();
  const userEmail = credentials?.email ?? "student.parkflow@university.edu.ph";

  const manualLink = credentials?.linkedIdentities.find(
    (link) =>
      link.provider === "Manual" ||
      link.provider === "0" ||
      link.provider === "Local" ||
      link.provider === "Email",
  );

  const msLink = credentials?.linkedIdentities.find(
    (link) => link.provider === "Microsoft" || link.provider === "1",
  );

  const isMicrosoftPrimary =
    msLink?.isPrimary ??
    (primaryLower === "microsoft" ||
     primaryLower === "1" ||
     primaryStr === "");

  const isManualPrimary =
    manualLink?.isPrimary ??
    (primaryLower === "manual" ||
     primaryLower === "local" ||
     primaryLower === "email" ||
     primaryLower === "0");

  const isManualConfigured = isManualPrimary || !!manualLink;
  const manualEmail = isManualPrimary ? userEmail : (manualLink?.email ?? "");
  const isManualVerified = isManualPrimary
    ? true
    : (manualLink?.isVerified ?? false);

  const isMsConfigured = isMicrosoftPrimary || !!msLink;
  const msEmail = isMicrosoftPrimary ? userEmail : (msLink?.email ?? "");
  const isMsVerified = isMicrosoftPrimary
    ? true
    : (msLink?.isVerified ?? false);

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
        <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
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
            <Text className="text-light-text dark:text-dark-text font-bold text-[22px] tracking-tight">
              Emails
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] mt-1.5">
              Manage your linked email addresses, verification priorities, and
              credential access.
            </Text>
          </View>

          {/* Linked Emails List */}
          <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border shadow-soft overflow-hidden">
            {emailItems.length === 0 ? (
              <View className="p-6 items-center">
                <AlertTriangle size={24} color={colors.warning} />
                <Text className="text-light-text dark:text-dark-text font-bold mt-2 text-[13px]">
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
                      showBorder
                        ? "border-b border-light-border/40 dark:border-dark-border/40"
                        : ""
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-1.5 flex-wrap">
                        <Text className="text-light-text dark:text-dark-text font-bold text-[13.5px]">
                          {item.label}
                        </Text>
                        {item.isPrimary ? (
                          <View className="bg-light-primary/10 dark:bg-dark-primary/22 px-2 py-0.5 rounded-md">
                            <Text className="text-light-primary dark:text-dark-primary font-bold text-[10px]">
                              Primary
                            </Text>
                          </View>
                        ) : !item.isVerified ? (
                          <View className="bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                            <Text className="text-amber-600 dark:text-amber-500 font-bold text-[10px]">
                              Unverified
                            </Text>
                          </View>
                        ) : (
                          <View className="bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                              Linked
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className="text-light-muted dark:text-dark-muted font-regular text-[12px]"
                        numberOfLines={1}
                      >
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
              <Text className="text-light-primary dark:text-dark-primary font-bold text-[13px]">
                + Link Email & Password Account
              </Text>
            </TouchableOpacity>
          )}

          {!isMsConfigured && (
            <TouchableOpacity
              onPress={handleLinkMicrosoft}
              disabled={msLoading || !request}
              className="mt-4 p-4 border border-dashed border-light-border dark:border-dark-border rounded-card active:opacity-60"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
                    <SvgXml xml={microsoftSvg} width={18} height={18} />
                  </View>
                  <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                    Link Microsoft Account
                  </Text>
                </View>
                {msLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
      />
    </ContentWrapper>
  );
}
