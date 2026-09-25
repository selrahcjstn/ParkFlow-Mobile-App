import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import * as DocumentPicker from "expo-document-picker";
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
  const [rating, setRating] = useState<number>(0);
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

  const fetchMyFeedbacks = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await feedbackService.getMyFeedbacks();
      if (res?.isSuccess && Array.isArray(res.data)) {
        setMyFeedbacks(res.data);
      } else if (Array.isArray(res)) {
        setMyFeedbacks(res);
      } else if (Array.isArray((res as any)?.data?.$values)) {
        setMyFeedbacks((res as any).data.$values);
      } else if (Array.isArray((res as any)?.data)) {
        setMyFeedbacks((res as any).data);
      } else {
        setMyFeedbacks([]);
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
    if (activeTab === "history") {
      fetchMyFeedbacks();
    }
  }, [activeTab]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
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

  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (rating === 0) {
      setErrorModal({
        visible: true,
        message: "Please select a satisfaction rating.",
      });
      return;
    }

    if (!description.trim()) {
      setErrorModal({
        visible: true,
        message: "Please write a brief description of your feedback.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await feedbackService.submitFeedback({
        category,
        rating,
        description: description.trim(),
        attachmentUrl: attachedFile?.name || null,
      });

      setIsSubmitting(false);

      if (res?.isSuccess || (res as any)?.data?.id) {
        setShowSuccess(true);
        // Reset form
        setRating(0);
        setDescription("");
        setAttachedFile(null);
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
        message: err?.message || "An unexpected error occurred. Please try again.",
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
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] mb-2">
                How would you rate your experience?
              </Text>
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
            </View>

            {/* Feedback Description Textarea */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2 px-0.5">
                <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider">
                  Describe Your Suggestion
                </Text>
                <Text
                  className={`text-[10.5px] font-heavy ${
                    charsLeft < 50
                      ? "text-light-primary"
                      : "text-light-muted dark:text-dark-muted"
                  }`}
                >
                  {charsLeft} / {descLimit}
                </Text>
              </View>
              <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border overflow-hidden">
                <TextInput
                  multiline
                  numberOfLines={6}
                  maxLength={descLimit}
                  textAlignVertical="top"
                  placeholder="Share your thoughts or describe the issue you encountered..."
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
              label="Submit Feedback"
              variant="primary"
              uppercase={false}
              loading={isSubmitting}
              disabled={isSubmitting}
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
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
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
                          <Text className="text-light-muted dark:text-dark-muted font-regular text-[10.5px]">
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
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center gap-1.5">
                                <MessageSquare size={14} color="#059669" />
                                <Text className="text-emerald-700 dark:text-emerald-400 font-heavy text-[11.5px]">
                                  Admin Thank You & Reply Answer
                                </Text>
                              </View>
                              <Text className="text-light-muted dark:text-dark-muted font-regular text-[10px]">
                                {item.adminRepliedAt ? formatDateAndTime(item.adminRepliedAt) : ""}
                              </Text>
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
                                <View className="flex-row items-center justify-between">
                                  <View className="flex-row items-center gap-1.5">
                                    <Receipt size={15} color="#059669" />
                                    <Text className="text-emerald-700 dark:text-emerald-400 font-heavy text-[12px]">
                                      INVOICE {item.invoiceNumber}
                                    </Text>
                                  </View>
                                  <Text className="text-light-primary dark:text-dark-primary font-heavy text-[13.5px]">
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
                            <Text className="text-amber-600 dark:text-amber-400 font-heavy text-[11px]">
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
