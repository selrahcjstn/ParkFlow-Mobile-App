import { Text, View } from "react-native";
import { User } from "lucide-react-native";

interface UserProfileCardProps {
  /** User's full name */
  name: string;
  /** User's phone number or ID */
  phone: string;
}

/**
 * Displays user identity info (avatar placeholder, name, phone)
 * at the top of the dashboard beneath the header.
 */
export default function UserProfileCard({ name, phone }: UserProfileCardProps) {
  return (
    <View className="flex-row items-center gap-4 px-5 py-4">
      {/* Avatar placeholder */}
      <View className="w-12 h-12 rounded-full bg-light-border items-center justify-center">
        <User size={24} color="#475569" strokeWidth={1.8} />
      </View>

      {/* Name & phone */}
      <View>
        <Text className="text-light-text text-base font-bold">{name}</Text>
        <Text className="text-light-muted text-sm font-medium">{phone}</Text>
      </View>
    </View>
  );
}
