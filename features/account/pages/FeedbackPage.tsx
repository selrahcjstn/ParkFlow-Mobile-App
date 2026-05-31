import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigation, useRouter } from "expo-router";
import {
  CheckCircle2,
  Image as ImageIcon,
  MessageSquarePlus,
  Star,
  Trash2,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type FeedbackCategory = "bug" | "feature" | "uiux" | "general";

export default function FeedbackPage() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const lastScrolledRef = useRef(false);

  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [rating, setRating] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [isAttached, setIsAttached] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        navigation.setParams({ hasScrolled: scrolled } as any);
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
      setErrorModal({ visible: true, message: "Please select a satisfaction rating." });
      return;
    }

    if (!description.trim()) {
      setErrorModal({ visible: true, message: "Please write a brief description of your feedback." });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);

    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ContentWrapper noPaddingY>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        >
          {/* Header Message */}
          <View className="mb-6 flex-row items-center gap-3 bg-red-50 dark:bg-red-950/25 border border-light-primary/15 dark:border-dark-primary/30 p-4 rounded-card">
            <MessageSquarePlus size={22} color={colors.primary} strokeWidth={2} />
            <View className="flex-1">
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13.5px]">
                Help Us Improve ParkFlow
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5 leading-[15px]">
                Your ideas, bug reports, and suggestions help BulSU security build a seamless campus experience.
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
                        ? "bg-light-primary/10 dark:bg-dark-primary/20 border-light-primary dark:border-dark-primary"
                        : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-heavy ${
                        isActive
                          ? "text-light-primary dark:text-dark-primary"
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
                rating > 0 ? "text-amber-500" : "text-light-muted dark:text-dark-muted"
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
                  charsLeft < 50 ? "text-light-primary" : "text-light-muted dark:text-dark-muted"
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

          {/* Screenshot Attachment Mockup */}
          <View className="mb-6">
            <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider mb-2 px-0.5">
              Attach Screenshot (Optional)
            </Text>

            {isAttached ? (
              <View className="flex-row items-center justify-between bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-button bg-light-background dark:bg-dark-surfaceMuted items-center justify-center">
                    <ImageIcon size={18} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-light-text dark:text-dark-text font-heavy text-[12.5px]">
                      BulSU_Feedback_Upload.jpg
                    </Text>
                    <Text className="text-light-muted dark:text-dark-muted font-regular text-[10.5px] mt-0.5">
                      image/jpeg • 412 KB
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsAttached(false)}
                  className="w-8 h-8 rounded-pill bg-light-background dark:bg-dark-surfaceMuted items-center justify-center active:bg-light-border"
                >
                  <Trash2 size={15} color="#EF4444" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsAttached(true)}
                className="h-[65px] border border-dashed border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface rounded-card items-center justify-center flex-row gap-2 active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
              >
                <ImageIcon size={18} color={colors.muted} strokeWidth={2} />
                <Text className="text-light-text dark:text-dark-text font-heavy text-[12.5px]">
                  Click to Attach Simulated Screenshot
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

        {/* Success Modal Overlay */}
        <AlertModal
          visible={showSuccess}
          onClose={handleSuccessClose}
          title="Feedback Submitted"
          message="Thank you! Your feedback has been safely received. The BulSU engineering and security team will review it shortly."
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
    </TouchableWithoutFeedback>
  );
}
