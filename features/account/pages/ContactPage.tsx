import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigation, useRouter } from "expo-router";
import {
  Clock,
  Copy,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, Clipboard, Keyboard } from "react-native";

export default function ContactPage() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const lastScrolledRef = useRef(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [toast, setToast] = useState({ visible: false, title: "", message: "", variant: "success" as any });

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

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    setToast({
      visible: true,
      title: "Copied to Clipboard",
      message: `${label} "${text}" has been copied successfully.`,
      variant: "success",
    });
  };

  const handleSendMessage = async () => {
    Keyboard.dismiss();

    if (!subject.trim()) {
      setToast({
        visible: true,
        title: "Validation Error",
        message: "Please specify a subject for your message.",
        variant: "warning",
      });
      return;
    }

    if (!message.trim()) {
      setToast({
        visible: true,
        title: "Validation Error",
        message: "Please write a message description.",
        variant: "warning",
      });
      return;
    }

    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSending(false);

    setSubject("");
    setMessage("");

    setToast({
      visible: true,
      title: "Message Sent",
      message: "Your message has been delivered to BulSU administration. We will reply to your account email address within 24 hours.",
      variant: "success",
    });
  };

  return (
    <ContentWrapper noPaddingY>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Subtitle */}
        <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider mb-3 px-0.5">
          Campus Administrative Support
        </Text>

        {/* Contact Grid Options */}
        <View className="gap-3 mb-6">
          {/* Email Support Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => copyToClipboard("support@parkflow.bulsu.edu.ph", "Email")}
            className="flex-row items-center justify-between bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4 shadow-soft active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <View className="w-8.5 h-8.5 rounded-button bg-blue-50 dark:bg-blue-950/20 items-center justify-center">
                <Mail size={16} color="#3B82F6" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-light-muted dark:text-dark-muted font-book text-[10px] uppercase tracking-wider">
                  Support Email
                </Text>
                <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] mt-0.5">
                  support@parkflow.bulsu.edu.ph
                </Text>
              </View>
            </View>
            <Copy size={14} color={colors.muted} strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Phone Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => copyToClipboard("+63 (44) 791 0123", "Phone hotline")}
            className="flex-row items-center justify-between bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4 shadow-soft active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <View className="w-8.5 h-8.5 rounded-button bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center">
                <Phone size={16} color="#10B981" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-light-muted dark:text-dark-muted font-book text-[10px] uppercase tracking-wider">
                  Hotline Hotline
                </Text>
                <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] mt-0.5">
                  +63 (44) 791 0123
                </Text>
              </View>
            </View>
            <Copy size={14} color={colors.muted} strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Physical Office Card */}
          <View className="flex-row items-center bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4 shadow-soft">
            <View className="flex-row items-center gap-3.5 flex-1">
              <View className="w-8.5 h-8.5 rounded-button bg-amber-50 dark:bg-amber-950/20 items-center justify-center">
                <MapPin size={16} color="#F59E0B" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-light-muted dark:text-dark-muted font-book text-[10px] uppercase tracking-wider">
                  Physical Office
                </Text>
                <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] mt-0.5">
                  Gate 3 Office, Main Campus Ground Floor
                </Text>
              </View>
            </View>
          </View>

          {/* Operating Hours Card */}
          <View className="flex-row items-center bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4 shadow-soft">
            <View className="flex-row items-center gap-3.5 flex-1">
              <View className="w-8.5 h-8.5 rounded-button bg-purple-50 dark:bg-purple-950/20 items-center justify-center">
                <Clock size={16} color="#8B5CF6" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-light-muted dark:text-dark-muted font-book text-[10px] uppercase tracking-wider">
                  Working Hours
                </Text>
                <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] mt-0.5">
                  Mon - Fri • 8:00 AM - 5:00 PM (PST)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Messaging Form */}
        <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4 shadow-soft">
          <Text className="text-light-text dark:text-dark-text font-black text-[14.5px] tracking-tight mb-4">
            Send Administrative Message
          </Text>

          <AppInput
            label="Subject"
            placeholder="What is your message about?"
            value={subject}
            onChangeText={setSubject}
          />

          <AppInput
            label="Message Details"
            placeholder="Type your detailed question, concern, or dispute explanation..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className="h-[100px]"
          />

          <View className="mt-2.5">
            <AppButton
              label="Send Message"
              variant="primary"
              uppercase={false}
              icon={<Send size={15} color="#FFFFFF" strokeWidth={2} />}
              loading={isSending}
              disabled={isSending}
              onPress={handleSendMessage}
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Dialog Notification */}
      <AlertModal
        visible={toast.visible}
        onClose={() => setToast((p) => ({ ...p, visible: false }))}
        title={toast.title}
        message={toast.message}
        variant={toast.variant}
      />
    </ContentWrapper>
  );
}
