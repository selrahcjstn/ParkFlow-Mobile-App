import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import * as DocumentPicker from "expo-document-picker";
import { validateFileSize } from "@/utils/fileValidation";
import { useNavigation } from "expo-router";
import { feedbackService, type FeedbackDto } from "../services/feedback.service";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import {
  FileText,
  Image as ImageIcon,
  MessageSquare,
  MessageSquarePlus,
  Receipt,
  Star,
  Clock,
  Trash2,
  Check,
  CheckCircle2,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type FeedbackCategory = "bug" | "feature" | "uiux" | "general";
type ActiveTab = "submit" | "history";

export default function FeedbackPage() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const iconColor = colors.text;

  const [activeTab, setActiveTab] = useState<ActiveTab>("submit");
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  
  // User Rating State (Single persistent rating with modify capability)
  const [rating, setRating] = useState<number>(0);
  const [savedRating, setSavedRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [isUpdatingRating, setIsUpdatingRating] = useState<boolean>(false);
  const [ratingSuccessModal, setRatingSuccessModal] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  const [description, setDescription] = useState("");
  const [attachedFile, setAttachedFile] = useState<{
    uri: string;
    name: string;
    size: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My Feedbacks History State
  const [myFeedbacks, setMyFeedbacks] = useState<FeedbackDto[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUserRating = async () => {
    try {
      const res = await feedbackService.getMyRating();
      if (res?.isSuccess && res.data?.hasRated && res.data.rating) {
        setHasRated(true);
        setSavedRating(res.data.rating);
        setRating(res.data.rating);
      }
    } catch (err) {
      console.error("Failed to load user rating:", err);
    }
  };

  const fetchMyFeedbacks = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await feedbackService.getMyFeedbacks();
      let list: FeedbackDto[] = [];
      if (res?.isSuccess && Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray((res as any)?.data?.$values)) {
        list = (res as any).data.$values;
      } else if (Array.isArray((res as any)?.data)) {
        list = (res as any).data;
      }
      setMyFeedbacks(list);

      const ratedItem = list.find((f: FeedbackDto) => f.rating >= 1 && f.rating <= 5);
      if (ratedItem) {
        setHasRated(true);
        setSavedRating((prev) => prev ?? ratedItem.rating);
        setRating((prev) => (prev === 0 ? ratedItem.rating : prev));
      }
    } catch (err) {
      console.error("Failed to load user feedbacks history:", err);
      setMyFeedbacks([]);
    } finally {
      setIsLoadingHistory(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyFeedbacks();
    fetchUserRating();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchMyFeedbacks();
    }
  }, [activeTab]);

  const getCooldownRemainingMinutes = () => {
    if (!myFeedbacks || myFeedbacks.length === 0) return 0;
    const latest = myFeedbacks[0];
    if (!latest?.createdAt) return 0;
    const diffMs = Date.now() - new Date(latest.createdAt).getTime();
    const diffMinutes = diffMs / (1000 * 60);
    if (diffMinutes >= 0 && diffMinutes < 10) {
      return Math.ceil(10 - diffMinutes);
    }
    return 0;
  };

  const cooldownRemaining = getCooldownRemainingMinutes();

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const validation = validateFileSize(asset, 5);
        if (!validation.isValid) {
          setErrorModal({
            visible: true,
            message: validation.message || "File size cannot exceed 5MB.",
          });
          return;
        }

        setAttachedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to pick document:", err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });

  const descLimit = 500;
  const charsLeft = descLimit - description.length;
  const isTooShort = description.trim().length < 15;

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        try {
          navigation?.setParams?.({ hasScrolled: scrolled } as any);
        } catch {
          // Ignore navigation param errors
        }
      }
    }
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Tap to Rate";
    }
  };

  const handleUpdateRating = async (newRating?: number) => {
    const targetRating = newRating ?? rating;
    if (targetRating < 1 || targetRating > 5) return;

    setIsUpdatingRating(true);
    try {
      const res = await feedbackService.updateRating(targetRating);
      if (res?.isSuccess) {
        setHasRated(true);
        setSavedRating(targetRating);
        setRating(targetRating);
        setRatingSuccessModal({
          visible: true,
          message: `Your rating has been updated to ${targetRating} ${targetRating === 1 ? "star" : "stars"} (${getRatingLabel(targetRating)}).`,
        });
        fetchMyFeedbacks();
      } else {
        setErrorModal({
          visible: true,
          message: res?.message || "Failed to update rating. Please try again.",
        });
      }
    } catch (err: any) {
      setErrorModal({
        visible: true,
        message: err?.response?.data?.message || err?.message || "Failed to update rating. Please try again.",
      });
    } finally {
      setIsUpdatingRating(false);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (!hasRated && rating === 0) {
      setErrorModal({
        visible: true,
        message: "Please select a satisfaction rating (1 to 5 stars).",
      });
      return;
    }

    if (isTooShort) {
      setErrorModal({
        visible: true,
        message: "Please write a more detailed description (minimum 15 characters required).",
      });
      return;
    }

    if (cooldownRemaining > 0) {
      setErrorModal({
        visible: true,
        message: `Please wait ${cooldownRemaining} more minute(s) before submitting another feedback or inquiry.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const chosenRating = rating > 0 ? rating : (savedRating || 5);
      const res = await feedbackService.submitFeedback({
        category,
        rating: chosenRating,
        description: description.trim(),
        attachmentUrl: attachedFile?.name || null,
      });

      setIsSubmitting(false);

      if (res?.isSuccess || (res as any)?.data?.id) {
        setShowSuccess(true);
        setHasRated(true);
        setSavedRating(chosenRating);
        setDescription("");
        setAttachedFile(null);
        fetchMyFeedbacks();
        fetchUserRating();
      } else {
        setErrorModal({
          visible: true,
          message: res?.message || "Failed to submit feedback. Please try again.",
        });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorModal({
        visible: true,
        message: err?.response?.data?.message || err?.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setActiveTab("history");
  };

  return (
    <ContentWrapper noPaddingY>
      {/* Top Tab Controls */}
      <View className="flex-row mt-3 mb-2 p-1 bg-light-surfaceLighter dark:bg-dark-surfaceLighter border border-light-border dark:border-dark-border rounded-button">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab("submit");
          }}
          className={`flex-1 py-2.5 rounded-button items-center flex-row justify-center gap-2 ${
            activeTab === "submit"
              ? "bg-light-surface dark:bg-dark-surface"
              : ""
          }`}
          style={
            activeTab === "submit"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 1.5,
                  elevation: 2,
                }
              : undefined
          }
        >
          <MessageSquarePlus
            size={16}
            color={activeTab === "submit" ? colors.primary : colors.muted}
          />
          <Text
            className={`text-[12.5px] font-heavy ${
              activeTab === "submit"
                ? "text-light-primary dark:text-dark-primary"
                : "text-light-muted dark:text-dark-muted"
            }`}
          >
            Submit Feedback
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab("history");
          }}
          className={`flex-1 py-2.5 rounded-button items-center flex-row justify-center gap-2 ${
            activeTab === "history"
              ? "bg-light-surface dark:bg-dark-surface"
              : ""
          }`}
          style={
            activeTab === "history"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 1.5,
                  elevation: 2,
                }
              : undefined
          }
        >
          <MessageSquare
            size={16}
            color={activeTab === "history" ? colors.primary : colors.muted}
          />
          <Text
            className={`text-[12.5px] font-heavy ${
              activeTab === "history"
                ? "text-light-primary dark:text-dark-primary"
                : "text-light-muted dark:text-dark-muted"
            }`}
          >
            Inquiries & Replies
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "submit" ? (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        >
            {/* Header Message */}
            <View className="mb-6 flex-row items-center gap-3 bg-light-surfaceLighter dark:bg-dark-surfaceLighter border border-light-border dark:border-dark-border p-4 rounded-card">
              <MessageSquarePlus size={22} color={iconColor} strokeWidth={2} />
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-heavy text-[13.5px]">
                  Help Us Improve ParkFlow
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5 leading-[15px]">
                  Your ideas, bug reports, and inquiries help ParkFlow security
                  build a seamless campus experience.
                </Text>
              </View>
            </View>

            {/* Anti-Spam Submission Cooldown Notice */}
            {cooldownRemaining > 0 && (
              <View
                className="mb-5 p-3.5 rounded-card flex-row items-center gap-2.5 border"
                style={{
                  backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB",
                  borderColor: isDark ? "rgba(245, 158, 11, 0.25)" : "#FDE68A",
                }}
              >
                <Clock size={16} color="#D97706" />
                <View className="flex-1">
                  <Text className="text-[12px] font-heavy text-amber-700 dark:text-amber-400">
                    Submission Cooldown Active
                  </Text>
                  <Text className="text-[11px] font-regular text-amber-600 dark:text-amber-500 mt-0.5">
                    To prevent spam, please wait {cooldownRemaining} minute(s) before submitting another inquiry.
                  </Text>
                </View>
              </View>
            )}

            {/* Feedback Category */}
            <View className="mb-5">
              <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider mb-3 px-0.5">
                Feedback Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(["bug", "feature", "uiux", "general"] as const).map((cat) => {
                  const isActive = category === cat;
                  const catLabel =
                    cat === "bug"
                      ? "Bug Report"
                      : cat === "feature"
                        ? "Feature Request"
                        : cat === "uiux"
                          ? "UI/UX Design"
                          : "General Inquiry";
                  return (
                    <TouchableOpacity
                      key={cat}
                      activeOpacity={0.75}
                      onPress={() => setCategory(cat)}
                      className={`px-4 py-2.5 rounded-button border ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                          : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-heavy ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-light-accent dark:text-dark-accent"
                        }`}
                      >
                        {catLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Satisfaction Rating */}
            <View className="mb-5 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 rounded-card items-center">
              <View className="flex-row items-center gap-2 mb-1.5">
                <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                  {hasRated ? "Your Satisfaction Rating" : "How would you rate your experience?"}
                </Text>
              </View>

              {hasRated && (
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11.5px] text-center mb-2">
                  You can modify your rating anytime by selecting a new star rating.
                </Text>
              )}

              <View className="flex-row gap-2.5 my-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isSelected = rating >= star;
                  return (
                    <TouchableOpacity
                      key={star}
                      activeOpacity={0.7}
                      onPress={() => setRating(star)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Star
                        size={28}
                        color={isSelected ? "#F59E0B" : colors.border}
                        fill={isSelected ? "#F59E0B" : "transparent"}
                        strokeWidth={1.8}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                className={`text-[12px] font-heavy mt-1.5 ${
                  rating > 0
                    ? "text-amber-500"
                    : "text-light-muted dark:text-dark-muted"
                }`}
              >
                {getRatingLabel(rating)}
              </Text>

              {/* Modify Rating Button when rating has changed */}
              {hasRated && rating !== savedRating && rating > 0 && (
                <TouchableOpacity
                  onPress={() => handleUpdateRating(rating)}
                  disabled={isUpdatingRating}
                  className="mt-3 px-4 py-2 bg-light-primary dark:bg-dark-primary rounded-button flex-row items-center gap-2 active:opacity-80"
                >
                  {isUpdatingRating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                  <Text className="text-white font-heavy text-[12px]">
                    Update Rating to {rating} {rating === 1 ? "Star" : "Stars"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Submit Rating Only when user hasn't rated yet and hasn't written an inquiry */}
              {!hasRated && rating > 0 && (
                <TouchableOpacity
                  onPress={() => handleUpdateRating(rating)}
                  disabled={isUpdatingRating}
                  className="mt-3 px-4 py-2 bg-light-accent dark:bg-dark-accent rounded-button flex-row items-center gap-2 active:opacity-80"
                >
                  {isUpdatingRating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                  <Text className="text-light-textInverse dark:text-zinc-950 font-heavy text-[12px]">
                    Submit Rating
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Feedback Description Textarea */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2 px-0.5">
                <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider">
                  Describe Your Suggestion
                </Text>
                <Text
                  className={`text-[10.5px] font-heavy ${
                    description.length > 0 && isTooShort
                      ? "text-amber-600 dark:text-amber-400"
                      : charsLeft < 50
                        ? "text-light-primary dark:text-dark-primary"
                        : "text-light-muted dark:text-dark-muted"
                  }`}
                >
                  {description.length > 0 && isTooShort
                    ? `${description.trim().length} / 15 min chars`
                    : `${charsLeft} / ${descLimit}`}
                </Text>
              </View>
              <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border overflow-hidden">
                <TextInput
                  multiline
                  numberOfLines={6}
                  maxLength={descLimit}
                  textAlignVertical="top"
                  placeholder="Share your thoughts or describe the issue you encountered (minimum 15 characters)..."
                  placeholderTextColor={isDark ? "#B5BAC1" : "#6B7280"}
                  value={description}
                  onChangeText={setDescription}
                  className="px-4 py-3.5 text-light-text dark:text-dark-text text-[13.5px] font-regular h-[120px]"
                />
              </View>
            </View>

            {/* Screenshot Attachment */}
            <View className="mb-6">
              <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider mb-2 px-0.5">
                Attach Screenshot (Optional)
              </Text>

              {attachedFile ? (
                <View className="flex-row items-center justify-between bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4">
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <View className="w-9 h-9 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
                      <ImageIcon size={18} color={iconColor} strokeWidth={2} />
                    </View>
                    <View className="flex-1 pr-1">
                      <Text
                        className="text-light-text dark:text-dark-text font-heavy text-[12.5px]"
                        numberOfLines={1}
                      >
                        {attachedFile.name}
                      </Text>
                      <Text className="text-light-muted dark:text-dark-muted font-regular text-[10.5px] mt-0.5">
                        {formatFileSize(attachedFile.size)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setAttachedFile(null)}
                    className="w-8 h-8 rounded-pill bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center active:bg-light-border"
                  >
                    <Trash2 size={15} color={iconColor} strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickFile}
                  className="h-[65px] border border-dashed border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface rounded-card items-center justify-center flex-row gap-2 active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
                >
                  <ImageIcon size={18} color={colors.muted} strokeWidth={2} />
                  <Text className="text-light-text dark:text-dark-text font-heavy text-[12.5px]">
                    Click to attach screenshot
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <AppButton
              label={
                cooldownRemaining > 0
                  ? `Cooldown (${cooldownRemaining}m left)`
                  : description.length > 0 && isTooShort
                    ? `Min 15 chars (${15 - description.trim().length} more)`
                    : "Submit Feedback"
              }
              variant="primary"
              uppercase={false}
              loading={isSubmitting}
              disabled={
                isSubmitting ||
                cooldownRemaining > 0 ||
                isTooShort ||
                (!hasRated && rating === 0)
              }
              onPress={handleSubmit}
            />
          </ScrollView>
        ) : (
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchMyFeedbacks();
                }}
                colors={[colors.primary || "#D22730"]}
                tintColor={colors.primary || "#D22730"}
              />
            }
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
          >
            {isLoadingHistory ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary || "#D22730"} />
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-3">
                  Loading your inquiries & admin responses...
                </Text>
              </View>
            ) : (() => {
              const feedbacksList = Array.isArray(myFeedbacks) ? myFeedbacks : [];
              if (feedbacksList.length === 0) {
                return (
                  <View className="py-12 items-center justify-center px-4">
                    <MessageSquare size={42} color={colors.muted} strokeWidth={1.5} />
                    <Text className="text-light-text dark:text-dark-text font-heavy text-[15px] mt-3">
                      No Submitted Inquiries Yet
                    </Text>
                    <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] text-center mt-1">
                      Submissions and responses from security administration will appear here.
                    </Text>
                  </View>
                );
              }
              return (
                <View className="gap-4">
                  {feedbacksList.map((item, index) => {
                    const safeRating = Math.max(0, Math.min(5, Math.floor(Number(item?.rating) || 0)));
                    return (
                      <View
                        key={item?.id || `feedback-${index}`}
                        className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 rounded-card gap-3"
                      >
                        {/* Top Header */}
                        <View className="flex-row items-center justify-between gap-2 flex-wrap pb-0.5">
                          <View className="flex-row items-center gap-2 flex-shrink">
                            <View className="px-2.5 py-1 rounded-pill bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                              <Text className="text-[10px] font-heavy uppercase text-blue-600 dark:text-blue-400">
                                {item?.category || "General"}
                              </Text>
                            </View>
                            {safeRating > 0 && (
                              <View className="flex-row items-center gap-0.5">
                                {Array.from({ length: safeRating }).map((_, sIdx) => (
                                  <Star key={sIdx} size={11} color="#F59E0B" fill="#F59E0B" />
                                ))}
                              </View>
                            )}
                          </View>
                          <Text className="text-light-muted dark:text-dark-muted font-regular text-[10.5px] flex-shrink-0">
                            {item?.createdAt ? formatDateAndTime(item.createdAt) : "N/A"}
                          </Text>
                        </View>

                        {/* User Query / Feedback */}
                        <Text className="text-light-text dark:text-dark-text font-regular text-[13px] leading-[18px]">
                          {item?.description || ""}
                        </Text>

                        {/* Admin Response Card if present */}
                        {item?.adminReplyMessage ? (
                          <View
                            className="p-3.5 rounded-button gap-2 border"
                            style={{
                              backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5",
                              borderColor: isDark ? "rgba(16, 185, 129, 0.3)" : "#A7F3D0",
                            }}
                          >
                            <View className="flex-row items-center justify-between gap-2 mb-1">
                              <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                                <MessageSquare size={13} color="#059669" />
                                <Text
                                  className="text-emerald-700 dark:text-emerald-400 font-heavy text-[11.5px]"
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  Admin Response
                                </Text>
                              </View>
                              {item.adminRepliedAt ? (
                                <Text className="text-light-muted dark:text-dark-muted font-regular text-[10px] flex-shrink-0">
                                  {formatDateAndTime(item.adminRepliedAt)}
                                </Text>
                              ) : null}
                            </View>
                            <Text className="text-light-text dark:text-dark-text font-regular text-[12.5px] leading-[17px]">
                              {item.adminReplyMessage}
                            </Text>

                            {/* Issued Invoice Card if present */}
                            {item?.invoiceNumber ? (
                              <View
                                className="mt-1 bg-light-surface dark:bg-dark-surface border p-3 rounded-button"
                                style={{
                                  borderColor: isDark ? "rgba(16, 185, 129, 0.4)" : "#6EE7B7",
                                }}
                              >
                                <View className="flex-row items-center justify-between gap-2 flex-wrap">
                                  <View className="flex-row items-center gap-1.5 flex-shrink">
                                    <Receipt size={14} color="#059669" />
                                    <Text className="text-emerald-700 dark:text-emerald-400 font-heavy text-[11.5px]">
                                      INVOICE {item.invoiceNumber}
                                    </Text>
                                  </View>
                                  <Text className="text-light-primary dark:text-dark-primary font-heavy text-[13px] flex-shrink-0">
                                    ₱{(Number(item.invoiceAmount) || 0).toFixed(2)}
                                  </Text>
                                </View>
                                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-1">
                                  {item.invoiceDescription || "Fee Invoice"}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ) : (
                          <View
                            className="p-2.5 rounded-button flex-row items-center gap-1.5 border"
                            style={{
                              backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB",
                              borderColor: isDark ? "rgba(245, 158, 11, 0.25)" : "#FDE68A",
                            }}
                          >
                            <Clock size={12} color="#D97706" />
                            <Text className="text-amber-600 dark:text-amber-400 font-heavy text-[11px] flex-1">
                              Awaiting Admin Response (Within 24h SLA)
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </ScrollView>
        )}

        {/* Success Modal Overlay */}
        <AlertModal
          visible={showSuccess}
          onClose={handleSuccessClose}
          title="Feedback Submitted"
          message="Thank you! Your inquiry has been received. Security administration will reply shortly."
          variant="success"
        />

        {/* Rating Success Modal */}
        <AlertModal
          visible={ratingSuccessModal.visible}
          onClose={() => setRatingSuccessModal({ visible: false, message: "" })}
          title="Rating Updated"
          message={ratingSuccessModal.message}
          variant="success"
          icon={<CheckCircle2 size={32} color="#10B981" strokeWidth={2.5} />}
        />

        {/* Input Errors Modal */}
        <AlertModal
          visible={errorModal.visible}
          onClose={() => setErrorModal((p) => ({ ...p, visible: false }))}
          title="Incomplete Form"
          message={errorModal.message}
          variant="warning"
        />
      </ContentWrapper>
  );
}
