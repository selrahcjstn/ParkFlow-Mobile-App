import { useAppTheme } from "@/hooks/useAppTheme";
import AppButton from "@/components/ui/AppButton";
import type { DialogAction, DialogVariant } from "@/services/app-dialog";
import { AlertTriangle, CheckCircle, HelpCircle, Info, XCircle } from "lucide-react-native";
import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface AppDialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  variant?: DialogVariant;
  icon?: ReactNode;
  actions: DialogAction[];
  onClose: () => void | Promise<unknown>;
  onDismiss?: () => void;
  onClosed?: () => void;
  dismissible?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

const iconStyles: Record<DialogVariant, string> = {
  success: "bg-light-success/10 dark:bg-dark-success/10",
  error: "bg-light-danger/10 dark:bg-dark-danger/10",
  warning: "bg-light-warning/10 dark:bg-dark-warning/10",
  info: "bg-light-primary/10 dark:bg-dark-primary/10",
  confirmation: "bg-light-primary/10 dark:bg-dark-primary/10",
};

export default function AppDialog({
  visible, title, message, variant = "info", icon, actions, onClose, onDismiss, onClosed,
  dismissible = !actions.some(action => action.style === "destructive"), loading = false, children,
}: AppDialogProps) {
  const { colors } = useAppTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [present, setPresent] = useState(visible);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [progress] = useState(() => new Animated.Value(0));
  const actionRunning = useRef(false);
  const closing = useRef(false);
  const reducedMotion = useRef(false);
  const closedCallback = useRef(onClosed);
  useEffect(() => { closedCallback.current = onClosed; }, [onClosed]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) reducedMotion.current = value; }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const busy = loading || busyIndex !== null;
  // Remember an opening dialog until its closing animation has finished.
  if (visible && !present) setPresent(true);
  // Keep controlled dialogs mounted if a parent hides one before its async action finishes.
  const shouldShow = visible || (present && busy) || !!actionError;
  useEffect(() => {
    closing.current = !shouldShow;
    if (shouldShow) {
      Animated.timing(progress, { toValue: 1, duration: reducedMotion.current ? 0 : 160, useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: reducedMotion.current ? 0 : 120, useNativeDriver: true }).start(({ finished }) => {
        if (finished) {
          setPresent(false);
          closedCallback.current?.();
        }
      });
    }
    return () => progress.stopAnimation();
  }, [shouldShow, progress]);

  const runAction = async (action: DialogAction, index: number) => {
    if (action.disabled || busy || actionRunning.current || closing.current) return;
    actionRunning.current = true;
    setActionError("");
    setBusyIndex(index);
    try {
      await action.onPress?.();
      if (action.closeOnPress !== false) await onClose();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "This action could not be completed. Please try again.");
    } finally {
      actionRunning.current = false;
      setBusyIndex(null);
    }
  };

  const dismiss = () => {
    if (!dismissible || busy || actionRunning.current || closing.current) return;
    void runAction({ text: "Dismiss", closeOnPress: false, onPress: async () => {
      onDismiss?.();
      await onClose();
    } }, actions.length - 1);
  };

  // A confirmation that asks "are you sure?" (e.g. log out) is not a failure: follow the app theme
  // instead of the error colours. Real errors without a destructive action keep their red styling.
  const isConfirmation = variant === "error" && actions.some(action => action.style === "destructive");
  const shownVariant: DialogVariant = isConfirmation ? "confirmation" : variant;
  const Icon = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info, confirmation: HelpCircle }[shownVariant];
  const iconColor = { success: colors.success, error: colors.danger, warning: colors.warning, info: colors.primary, confirmation: colors.primary }[shownVariant];
  const stackedActions = width < 360 || fontScale > 1.2 || actions.length > 2;

  return (
    <Modal visible={present} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}
      onShow={() => { if (title) AccessibilityInfo.announceForAccessibility(`${title}. ${message ?? ""}`); }}>
      <View className="flex-1 items-center justify-center" style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
        <Animated.View className="absolute inset-0 bg-black/50" style={{ opacity: progress }}>
          <Pressable className="flex-1" onPress={dismiss} accessible={false} importantForAccessibility="no" />
        </Animated.View>
        <Animated.View accessibilityViewIsModal importantForAccessibility="yes"
          className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-card overflow-hidden"
          style={{ width: Math.min(width - 32, 440), maxHeight: Math.max(120, height - insets.top - insets.bottom - 32), opacity: progress,
            transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }}>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <View className="items-center mb-4">
              <View className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${iconStyles[shownVariant]}`}>
                {icon ?? <Icon size={28} color={iconColor} strokeWidth={2} />}
              </View>
              {title ? <Text accessibilityRole="header" className="font-bold text-xl leading-7 text-center text-light-text dark:text-dark-text">{title}</Text> : null}
              {message ? <Text className="font-regular text-base leading-6 text-center text-light-muted dark:text-dark-muted mt-2">{message}</Text> : null}
            </View>
            {children}
            {actionError ? <Text accessibilityLiveRegion="assertive" className="font-regular text-sm leading-5 text-light-text dark:text-dark-text bg-light-danger/10 dark:bg-dark-danger/10 rounded-button p-3 mb-4">{actionError}</Text> : null}
            <View className={stackedActions ? "gap-3" : "flex-row gap-3"}>
              {actions.map((action, index) => (
                <AppButton key={`${index}-${action.text}`} label={action.text} uppercase={false} icon={action.icon}
                  className={stackedActions ? "min-h-[48px] rounded-button" : "flex-1 min-h-[48px] rounded-button"}
                  variant={action.style === "cancel" ? "outline" : "primary"}
                  disabled={busy || action.disabled} loading={busyIndex === index || (loading && action.style !== "cancel")}
                  onPress={() => void runAction(action, index)} />
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
