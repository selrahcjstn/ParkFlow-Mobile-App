import { ContentWrapper } from "@/components/layouts";
import { AppButton, AppInput } from "@/components/ui";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { userService } from "@/features/user/services/user.service";
import { useApiMutation } from "@/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import { PHONE_REGEX } from "@/utils/registerValidation";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "expo-router";
import { CheckCircle, Mail, Pencil, Phone, Shield } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore();
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();
  const iconColor = colors.text;

  const getInitialNames = () => {
    if (!user?.name) return { firstName: "", lastName: "" };
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" };
    }
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(" ");
    return { firstName, lastName };
  };

  const initialNames = getInitialNames();

  const [profileData, setProfileData] = useState<any>(() => {
    if (user) {
      return {
        firstName: initialNames.firstName,
        lastName: initialNames.lastName,
        phoneNumber: user.phoneNumber || "",
        profilePictureUrl: user.profilePictureUrl || "",
      };
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(!user);
  const [isEditing, setIsEditing] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState(() => user?.phoneNumber || "");
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(
    () => user?.profilePictureUrl || null,
  );
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { run: updateProfile, isLoading: isSaving } = useApiMutation(
    onboardingService.updateProfile,
  );

  const { run: updatePhoneNumberApi, isLoading: isSavingPhone } =
    useApiMutation(userService.updatePhoneNumber);

  const fetchProfile = async () => {
    try {
      const res = await userService.getProfile();
      if (res?.isSuccess && res.data) {
        setProfileData(res.data);
        setPhoneNumber(res.data.phoneNumber || "");
        if (res.data.profilePictureUrl) {
          setPickedImageUri(res.data.profilePictureUrl);
        }
      }
    } catch (err) {
      console.error("Failed to load profile details", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const lastScrolledRef = useRef(false);

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

  const handlePickImage = async () => {
    if (!user?.id) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      setPickedImageUri(asset.uri);
      setPickedFileName(asset.name);
      setSaveError(null);
      setIsLoading(true);

      const uploadRes = await userService.uploadProfilePicture(
        asset.uri,
        asset.name || `profile_${Date.now()}.jpg`,
        user.id,
      );

      if (!uploadRes?.isSuccess || !uploadRes.data?.secureUrl) {
        throw new Error(uploadRes?.message || "Upload failed.");
      }

      const secureUrl = uploadRes.data.secureUrl;

      const payload = {
        firstName: profileData?.firstName || "",
        lastName: profileData?.lastName || "",
        phoneNumber: phoneNumber.trim(),
        profilePictureUrl: secureUrl,
      };
      await updateProfile(payload);

      useAuthStore.getState().setProfilePictureUrl(secureUrl);

      await loadUser();

      setPickedImageUri(secureUrl);
    } catch (err: any) {
      console.error("Failed to upload/pick image", err);
      setSaveError(err?.message || "Failed to upload profile picture.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) {
      setPhoneError("Phone number is required.");
      return;
    }
    if (!PHONE_REGEX.test(phoneNumber.trim())) {
      setPhoneError("Invalid phone format (e.g. 09123456789).");
      return;
    }

    try {
      setSaveError(null);
      setPhoneError(null);

      const res = await updatePhoneNumberApi(phoneNumber.trim());
      if (res?.isSuccess) {
        await loadUser();
        await fetchProfile();
        setIsEditing(false);
      } else {
        setSaveError(res?.message || "Failed to update phone number.");
      }
    } catch (err: any) {
      setSaveError(
        err?.message || "An unexpected error occurred while saving.",
      );
    }
  };

  const getInitials = () => {
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.name) {
      const parts = user.name.split(" ");
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    return "PF";
  };

  const formatRole = (role: string) => {
    if (!role) return "User";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <ContentWrapper noPaddingY>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {isLoading && !profileData ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#D22730" />
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 0.5,
              paddingTop: 16,
              paddingBottom: 40,
            }}
          >
            <View className="items-center justify-center py-6 mb-4">
              <View className="relative mb-4">
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                  className="w-24 h-24 rounded-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center relative overflow-hidden border border-light-border dark:border-dark-border"
                >
                  {pickedImageUri ? (
                    <Image
                      source={{ uri: pickedImageUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-light-text dark:text-dark-text font-black text-3xl tracking-widest">
                      {getInitials()}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={0.85}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-light-primary items-center justify-center border-2 border-light-surface dark:border-dark-surface shadow-sm"
                >
                  <Pencil size={12} color="#FFF" strokeWidth={3} />
                </TouchableOpacity>
              </View>

              <Text className="text-light-text dark:text-dark-text font-black text-[24px] leading-7 mb-1 text-center">
                {profileData?.firstName || ""} {profileData?.lastName || ""}
              </Text>

              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] mb-3.5 text-center">
                {user?.email || "N/A"}
              </Text>

              {pickedFileName && (
                <Text
                  className="text-light-muted dark:text-dark-muted font-regular text-[10px] mb-2 text-center w-full"
                  numberOfLines={1}
                >
                  {pickedFileName}
                </Text>
              )}

              <View className="flex-row items-center gap-1 bg-light-success/10 px-2.5 py-0.5 rounded-pill border border-light-success/20">
                <CheckCircle size={10} color="#10B981" strokeWidth={2.5} />
                <Text className="text-light-success font-heavy text-[10px] uppercase tracking-wide">
                  Verified
                </Text>
              </View>
            </View>

            <View className="p-0.5">
              {saveError && (
                <View className="mb-4 bg-light-danger/10 border border-light-danger/25 p-3 rounded-card">
                  <Text className="text-light-danger font-book text-[13px] text-center">
                    {saveError}
                  </Text>
                </View>
              )}

              <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider mb-2.5 px-0.5">
                Profile Details
              </Text>

              <View className="bg-light-surface dark:bg-dark-surface rounded-card p-5 border border-light-border dark:border-dark-border">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
                    <Shield size={16} color={iconColor} strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-light-muted dark:text-dark-muted font-book text-[11px] uppercase tracking-wider">
                      Role
                    </Text>
                    <Text className="text-light-text dark:text-dark-text font-regular text-[14px] mt-0.5">
                      {formatRole(user?.profileType || "unassigned")}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-light-border/40 dark:bg-dark-border/20 my-4" />

                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
                    <Mail size={16} color={iconColor} strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-light-muted dark:text-dark-muted font-book text-[11px] uppercase tracking-wider">
                      Email Address
                    </Text>
                    <Text className="text-light-text dark:text-dark-text font-regular text-[14px] mt-0.5">
                      {user?.email || "N/A"}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-light-border/40 dark:bg-dark-border/20 my-4" />

                {isEditing ? (
                  <View>
                    <View className="flex-row items-center gap-3 mb-2">
                      <View className="w-8 h-8 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
                        <Phone size={16} color={iconColor} strokeWidth={2} />
                      </View>
                      <Text className="text-light-muted dark:text-dark-muted font-book text-[11px] uppercase tracking-wider">
                        Phone Number
                      </Text>
                    </View>

                    <AppInput
                      value={phoneNumber}
                      onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (phoneError) setPhoneError(null);
                      }}
                      error={phoneError || undefined}
                      placeholder="e.g. 09123456789"
                      keyboardType="phone-pad"
                    />

                    <View className="flex-row gap-3 mt-3">
                      <View className="flex-1">
                        <AppButton
                          label="Cancel"
                          variant="outline"
                          onPress={() => {
                            setIsEditing(false);
                            setPhoneNumber(profileData?.phoneNumber || "");
                            setPhoneError(null);
                            setSaveError(null);
                          }}
                        />
                      </View>
                      <View className="flex-1">
                        <AppButton
                          label="Save"
                          variant="primary"
                          loading={isSavingPhone}
                          onPress={handleSavePhone}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-8 h-8 rounded-button bg-light-background dark:bg-dark-background items-center justify-center">
                        <Phone size={16} color="#71717A" strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-light-muted dark:text-dark-muted font-book text-[11px] uppercase tracking-wider">
                          Phone Number
                        </Text>
                        <Text className="text-light-text dark:text-dark-text font-regular text-[14px] mt-0.5">
                          {phoneNumber || "N/A"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      className="w-8 h-8 rounded-full items-center justify-center active:bg-light-background dark:active:bg-dark-background"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Pencil size={16} color="#D22730" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </ContentWrapper>
  );
}
