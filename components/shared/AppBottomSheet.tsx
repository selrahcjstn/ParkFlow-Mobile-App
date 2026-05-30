import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useMemo, type ReactNode } from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface AppBottomSheetProps {
  title?: string;
  subtitle?: string;
  snapPoints?: (string | number)[];
  children: ReactNode;
  onDismiss?: () => void;
  scrollable?: boolean;
  headerRight?: ReactNode;
}

const AppBottomSheet = forwardRef<BottomSheetModal, AppBottomSheetProps>(
  function AppBottomSheet(
    {
      title,
      subtitle,
      snapPoints: snapPointsProp,
      children,
      onDismiss,
      scrollable = true,
      headerRight,
    },
    ref,
  ) {
    const { isDark } = useAppTheme();
    const snapPoints = useMemo(
      () => snapPointsProp ?? ["55%", "80%"],
      [snapPointsProp],
    );

    const hasHeader = Boolean(title);

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        onDismiss={onDismiss}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#374151" : "#D4D4D8",
          width: 36,
        }}
        backgroundStyle={{
          backgroundColor: isDark ? "#18181B" : "#F4F4F5",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior="close"
            opacity={isDark ? 0.25 : 0.4}
          />
        )}
      >
        {hasHeader && (
          <View className="px-5 pt-1 pb-4 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-light-text dark:text-dark-text font-black text-[18px]">
                {title}
              </Text>
              {subtitle && (
                <Text className="text-light-muted dark:text-dark-muted font-light text-[13px] mt-0.5">
                  {subtitle}
                </Text>
              )}
            </View>
            {headerRight && <View>{headerRight}</View>}
          </View>
        )}

        {scrollable ? (
          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 40,
            }}
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          children
        )}
      </BottomSheetModal>
    );
  },
);

export default AppBottomSheet;
