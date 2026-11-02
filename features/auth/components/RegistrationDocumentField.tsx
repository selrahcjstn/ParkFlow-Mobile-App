import { Image, Text, View } from 'react-native';
import { Camera, FileText, UploadCloud } from 'lucide-react-native';
import { AppButton } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  label: string;
  helperText: string;
  file: { name?: string | null; uri?: string } | null;
  onPick?: () => void;
  onCamera?: () => void;
  onRemove: () => void;
  disabled?: boolean;
};

export default function RegistrationDocumentField({
  label,
  helperText,
  file,
  onPick,
  onCamera,
  onRemove,
  disabled,
}: Props) {
  const { colors } = useAppTheme();

  return (
    <View className="gap-3 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4">
      <View className="flex-row items-center gap-2 flex-wrap">
        {onCamera && (
          <AppButton
            label={`${file ? 'Retake' : 'Use camera'}`}
            accessibilityLabel={`${file ? 'Retake' : 'Take photo of'} ${label} using camera`}
            variant="primary"
            uppercase={false}
            onPress={onCamera}
            disabled={disabled}
            icon={<Camera size={18} color="#FFFFFF" />}
            className="flex-1 min-w-[130px]"
          />
        )}
        {onPick && (
          <AppButton
            label={onCamera ? (file ? 'Replace file' : 'Upload file') : `${file ? 'Replace' : 'Upload'} ${label}`}
            accessibilityLabel={`${file ? 'Replace' : 'Upload'} ${label}`}
            variant="outline"
            uppercase={false}
            onPress={onPick}
            disabled={disabled}
            icon={<UploadCloud size={18} color={colors.primary} />}
            className={onCamera ? "flex-initial px-4" : "flex-1"}
          />
        )}
      </View>
      <Text className="text-sm text-light-muted dark:text-dark-muted">{helperText}</Text>
      {file && (
        <View className="flex-row items-center gap-3 p-2.5 rounded-xl bg-light-surfaceMuted dark:bg-dark-surfaceMuted border border-light-border dark:border-dark-border">
          {file.uri && !file.name?.toLowerCase().endsWith('.pdf') ? (
            <Image
              source={{ uri: file.uri }}
              style={{ width: 44, height: 44, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : (
            <FileText size={22} color={colors.primary} />
          )}
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-semibold text-light-text dark:text-dark-text" numberOfLines={1}>
              {file.name || label}
            </Text>
            <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Ready for review
            </Text>
          </View>
          <AppButton
            label="Remove"
            accessibilityLabel={`Remove ${label}`}
            variant="ghost"
            uppercase={false}
            size="sm"
            onPress={onRemove}
            disabled={disabled}
          />
        </View>
      )}
    </View>
  );
}
