import { Body, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";

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
  return (
    <View className="flex-1 bg-light-background rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl">
      {back ? (
        <TouchableOpacity
          className="flex-row items-center justify-center mb-5 self-start "
          onPress={back.onPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft
            size={22}
            color={lightColors.primary}
            strokeWidth={2.5}
          />
          {back.label ? (
            <Body className="text-light-primary font-semibold ml-0.5">
              {back.label}
            </Body>
          ) : null}
        </TouchableOpacity>
      ) : null}

      {title ? (
        <Title className="text-light-accent text-3xl mb-6">{title}</Title>
      ) : null}

      {children}
    </View>
  );
}
