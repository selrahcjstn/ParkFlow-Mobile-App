import type { ReactNode } from "react";
import AppDialog from "./AppDialog";
import type { DialogVariant } from "@/services/app-dialog";

interface AlertModalProps {
  visible: boolean;
  onClose: () => void | Promise<unknown>;
  title?: string;
  message: string;
  variant?: DialogVariant;
  icon?: ReactNode;
  buttonLabel?: string;
  showCancel?: boolean;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<unknown>;
  loading?: boolean;
  dismissible?: boolean;
  destructive?: boolean;
}

// Compatibility facade: existing screen state and callbacks stay unchanged.
// Presentation, animations and action handling live only in AppDialog.
export default function AlertModal({ visible, onClose, title, message, variant = "error", icon,
  buttonLabel = "OK", showCancel = false, cancelLabel = "Cancel", onConfirm, loading,
  destructive = showCancel && variant === "error", dismissible = !destructive,
}: AlertModalProps) {
  return <AppDialog visible={visible} onClose={onClose} title={title} message={message}
    variant={variant} icon={icon} loading={loading} dismissible={dismissible}
    actions={[
      ...(showCancel ? [{ text: cancelLabel, style: "cancel" as const, onPress: onClose, closeOnPress: false }] : []),
      { text: buttonLabel, style: destructive ? "destructive" : "default",
        onPress: showCancel ? onConfirm ?? onClose : onClose, closeOnPress: false },
    ]} />;
}
