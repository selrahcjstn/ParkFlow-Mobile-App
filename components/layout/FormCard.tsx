import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface BackLink {
  label: string;
  onPress: () => void;
}

interface FormCardProps {
  title?: string;
  back?: BackLink;
  children: ReactNode;
}

export default function FormCard({ title, back, children }: FormCardProps) {
  return (
    <View className="flex-1 bg-stone-100 rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl">
      {/* Back link with a proper chevron icon */}
      {back && (
        <TouchableOpacity
          className="flex-row items-center mb-3 self-start"
          onPress={back.onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={16} color="#1E3A5F" strokeWidth={2.5} />
          <Text className="text-light-accent text-sm font-semibold">
            {back.label}
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
