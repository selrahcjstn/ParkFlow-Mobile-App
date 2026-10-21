import { Text, View } from 'react-native';
import { FileText, UploadCloud } from 'lucide-react-native';
import { AppButton, AppInput } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { themeColors } from '@/constants/colors';
import type { useCorScan } from '../hooks/useCorScan';
import { mapCorSection, mapCorSemester, weeklyPreview } from '../utils/corStudentMapping';
import CorWeeklySchedulePreview from './CorWeeklySchedulePreview';

type Props = { scan: ReturnType<typeof useCorScan>; disabled?: boolean };
export default function CorUploadStep({ scan, disabled }: Props) {
  const { colors } = useAppTheme();
  const uploaded = !!scan.documentUrl;
  const rejectedInformation = scan.preview?.status === 'Rejected' ? scan.preview.studentInformation : null;
  return <View className="gap-4 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4">
    <Text className="text-base font-bold text-light-text dark:text-dark-text">1. Upload your COR</Text>
    <Text className="text-sm text-light-muted dark:text-dark-muted">Choose a PDF, JPG or PNG up to 5MB. After uploading, tap Fetch Information to read your details and class schedule.</Text>
    {scan.preview?.currentAcademicYear && scan.preview.currentSemester &&
      <Text className="text-sm text-light-muted dark:text-dark-muted">Current term: {scan.preview.currentSemester} - {scan.preview.currentAcademicYear}</Text>}
    <AppButton label={uploaded ? 'Replace COR' : 'Upload COR'} variant={uploaded ? 'outline' : 'primary'}
      icon={<UploadCloud size={18} color={uploaded ? colors.primary : themeColors.light.surface} />} onPress={scan.upload}
      loading={scan.uploading} disabled={scan.busy || disabled} />
    {scan.uploading && <Text accessibilityLiveRegion="polite" className="text-sm text-light-muted dark:text-dark-muted">Uploading the file. Information will be fetched separately.</Text>}
    {uploaded && <View className="flex-row items-center gap-2">
      <FileText size={18} color={colors.primary} />
      <Text className="flex-1 text-sm text-light-text dark:text-dark-text" numberOfLines={2}>{scan.fileName || 'COR uploaded successfully'}</Text>
    </View>}
    {uploaded && !scan.preview?.canConfirm && scan.preview?.status !== 'Rejected' && <>
      <Text className="text-base font-bold text-light-text dark:text-dark-text">2. Fetch information</Text>
      {(!scan.preview?.fetchRequested || scan.preview.status === 'NeedsReview') && <AppButton label="Fetch Information" onPress={scan.fetchInformation}
        loading={scan.fetching} disabled={scan.busy || disabled || !scan.preview} />}
      {scan.processing && <Text accessibilityLiveRegion="polite" className="text-sm text-light-muted dark:text-dark-muted">Reading your COR in the background. Your upload is saved; the information will appear here when ready.</Text>}
    </>}
    {scan.preview?.status === 'Rejected' && <View className="gap-2 rounded-lg border border-light-border dark:border-dark-border p-3">
      <Text accessibilityRole="alert" className="font-bold text-light-danger dark:text-dark-danger">COR rejected</Text>
      {scan.preview.issues.map(issue => <Text key={issue} className="text-sm text-light-text dark:text-dark-text">{issue}</Text>)}
      <Text className="text-sm text-light-muted dark:text-dark-muted">Upload a COR for the current school year and semester.</Text>
    </View>}
    {rejectedInformation && <View className="gap-2">
      <Text className="text-base font-bold text-light-text dark:text-dark-text">Extracted COR information</Text>
      <Text className="text-sm text-light-muted dark:text-dark-muted">These details are read-only. Replace your COR to correct the rejected information.</Text>
      {[
        ['Printed Name', rejectedInformation.fullName],
        ['First Name', rejectedInformation.firstName],
        ['Middle Name (Optional)', rejectedInformation.middleName],
        ['Last Name', rejectedInformation.lastName],
        ['Student Number', rejectedInformation.studentNumber],
        ['College (if shown on COR)', rejectedInformation.college],
        ['Grade / Year Level', rejectedInformation.yearLevel ? String(rejectedInformation.yearLevel) : null],
        ['Course / Program', rejectedInformation.course],
        ['Section', mapCorSection(rejectedInformation.section)],
        ['School Year', rejectedInformation.academicYear],
        ['Semester', mapCorSemester(rejectedInformation.semester) || rejectedInformation.semester],
      ].map(([label, value]) => <AppInput key={label} label={label!} value={value || ''}
        placeholder="Not read from COR" editable={false} selectTextOnFocus={false} />)}
    </View>}
    {scan.preview?.status === 'Rejected' && (!!scan.preview.week?.length || !!scan.preview.items.length) && <View className="gap-2">
      <Text className="text-base font-bold text-light-text dark:text-dark-text">Weekly schedule from your COR</Text>
      <CorWeeklySchedulePreview week={weeklyPreview(scan.preview)} />
    </View>}
    {scan.preview?.status !== 'Rejected' && scan.preview?.issues.map(issue =>
      <Text key={issue} accessibilityRole="alert" className="text-sm text-light-danger dark:text-dark-danger">{issue}</Text>)}
    {scan.error && !scan.preview?.issues.includes(scan.error) && scan.error !== scan.preview?.issues.join(' ')
      ? <Text accessibilityRole="alert" className="text-sm text-light-danger dark:text-dark-danger">{scan.error}</Text> : null}
    {uploaded && <AppButton label="Refresh status" variant="ghost" size="sm" onPress={scan.refresh} disabled={scan.busy || disabled} />}
  </View>;
}
