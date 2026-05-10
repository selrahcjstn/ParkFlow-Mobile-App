import { Text, TouchableOpacity, View } from "react-native";
import type { ReactNode } from "react";

interface BackLink {
  label: string;
  onPress: () => void;
}

interface FormCardProps {
  title?: string;
  /** Optional back navigation link shown above the title */
  back?: BackLink;
  children: ReactNode;
}

/**
 * The rounded white panel that sits below the AuthHeader on auth screens.
 * Pass `back` to show a "← Back" link above the title — handy for multi-step flows.
 */
export default function FormCard({ title, back, children }: FormCardProps) {
  return (
    <View className="flex-1 bg-stone-100 rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl">
      {/* Back link sits above the title when provided */}
      {back && (
        <TouchableOpacity
          className="flex-row items-center mb-3 self-start"
          onPress={back.onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-light-accent text-sm font-semibold">
            {"< "}{back.label}
          </Text>
        </TouchableOpacity>
      )}

      {title && (
        <Text className="text-light-accent text-3xl font-extrabold mb-6">
          {title}
        </Text>
      )}

      {children}
    </View>
  );
}
