# Application dialogs

`components/shared/AppDialog.tsx` is the only alert/confirmation renderer. It reuses the existing theme, Inter typography and shared `AppButton`, with safe-area padding, bounded scrollable content, 48px actions and fade/scale transitions.

`AlertModal` and the legacy `ConfirmModal` are compatibility facades, not separate implementations. Existing screen state, validation and callbacks are retained. Reservation review and cancellation use `AppDialog` directly.

For notices from hooks, effects or document sheets, use the queued root host:

```tsx
import { appDialog } from "@/services/app-dialog";

appDialog.show("Remove record?", "This action cannot be undone.", [
  { text: "Cancel", style: "cancel" },
  { text: "Delete", style: "destructive", onPress: () => deleteRecord() },
], { variant: "confirmation", cancelable: false });
```

Variants: `success`, `error`, `warning`, `info`, `confirmation`. Titles, messages, icons and action labels are customizable. A single notice defaults to an OK action; multiple actions default to confirmation. Existing native-alert replacements retain their original labels and actions.

Return the asynchronous operation from `onPress` so the dialog can display loading, block repeat taps and prevent Back/backdrop dismissal. Rejected actions show an inline error and stay available for retry. Existing handled API errors and navigation remain the responsibility of their original handlers. Controlled actions can set `closeOnPress: false` when those handlers own dialog visibility or validation.

Queued dialogs are non-dismissible by default, matching the replaced Android alerts. `cancelable: true` allows hardware Back/backdrop dismissal and calls `onDismiss`, without executing a confirmation action. Explicit Cancel actions still work. All dialogs block dismissal during an action; destructive controlled dialogs default to non-dismissible.

Native permission prompts, file pickers, time pickers and system share sheets are OS workflows, not application alerts, and are intentionally unchanged. Full-screen detail/form modals are also outside this refactor.

## Verification

`node --test tests/app-dialog.test.mjs` covers variants, customization, sizing, Back/backdrop behavior, cancellation, destructive styles, async retry/duplicate taps, queued transitions, legacy callbacks, document validation, verification access checks, reservations, manual fee consent, update/restart and account-status actions. `node --test tests/*.test.mjs` runs the full mobile regression suite.

Device QA still needs a rebuilt Android app: check light/dark modes, small phones/landscape, large font settings, TalkBack, Back while an operation is pending, reservation review/cancellation, logout, document-size errors (including from Edit Vehicle), manual fee consent, update notices and account-status notices. Do not use production destructive actions or real payments for UI testing.
