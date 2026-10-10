import { useDialogStore } from "@/services/app-dialog";
import AppDialog from "./AppDialog";

export default function DialogHost() {
  const dialog = useDialogStore(state => state.queue[0]);
  if (!dialog) return null;
  return <AppDialog key={dialog.id} visible={dialog.visible} title={dialog.title} message={dialog.message}
    variant={dialog.options.variant} icon={dialog.options.icon} actions={dialog.actions}
    dismissible={dialog.options.cancelable ?? false} onDismiss={dialog.options.onDismiss}
    onClose={() => useDialogStore.getState().hide(dialog.id)}
    onClosed={() => useDialogStore.getState().finish(dialog.id)} />;
}
