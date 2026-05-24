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
        <Pressable className="w-full bg-light-surface rounded-3xl px-6 pt-8 pb-6 items-center shadow-2xl border border-light-border">
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

          <Text className="font-regular text-base leading-6 text-light-muted text-center mt-2 px-2">
            {message}
          </Text>

          {showCancel ? (
            <View className="flex-row gap-3 mt-6 w-full">
              <TouchableOpacity
                className="flex-1 bg-light-background border border-light-border rounded-full py-3 items-center"
                activeOpacity={0.85}
                onPress={onClose}
              >
                <Text className="font-bold text-base leading-6 text-light-text tracking-wider text-center">
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
