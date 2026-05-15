import { lightColors } from "@/constants/theme";
import { Body, Title } from "@/components/ui/Typography";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";

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
    <View className="flex-1 bg-light-background rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl">
      {back ? (
        <TouchableOpacity
          className="flex-row items-center mb-3 self-start"
          onPress={back.onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={16} color={lightColors.accent} strokeWidth={2.5} />
          <Body className="text-light-accent font-semibold ml-0.5">
            {back.label}
          </Body>
        </TouchableOpacity>
      ) : null}

      {title ? (
        <Title className="text-light-accent text-3xl mb-6">{title}</Title>
      ) : null}

      {children}
    </View>
  );
}
