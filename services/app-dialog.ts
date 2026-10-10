import type { ReactNode } from "react";
import { create } from "zustand";

export type DialogVariant = "success" | "error" | "warning" | "info" | "confirmation";
export interface DialogAction {
  text: string;
  onPress?: () => void | Promise<unknown>;
  style?: "default" | "cancel" | "destructive";
  icon?: ReactNode;
  disabled?: boolean;
  // Controlled screens may close their dialog or keep it open for validation.
  closeOnPress?: boolean;
}
export interface DialogOptions {
  variant?: DialogVariant;
  icon?: ReactNode;
  cancelable?: boolean;
  onDismiss?: () => void;
}
interface QueuedDialog {
  id: number;
  visible: boolean;
  title: string;
  message: string;
  actions: DialogAction[];
  options: DialogOptions;
}
interface DialogState {
  queue: QueuedDialog[];
  enqueue: (dialog: QueuedDialog) => void;
  hide: (id: number) => void;
  finish: (id: number) => void;
}

export const useDialogStore = create<DialogState>(set => ({
  queue: [],
  enqueue: dialog => set(state => ({ queue: [...state.queue, dialog] })),
  hide: id => set(state => ({ queue: state.queue.map(item => item.id === id ? { ...item, visible: false } : item) })),
  finish: id => set(state => ({ queue: state.queue.filter(item => item.id !== id) })),
}));

let nextId = 0;
// Works from effects, hooks and document sheets without per-screen modal state.
export const appDialog = {
  show(title: string, message = "", actions?: DialogAction[], options: DialogOptions = {}) {
    const buttons = actions?.length ? actions : [{ text: "OK" }];
    useDialogStore.getState().enqueue({
      id: ++nextId, visible: true, title, message, actions: buttons,
      options: { ...options, variant: options.variant ?? (buttons.length > 1 ? "confirmation" : "info") },
    });
  },
};
