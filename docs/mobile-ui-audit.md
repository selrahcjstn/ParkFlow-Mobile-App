# Mobile security controls and theme audit

Date: 2026-10-11. Scope: the Expo mobile application only. Findings below are based on source inspection and automated tests, not authenticated device testing.

## Requested changes implemented

- Removed the local-only Two-Factor Authentication and Biometric Identity Verification switches from Account Center. Change Password and its callback remain intact. These switches had no authentication or persistence implementation to remove.
- Standardized ordinary filled actions on the existing primary theme, outlined/text actions on primary accents, and selected controls on primary colors. Kept destructive actions and success/warning/error indicators semantically distinct.
- Replaced legacy bright-red/blue action utilities and obsolete hardcoded maroon variants across registration, scheduling, QR, account, history, sessions, and guard screens. Existing layouts, API calls, validation, and navigation handlers are preserved.
- Reused existing theme colors for notification switches, accents, announcement surfaces, icons, loading indicators, and light/dark states. Retained intentional black/white QR rendering, backdrops, and third-party logo colors.
- Made `constants/colors.ts` use the existing Tailwind dark `surfaceLighter` value so JS styles and NativeWind utilities agree. No palette, font, dependency, or separate design system was added.
- Kept light-only onboarding inputs/buttons on light tokens even when the device theme is dark. Filled button labels and loading indicators use contrasting foregrounds.

## Other issues reported, not fixed

### 1. High: history lists violate React's hook ordering

`features/history/components/HistoryParkingSection.tsx` returns early at the loading branch before declaring several `useCallback`/`useMemo` hooks. `features/history/components/HistoryPaymentSection.tsx` has the same pattern. Moving from an empty loading state to populated data changes the number of hooks executed; this can produce a “Rendered more hooks than during the previous render” error. ESLint independently flags both files. These loading/control-flow branches were left unchanged.

### 2. Medium: notification preferences do not persist or affect delivery

`features/account/components/notification/NotificationPreferences.tsx` initializes seven switches with local `useState` and directly invokes their setters. There is no storage, API update, or connection to notification delivery in this component. Switching a preference gives the appearance of saving it, but remounting restores the defaults. Only their styling was changed.

### 3. Medium: “Try again” only dismisses the connection screen

`components/shared/NetworkErrorScreen.tsx` uses the same `dismiss` callback for “Try again” and “Dismiss.” That callback only calls `clearNetworkError()`; it does not replay a request or check connectivity. The failed screen may therefore remain stale until the user refreshes it or another existing fetch occurs. The action was not rewritten.

### 4. Medium: verified-page QR download is a placeholder

`features/auth/pages/VerifiedPage.tsx` exports the fixed string `PARKFLOW-ACCOUNT-ACCESS-PASS` rather than a server-issued user/vehicle QR hash. This downloaded image is not the actual vehicle parking pass. Its existing download behavior was left unchanged.

### 5. Low: history shows an invented timestamp when the API supplies none

`features/history/components/HistoryHeader.tsx` falls back to `2026-05-23T12:51:11.470Z`. This can make the “As of” label look authoritative even when no generation time was received. The fallback was not changed.

### Needs device verification: schedule shortcuts

Two shortcuts in `features/user/components/QRCodeDisplay.tsx` navigate to `/(tabs)/schedule`, while the actual screen is nested under `app/(users)/(tabs)/schedule.tsx`. Because both guard and user layouts contain `(tabs)` groups, verify Expo Router's shorthand resolution in the installed build. This is a potential ambiguity, not a reproduced navigation failure; no route was changed.

## Verification and limits

- 215 automated tests pass, including removal of unsupported security controls, unchanged password-reset action, all shared button variants in light/dark themes, forced-light onboarding, notification styling, and agreement between Tailwind/runtime tokens.
- TypeScript `npx tsc --noEmit` passes.
- Existing JSX event handlers were compared with Git HEAD; no handler differences were found outside the intentionally removed security switches.
- ESLint comparison on the changed application files found no new errors or warnings. Existing errors (including history hook-order problems, ref access during render, and synchronous state effects) remain; this is not a claim that the repository-wide lint suite passes.
- No connected Android device was available. Native appearance, keyboard behavior, large text, and rotation still need validation on a rebuilt application.
- No backend/admin code, migrations, API contracts, fees, or payment workflows were changed in this mobile task. Changes have not been pushed or deployed.
