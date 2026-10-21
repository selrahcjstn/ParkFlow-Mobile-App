import React from 'react';
import { Text, View } from 'react-native';
import AppButton from '@/components/ui/AppButton';
import { verificationService } from '../services/verification.service';
import { useCorScan } from '../hooks/useCorScan';
import { weeklyPreview } from '../utils/corStudentMapping';
import CorUploadStep from './CorUploadStep';
import CorWeeklySchedulePreview from './CorWeeklySchedulePreview';

type Props = { onConfirmed: (documentUrl: string) => void | Promise<void>; disabled?: boolean; confirmLabel?: string };
export default function CorScheduleStep({ onConfirmed, disabled, confirmLabel = 'Confirm schedule and continue' }: Props) {
  const scan = useCorScan();
  return <View className="gap-4">
    <Text className="text-light-text dark:text-dark-text text-lg font-bold">Schedule from your COR</Text>
    <CorUploadStep scan={scan} disabled={disabled} />
    {scan.preview?.canConfirm && <View className="gap-3"><CorWeeklySchedulePreview week={weeklyPreview(scan.preview)} /><Text className="text-light-muted dark:text-dark-muted">Schedules do not require admin approval. Upload a clearer COR if the extraction is incorrect.</Text></View>}
    {scan.preview?.canConfirm && <AppButton label={confirmLabel} loading={scan.confirming} disabled={scan.busy || disabled || !scan.preview.canConfirmSchedule} onPress={() => scan.runAction(async () => {
      await scan.validateCurrentTerm();
      await verificationService.confirmCorSchedule(scan.preview!); await onConfirmed(scan.preview!.documentUrl);
    })} />}
  </View>;
}
