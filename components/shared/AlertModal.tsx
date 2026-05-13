import type { ReactNode } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type AlertVariant = "error" | "warning" | "success" | "info";

interface AlertModalProps {
  /** Controls visibility */
  visible: boolean;
  /** Called when the user dismisses the modal */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Body message */
  message: string;
  /** Visual variant — drives colour theming */
  variant?: AlertVariant;
  /** Custom icon rendered above the title */
  icon?: ReactNode;
  /** Label for the dismiss button */
  buttonLabel?: string;
}

/* Colour tokens per variant (mapped to tailwind.config colours) */
const variantStyles: Record<
  AlertVariant,
  { iconBg: string; iconRing: string; titleColor: string; btnBg: string }
> = {
  error: {
    iconBg: "bg-red-100",
    iconRing: "bg-red-50",
    titleColor: "text-light-danger",
    btnBg: "bg-light-danger",
  },
  warning: {
    iconBg: "bg-amber-100",
    iconRing: "bg-amber-50",
    titleColor: "text-light-warning",
    btnBg: "bg-light-warning",
  },
  success: {
    iconBg: "bg-emerald-100",
    iconRing: "bg-emerald-50",
    titleColor: "text-light-success",
    btnBg: "bg-light-success",
  },
  info: {
    iconBg: "bg-blue-100",
    iconRing: "bg-blue-50",
    titleColor: "text-light-accent",
    btnBg: "bg-light-accent",
  },
};

/**
 * A modern, centred alert modal.
 * Displays an optional icon, a title, a message, and a dismiss button.
 * Reusable across any screen that needs to show a popup notification.
 */
export default function AlertModal({
  visible,
  onClose,
  title,
  message,
  variant = "error",
  icon,
  buttonLabel = "OK",
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
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-8"
        onPress={onClose}
      >
        {/* Card — stop propagation so tapping the card doesn't close */}
        <Pressable className="w-full bg-white rounded-3xl px-6 pt-8 pb-6 items-center shadow-2xl border border-light-border">
          {/* Icon ring */}
          {icon && (
            <View
              className={`w-20 h-20 rounded-full ${styles.iconRing} items-center justify-center mb-1`}
            >
              <View
                className={`w-14 h-14 rounded-full ${styles.iconBg} items-center justify-center`}
              >
                {icon}
              </View>
            </View>
          )}

          {/* Title */}
          {title && (
            <Text
              className={`${styles.titleColor} text-xl font-extrabold text-center mt-3`}
            >
              {title}
            </Text>
          )}

          {/* Message */}
          <Text className="text-light-muted text-sm text-center mt-2 leading-5 px-2">
            {message}
          </Text>

          {/* Dismiss button */}
          <TouchableOpacity
            className={`${styles.btnBg} rounded-full mt-6 py-3 w-full items-center shadow-sm`}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Text
              className="text-white text-sm font-extrabold tracking-wider text-center"
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
