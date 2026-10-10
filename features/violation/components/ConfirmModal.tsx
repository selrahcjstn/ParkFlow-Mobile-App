import AppDialog from "@/components/shared/AppDialog";

interface ConfirmModalProps {
  visible: boolean;
  method: "guard" | null;
  amount: number;
  onCancel: () => void;
  onConfirm: () => void | Promise<unknown>;
}

// Retain the existing flow interface without a second dialog implementation.
export default function ConfirmModal({ visible, method, amount, onCancel, onConfirm }: ConfirmModalProps) {
  return <AppDialog visible={visible} title="Confirm Payment" variant="confirmation" dismissible={false}
    message={`Are you settling ₱${amount.toFixed(2)} directly via ${method === "guard" ? "Pay to Guard" : ""}?`}
    onClose={onCancel} actions={[
      { text: "Cancel", style: "cancel", onPress: onCancel, closeOnPress: false },
      { text: "Confirm", onPress: onConfirm, closeOnPress: false },
    ]} />;
}
