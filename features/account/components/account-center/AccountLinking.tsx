import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Link2 } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { jwtDecode } from "jwt-decode";
import { authService } from "@/features/auth/services/auth.service";

WebBrowser.maybeCompleteAuthSession();

const MS_CLIENT_ID = process.env.EXPO_PUBLIC_MS_CLIENT_ID ?? "";
const MS_TENANT_ID = process.env.EXPO_PUBLIC_MS_TENANT_ID ?? "";

const redirectUri = AuthSession.makeRedirectUri();

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
};

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
  onShowErrorAlert: (title: string, message: string) => void;
  onRefreshCredentials: () => void;
  onTriggerSetPassword: () => void;
}

export default function AccountLinking({
  credentials,
  onShowSuccessAlert,
  onShowErrorAlert,
  onRefreshCredentials,
  onTriggerSetPassword,
}: AccountLinkingProps) {
  const { isDark } = useAppTheme();
  const primaryProviderValue = credentials?.primaryProvider ?? "Microsoft";
  const userEmail = credentials?.email ?? "student.parkflow@university.edu.ph";

  const isMicrosoftPrimary =
    primaryProviderValue === "Microsoft" || primaryProviderValue === "1";
  const isManualPrimary =
    primaryProviderValue === "Manual" || primaryProviderValue === "0";

  const [microsoftLinked, setMicrosoftLinked] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: MS_CLIENT_ID,
      scopes: ["openid", "profile", "email", "User.Read"],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === "success" && "params" in response) {
      const code = response.params?.code;
      if (code) {
        void handleLinkMicrosoftSuccess(code);
      }
    }
  }, [response]);

  const handleLinkMicrosoftSuccess = async (authCode: string) => {
    setActionLoading(true);
    try {
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
        onShowErrorAlert("Linking Failed", "Missing identity token.");
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

      const res = await authService.linkMicrosoft(payload);
      if (res?.isSuccess) {
        onShowSuccessAlert(
          "Account Linked",
          "Your Microsoft Institutional account has been successfully connected."
        );
        onRefreshCredentials();
      } else {
        const is409 = res?.errorCode === 409 || res?.message?.toLowerCase().includes("already linked");
        onShowErrorAlert(
          is409 ? "Already Linked" : "Linking Failed",
          res?.message || "Failed to link your Microsoft account."
        );
      }
    } catch (e: any) {
      console.error("Link Microsoft failed:", e);
      const is409 = e?.response?.status === 409 || e?.status === 409;
      const backendMessage = e?.response?.data?.message || e?.message || "An unexpected error occurred.";
      onShowErrorAlert(
        is409 ? "Already Linked" : "Linking Failed",
        backendMessage
      );
    } finally {
      setActionLoading(false);
    }
  };

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
    if (microsoftLinked) {
      setActionLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMicrosoftLinked(false);
      onShowSuccessAlert(
        "Account Unlinked",
        "Your Microsoft Institutional account has been disconnected."
      );
      setActionLoading(false);
    } else {
      void promptAsync();
    }
  };

  return (
    <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft mt-5">
      <View className="flex-row items-center gap-3 mb-5">
        <View className="w-9 h-9 rounded-button bg-emerald-50 dark:bg-emerald-500/20 items-center justify-center">
          <Link2 size={18} color={isDark ? "#34D399" : "#10B981"} strokeWidth={2.2} />
        </View>
        <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
          Linked Accounts
        </Text>
      </View>

      <View className="gap-4">
        <View className="flex-row items-center justify-between border-b border-light-border dark:border-dark-border pb-4">
          <View>
            <Text className="text-light-text dark:text-dark-text font-heavy text-[13.5px]">
              Email & Password
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5">
              {isManualPrimary ? userEmail : "No password configured"}
            </Text>
          </View>
          {isManualPrimary ? (
            <View className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted px-2.5 py-0.5 rounded-md">
              <Text className="text-light-accent dark:text-dark-text font-heavy text-[9px] uppercase tracking-wider">
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
            <Text className="text-light-text dark:text-dark-text font-heavy text-[13.5px]">
              Microsoft Account
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5">
              {microsoftLinked || isMicrosoftPrimary ? userEmail : "Not linked"}
            </Text>
          </View>
          {isMicrosoftPrimary ? (
            <View className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted px-2.5 py-0.5 rounded-md">
              <Text className="text-light-accent dark:text-dark-text font-heavy text-[9px] uppercase tracking-wider">
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
