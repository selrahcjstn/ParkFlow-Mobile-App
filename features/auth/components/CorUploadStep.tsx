import { Text, View } from 'react-native';
import { FileText, UploadCloud } from 'lucide-react-native';
import { AppButton } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { themeColors } from '@/constants/colors';
import type { useCorScan } from '../hooks/useCorScan';

type Props = { scan: ReturnType<typeof useCorScan>; disabled?: boolean };
export default function CorUploadStep({ scan, disabled }: Props) {
  const { colors } = useAppTheme();
  const uploaded = !!scan.documentUrl;
  return <View className="gap-4 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4">
    <Text className="text-base font-bold text-light-text dark:text-dark-text">1. Upload your COR</Text>
    <Text className="text-sm text-light-muted dark:text-dark-muted">Choose a PDF, JPG or PNG up to 5MB. After uploading, tap Fetch Information to read your details and class schedule.</Text>
    <AppButton label={uploaded ? 'Replace COR' : 'Upload COR'} variant={uploaded ? 'outline' : 'primary'}
      icon={<UploadCloud size={18} color={uploaded ? colors.primary : themeColors.light.surface} />} onPress={scan.upload}
      loading={scan.uploading} disabled={scan.busy || disabled} />
    {scan.uploading && <Text accessibilityLiveRegion="polite" className="text-sm text-light-muted dark:text-dark-muted">Uploading the file. Information will be fetched separately.</Text>}
    {uploaded && <View className="flex-row items-center gap-2">
      <FileText size={18} color={colors.primary} />
      <Text className="flex-1 text-sm text-light-text dark:text-dark-text" numberOfLines={2}>{scan.fileName || 'COR uploaded successfully'}</Text>
    </View>}
    {uploaded && !scan.preview?.canConfirm && <>
      <Text className="text-base font-bold text-light-text dark:text-dark-text">2. Fetch information</Text>
      {!scan.preview?.fetchRequested && <AppButton label="Fetch Information" onPress={scan.fetchInformation}
        loading={scan.fetching} disabled={scan.busy || disabled || !scan.preview} />}
      {scan.processing && <Text accessibilityLiveRegion="polite" className="text-sm text-light-muted dark:text-dark-muted">Reading your COR in the background. Your upload is saved; the information will appear here when ready.</Text>}
    </>}
    {scan.error ? <Text accessibilityRole="alert" className="text-sm text-light-danger dark:text-dark-danger">{scan.error}</Text> : null}
    {uploaded && <AppButton label="Refresh status" variant="ghost" size="sm" onPress={scan.refresh} disabled={scan.busy || disabled} />}
  </View>;
}
