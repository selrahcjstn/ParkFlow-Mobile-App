import { ContentWrapper } from "@/components/layouts";
import { AppButton, AppInput } from "@/components/ui";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { userService, CorSubmissionDto } from "@/features/user/services/user.service";
import { useApiMutation, useProfileQuery } from "@/hooks";
import { queryClient } from "@/services/queryClient";
import { useAppTheme } from "@/hooks/useAppTheme";
import { PHONE_REGEX } from "@/utils/registerValidation";
import { useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "expo-router";
import {
  CheckCircle,
  Mail,
  Pencil,
  Phone,
  Shield,
  AlertCircle,
  XCircle,
  FileText,
  Eye,
  X,
  FileCheck,
  FileSpreadsheet,
  Upload,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Image as ExpoImage } from "expo-image";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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

  const [isLoading, setIsLoading] = useState(false);
  const { data: profile, isLoading: isProfileLoading } = useProfileQuery();

  const isGuardUser = user?.profileType === "guard";

  const { data: corSubmission, isLoading: isCorLoading } = useQuery({
    queryKey: ["my-cor-submission"],
    queryFn: async () => {
      const res = await userService.getMyCorSubmission();
      return res.isSuccess ? res.data : null;
    },
    enabled: !isGuardUser,
  });

  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState<string>("");
  const [docImageLoading, setDocImageLoading] = useState(false);

  const [uploadingDocType, setUploadingDocType] = useState<"cor" | "orcr" | "motor" | null>(null);

  const formatDocumentUrl = (url?: string | null) => {
    if (!url) return "";
    let formatted = url.trim();
    if (formatted === "pending") return "";
    if (
      !formatted.startsWith("http://") &&
      !formatted.startsWith("https://") &&
      !formatted.startsWith("file://")
    ) {
      formatted = `http://98.82.184.215:5000${formatted.startsWith("/") ? "" : "/"}${formatted}`;
    }
    return formatted;
  };

  const isValidDocUrl = (url?: string | null) => {
    return Boolean(formatDocumentUrl(url));
  };

  const handleUploadDocument = async (docType: "cor" | "orcr" | "motor") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: docType === "motor" ? ["image/*"] : ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      setUploadingDocType(docType);

      if (corSubmission?.id) {
        let uploadRes;
        if (docType === "cor") {
          uploadRes = await userService.uploadCorDocument(
            asset.uri,
            asset.name || `cor_${Date.now()}.jpg`,
            corSubmission.id,
          );
        } else if (docType === "orcr") {
          uploadRes = await userService.uploadOrcrDocument(
            asset.uri,
            asset.name || `orcr_${Date.now()}.jpg`,
            corSubmission.id,
          );
        } else {
          uploadRes = await userService.uploadMotorPicture(
            asset.uri,
            asset.name || `motor_${Date.now()}.jpg`,
            corSubmission.id,
          );
        }

        if (!uploadRes?.isSuccess) {
          throw new Error(uploadRes?.message || `Failed to upload ${docType} document.`);
        }
      } else if (user?.id) {
        const payload: any = {
          userId: user.id,
          academicTerm: "2024-2025",
          corDocumentUrl: docType === "cor" ? asset.uri : "pending",
          orcrDocumentUrl: docType === "orcr" ? asset.uri : undefined,
          motorPictureUrl: docType === "motor" ? asset.uri : undefined,
        };
        const uploadRes = await onboardingService.updateCor(payload);

        if (!uploadRes?.isSuccess) {
          throw new Error(uploadRes?.message || "Failed to update submission.");
        }
      }

      queryClient.invalidateQueries({ queryKey: ["my-cor-submission"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      await loadUser();
    } catch (err: any) {
      console.error(`Failed to upload ${docType} document`, err);
      setSaveError(err?.message || `Failed to upload ${docType} document.`);
    } finally {
      setUploadingDocType(null);
    }
  };

  useEffect(() => {
    if (profile) {
      setProfileData(profile);
      setPhoneNumber(profile.phoneNumber || "");
      if (profile.profilePictureUrl) {
        setPickedImageUri(profile.profilePictureUrl);
      }
    }
  }, [profile]);

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

  const showLoading = isLoading || isProfileLoading;

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
      queryClient.invalidateQueries({ queryKey: ["profile"] });

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
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        await loadUser();
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
        {showLoading && !profileData ? (
          <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
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
                  className="w-24 h-24 rounded-full bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center relative overflow-hidden border border-light-border dark:border-dark-border"
                >
                  {pickedImageUri ? (
                    <Image
                      source={{ uri: pickedImageUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      className="font-black text-3xl tracking-widest"
                      style={{ color: colors.primary }}
                    >
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

              {(() => {
                if (user?.profileType === "guard") {
                  return (
                    <View className="flex-row items-center gap-1 bg-light-success/10 dark:bg-dark-success/15 px-2.5 py-0.5 rounded-pill border border-light-success/20 dark:border-dark-success/30">
                      <CheckCircle size={10} color={isDark ? "#23A55A" : "#10B981"} strokeWidth={2.5} />
                      <Text className="text-light-success dark:text-dark-success font-heavy text-[10px] uppercase tracking-wide">
                        Verified
                      </Text>
                    </View>
                  );
                }

                const status = user?.corVerificationStatus;
                if (status === 2) {
                  return (
                    <View className="flex-row items-center gap-1 bg-light-success/10 dark:bg-dark-success/15 px-2.5 py-0.5 rounded-pill border border-light-success/20 dark:border-dark-success/30">
                      <CheckCircle size={10} color={isDark ? "#23A55A" : "#10B981"} strokeWidth={2.5} />
                      <Text className="text-light-success dark:text-dark-success font-heavy text-[10px] uppercase tracking-wide">
                        Verified
                      </Text>
                    </View>
                  );
                } else if (status === 1) {
                  return (
                    <View className="flex-row items-center gap-1 bg-light-warning/10 dark:bg-dark-warning/15 px-2.5 py-0.5 rounded-pill border border-light-warning/20 dark:border-dark-warning/30">
                      <AlertCircle size={10} color={isDark ? "#F0B232" : "#F59E0B"} strokeWidth={2.5} />
                      <Text className="text-light-warning dark:text-dark-warning font-heavy text-[10px] uppercase tracking-wide">
                        Pending
                      </Text>
                    </View>
                  );
                } else if (status === 3) {
                  return (
                    <View className="flex-row items-center gap-1 bg-light-danger/10 dark:bg-dark-danger/15 px-2.5 py-0.5 rounded-pill border border-light-danger/20 dark:border-dark-danger/30">
                      <XCircle size={10} color={isDark ? "#F87171" : "#EF4444"} strokeWidth={2.5} />
                      <Text className="text-light-danger dark:text-dark-danger font-heavy text-[10px] uppercase tracking-wide">
                        Rejected
                      </Text>
                    </View>
                  );
                } else {
                  return (
                    <View className="flex-row items-center gap-1 bg-light-muted/10 dark:bg-dark-muted/15 px-2.5 py-0.5 rounded-pill border border-light-muted/20 dark:border-dark-muted/30">
                      <AlertCircle size={10} color={isDark ? "#B5BAC1" : "#71717A"} strokeWidth={2.5} />
                      <Text className="text-light-muted dark:text-dark-muted font-heavy text-[10px] uppercase tracking-wide">
                        Unverified
                      </Text>
                    </View>
                  );
                }
              })()}
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

              {/* Submitted Documents Section (Guards Excluded) */}
              {!isGuardUser && (
                <View className="mt-6 px-0.5">
                  <View className="flex-row items-center justify-between mb-2.5">
                    <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider">
                      Submitted Documents
                    </Text>
                    {corSubmission?.academicTerm && (
                      <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px]">
                        Term: {corSubmission.academicTerm}
                      </Text>
                    )}
                  </View>

                  <View className="bg-light-surface dark:bg-dark-surface rounded-card p-4 border border-light-border dark:border-dark-border gap-3.5">
                    {/* 1. Certificate of Registration (COR) */}
                    <View className="bg-light-surfaceLighter dark:bg-dark-surfaceLighter p-3.5 rounded-button border border-light-border/60 dark:border-dark-border/60">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          <View className="w-10 h-10 rounded-button bg-light-background dark:bg-dark-background items-center justify-center overflow-hidden border border-light-border/40 dark:border-dark-border/40">
                            {isValidDocUrl(corSubmission?.corDocumentUrl) ? (
                              <ExpoImage
                                source={{ uri: formatDocumentUrl(corSubmission!.corDocumentUrl) }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                              />
                            ) : (
                              <FileText size={18} color={colors.primary} />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                              Certificate of Registration (COR)
                            </Text>
                            <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                              {isValidDocUrl(corSubmission?.corDocumentUrl)
                                ? "Uploaded Document"
                                : "Required for registration"}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-2">
                          {isValidDocUrl(corSubmission?.corDocumentUrl) && (
                            <TouchableOpacity
                              onPress={() => {
                                setActiveDocUrl(formatDocumentUrl(corSubmission!.corDocumentUrl));
                                setActiveDocTitle("Certificate of Registration (COR)");
                                setDocImageLoading(true);
                              }}
                              activeOpacity={0.8}
                              className="flex-row items-center gap-1 bg-light-primary/10 dark:bg-dark-primary/20 px-2.5 py-1.5 rounded-full"
                            >
                              <Eye size={12} color={colors.primary} strokeWidth={2.2} />
                              <Text className="text-light-primary dark:text-dark-primary font-bold text-[11px]">
                                View
                              </Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            onPress={() => handleUploadDocument("cor")}
                            disabled={uploadingDocType === "cor"}
                            activeOpacity={0.8}
                            className="flex-row items-center gap-1 bg-red-600 px-3 py-1.5 rounded-full shadow-sm"
                          >
                            {uploadingDocType === "cor" ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <>
                                <Upload size={12} color="#FFF" strokeWidth={2.5} />
                                <Text className="text-white font-bold text-[11px]">
                                  {isValidDocUrl(corSubmission?.corDocumentUrl) ? "Update" : "Submit"}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* 2. Official Receipt / Certificate of Registration (OR/CR) */}
                    <View className="bg-light-surfaceLighter dark:bg-dark-surfaceLighter p-3.5 rounded-button border border-light-border/60 dark:border-dark-border/60">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          <View className="w-10 h-10 rounded-button bg-light-background dark:bg-dark-background items-center justify-center overflow-hidden border border-light-border/40 dark:border-dark-border/40">
                            {isValidDocUrl(corSubmission?.orcrDocumentUrl) ? (
                              <ExpoImage
                                source={{ uri: formatDocumentUrl(corSubmission!.orcrDocumentUrl) }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                              />
                            ) : (
                              <FileCheck size={18} color={colors.primary} />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                              Vehicle OR / CR Document
                            </Text>
                            <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                              {isValidDocUrl(corSubmission?.orcrDocumentUrl)
                                ? "Uploaded Document"
                                : "Required for registration"}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-2">
                          {isValidDocUrl(corSubmission?.orcrDocumentUrl) && (
                            <TouchableOpacity
                              onPress={() => {
                                setActiveDocUrl(formatDocumentUrl(corSubmission!.orcrDocumentUrl));
                                setActiveDocTitle("Vehicle Official Receipt / Registration (OR/CR)");
                                setDocImageLoading(true);
                              }}
                              activeOpacity={0.8}
                              className="flex-row items-center gap-1 bg-light-primary/10 dark:bg-dark-primary/20 px-2.5 py-1.5 rounded-full"
                            >
                              <Eye size={12} color={colors.primary} strokeWidth={2.2} />
                              <Text className="text-light-primary dark:text-dark-primary font-bold text-[11px]">
                                View
                              </Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            onPress={() => handleUploadDocument("orcr")}
                            disabled={uploadingDocType === "orcr"}
                            activeOpacity={0.8}
                            className="flex-row items-center gap-1 bg-red-600 px-3 py-1.5 rounded-full shadow-sm"
                          >
                            {uploadingDocType === "orcr" ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <>
                                <Upload size={12} color="#FFF" strokeWidth={2.5} />
                                <Text className="text-white font-bold text-[11px]">
                                  {isValidDocUrl(corSubmission?.orcrDocumentUrl) ? "Update" : "Submit"}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* 3. Vehicle / Motorcycle Photo */}
                    <View className="bg-light-surfaceLighter dark:bg-dark-surfaceLighter p-3.5 rounded-button border border-light-border/60 dark:border-dark-border/60">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          <View className="w-10 h-10 rounded-button bg-light-background dark:bg-dark-background items-center justify-center overflow-hidden border border-light-border/40 dark:border-dark-border/40">
                            {isValidDocUrl(corSubmission?.motorPictureUrl) ? (
                              <ExpoImage
                                source={{ uri: formatDocumentUrl(corSubmission!.motorPictureUrl) }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                              />
                            ) : (
                              <Shield size={18} color={colors.primary} />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                              Vehicle / Motorcycle Photo
                            </Text>
                            <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                              {isValidDocUrl(corSubmission?.motorPictureUrl)
                                ? "Uploaded Image"
                                : "Required for registration"}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-2">
                          {isValidDocUrl(corSubmission?.motorPictureUrl) && (
                            <TouchableOpacity
                              onPress={() => {
                                setActiveDocUrl(formatDocumentUrl(corSubmission!.motorPictureUrl));
                                setActiveDocTitle("Vehicle / Motorcycle Photo");
                                setDocImageLoading(true);
                              }}
                              activeOpacity={0.8}
                              className="flex-row items-center gap-1 bg-light-primary/10 dark:bg-dark-primary/20 px-2.5 py-1.5 rounded-full"
                            >
                              <Eye size={12} color={colors.primary} strokeWidth={2.2} />
                              <Text className="text-light-primary dark:text-dark-primary font-bold text-[11px]">
                                View
                              </Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            onPress={() => handleUploadDocument("motor")}
                            disabled={uploadingDocType === "motor"}
                            activeOpacity={0.8}
                            className="flex-row items-center gap-1 bg-red-600 px-3 py-1.5 rounded-full shadow-sm"
                          >
                            {uploadingDocType === "motor" ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <>
                                <Upload size={12} color="#FFF" strokeWidth={2.5} />
                                <Text className="text-white font-bold text-[11px]">
                                  {isValidDocUrl(corSubmission?.motorPictureUrl) ? "Update" : "Submit"}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Fullscreen Document Preview Modal */}
        <Modal
          visible={!!activeDocUrl}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveDocUrl(null)}
        >
          <View className="flex-1 bg-black/95 items-center justify-center p-4">
            <View className="w-full flex-1 justify-between pt-12 pb-6">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-4 py-3 bg-white/10 rounded-2xl mb-4">
                <Text className="text-white font-bold text-sm flex-1 mr-2" numberOfLines={1}>
                  {activeDocTitle}
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveDocUrl(null)}
                  className="w-9 h-9 rounded-full bg-white/20 items-center justify-center active:bg-white/30"
                >
                  <X size={20} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Modal Image */}
              {activeDocUrl && (
                <View className="flex-1 items-center justify-center my-2 overflow-hidden rounded-2xl relative bg-black/40">
                  <ExpoImage
                    source={{ uri: activeDocUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="contain"
                    transition={200}
                    onLoadStart={() => setDocImageLoading(true)}
                    onLoadEnd={() => setDocImageLoading(false)}
                    onError={() => setDocImageLoading(false)}
                  />
                  {docImageLoading && (
                    <View className="absolute inset-0 items-center justify-center bg-black/50">
                      <ActivityIndicator size="large" color="#D22730" />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ContentWrapper>
  );
}
