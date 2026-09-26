import type { ReactNode } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type AlertVariant = "error" | "warning" | "success" | "info";

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  variant?: AlertVariant;
  icon?: ReactNode;
  buttonLabel?: string;
  showCancel?: boolean;
  cancelLabel?: string;
  onConfirm?: () => void;
}

const variantStyles: Record<
  AlertVariant,
  { iconBg: string; iconRing: string; titleColor: string; btnBg: string }
> = {
  error: {
    iconBg: "bg-light-danger/10 dark:bg-dark-danger/20",
    iconRing: "bg-light-danger/5 dark:bg-dark-danger/10",
    titleColor: "text-light-danger dark:text-dark-danger",
    btnBg: "bg-light-danger dark:bg-dark-danger",
  },
  warning: {
    iconBg: "bg-light-warning/10 dark:bg-dark-warning/20",
    iconRing: "bg-light-warning/5 dark:bg-dark-warning/10",
    titleColor: "text-light-warning dark:text-dark-warning",
    btnBg: "bg-light-warning dark:bg-dark-warning",
  },
  success: {
    iconBg: "bg-light-success/10 dark:bg-dark-success/20",
    iconRing: "bg-light-success/5 dark:bg-dark-success/10",
    titleColor: "text-light-success dark:text-dark-success",
    btnBg: "bg-light-success dark:bg-dark-success",
  },
  info: {
    iconBg: "bg-light-accent/10 dark:bg-dark-accent/20",
    iconRing: "bg-light-accent/5 dark:bg-dark-accent/10",
    titleColor: "text-light-accent dark:text-dark-accent",
    btnBg: "bg-light-accent dark:bg-dark-accent",
  },
};

export default function AlertModal({
  visible,
  onClose,
  title,
  message,
  variant = "error",
  icon,
  buttonLabel = "OK",
  showCancel = false,
  cancelLabel = "Cancel",
  onConfirm,
}: AlertModalProps) {
  const styles = variantStyles[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-8"
        onPress={onClose}
      >
        <Pressable className="w-full bg-light-surface dark:bg-dark-surface rounded-3xl px-6 pt-8 pb-6 items-center shadow-2xl border border-light-border dark:border-dark-border">
          {icon ? (
            <View
              className={`w-20 h-20 rounded-full ${styles.iconRing} items-center justify-center mb-1`}
            >
              <View
                className={`w-14 h-14 rounded-full ${styles.iconBg} items-center justify-center`}
              >
                {icon}
              </View>
            </View>
          ) : null}

          {title ? (
            <Text className={`font-black text-2xl leading-8 ${styles.titleColor} text-center mt-3`}>
              {title}
            </Text>
          ) : null}

          <Text className="font-regular text-base leading-6 text-light-muted dark:text-dark-muted text-center mt-2 px-2">
            {message}
          </Text>

          {showCancel ? (
            <View className="flex-row gap-3 mt-6 w-full">
              <TouchableOpacity
                className="flex-1 bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-full py-3 items-center"
                activeOpacity={0.85}
                onPress={onClose}
              >
                <Text className="font-bold text-base leading-6 text-light-text dark:text-dark-text tracking-wider text-center">
                  {cancelLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 ${styles.btnBg} rounded-full py-3 items-center shadow-sm`}
                activeOpacity={0.85}
                onPress={onConfirm ?? onClose}
              >
                <Text
                  className="font-bold text-base leading-6 text-white tracking-wider text-center"
                  numberOfLines={1}
                >
                  {buttonLabel}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className={`${styles.btnBg} rounded-full mt-6 py-3 w-full items-center shadow-sm`}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <Text
                className="font-bold text-base leading-6 text-white tracking-wider text-center"
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                {buttonLabel}
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
