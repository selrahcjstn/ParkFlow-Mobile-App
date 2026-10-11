import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { appDialog, type DialogOptions } from "@/services/app-dialog";

/** Review an action once, before invoking the existing operation. */
export function useActionConfirmation() {
  const openRef = useRef(false);
  const focusRef = useRef(0);
  const activeRef = useRef(false);

  useFocusEffect(useCallback(() => {
    activeRef.current = true;
    ++focusRef.current;
    return () => { activeRef.current = false; };
  }, []));

  return useCallback((
    title: string,
    message: string,
    action: () => void | Promise<unknown>,
    options: DialogOptions & { confirmLabel?: string; destructive?: boolean } = {},
  ) => {
    if (openRef.current || !activeRef.current) return;
    openRef.current = true;
    const focus = focusRef.current;
    let running = false;
    let finished = false;
    const release = () => { openRef.current = false; finished = true; };
    const { confirmLabel = "Confirm", destructive = false, ...dialogOptions } = options;

    appDialog.show(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => { release(); dialogOptions.onDismiss?.(); } },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: async () => {
          if (running || finished) return;
          if (!activeRef.current || focus !== focusRef.current) { release(); return; }
          running = true;
          try {
            await action();
            release();
          } finally {
            // A rejected action stays in the shared dialog for a deliberate retry.
            running = false;
          }
        },
      },
    ], {
      cancelable: !destructive,
      ...dialogOptions,
      variant: dialogOptions.variant ?? "confirmation",
      onDismiss: () => { release(); dialogOptions.onDismiss?.(); },
    });
  }, []);
}
