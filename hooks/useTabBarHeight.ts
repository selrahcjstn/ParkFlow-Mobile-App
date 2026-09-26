import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Returns the height of the bottom tab bar including safe area insets,
 * eliminating the need for direct @react-navigation/bottom-tabs imports.
 */
export function useTabBarHeight(defaultHeight: number = 64): number {
  const insets = useSafeAreaInsets();
  return defaultHeight + (insets.bottom || 0);
}
