import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface BackLink {
  label?: string;
  onPress: () => void;
}

interface FormCardProps {
  title?: string;
  back?: BackLink;
  children: ReactNode;
}

export default function FormCard({ title, back, children }: FormCardProps) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 bg-light-surface dark:bg-dark-surface rounded-t-3xl px-6 pt-6 pb-10 shadow-sm">
      {back ? (
        <TouchableOpacity
          className="flex-row items-center justify-center mb-5 self-start"
          onPress={back.onPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
          {back.label ? (
            <Text className="text-light-primary dark:text-dark-primary font-bold ml-0.5 text-base leading-6">
              {back.label}
            </Text>
          ) : null}
        </TouchableOpacity>
      ) : null}

      {title ? (
        <Text className="font-bold text-light-text dark:text-dark-text text-2xl mb-5">{title}</Text>
      ) : null}

      {children}
    </View>
  );
}

