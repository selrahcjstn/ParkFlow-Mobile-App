import { Text, View } from 'react-native';
import { FileText, UploadCloud } from 'lucide-react-native';
import { AppButton } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = { label: string; helperText: string; file: { name?: string | null } | null;
  onPick: () => void; onRemove: () => void; disabled?: boolean };
export default function RegistrationDocumentField({ label, helperText, file, onPick, onRemove, disabled }: Props) {
  const { colors } = useAppTheme();
  return <View className="gap-3 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4">
    <AppButton label={`${file ? 'Replace' : 'Upload'} ${label}`} variant="outline" uppercase={false} onPress={onPick}
      disabled={disabled} icon={<UploadCloud size={18} color={colors.primary} />} />
    <Text className="text-sm text-light-muted dark:text-dark-muted">{helperText}</Text>
    {file && <View className="flex-row items-center gap-2">
      <FileText size={18} color={colors.primary} />
      <Text className="flex-1 text-sm text-light-text dark:text-dark-text" numberOfLines={2}>{file.name || label}</Text>
      <AppButton label="Remove" accessibilityLabel={`Remove ${label}`} variant="ghost" uppercase={false} size="sm" onPress={onRemove} disabled={disabled} />
    </View>}
  </View>;
}
