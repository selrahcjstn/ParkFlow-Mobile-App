import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton, AppInput } from '@/components/ui';
import { verificationService, type CorSchedulePreview } from '../services/verification.service';

type Props = { preview: CorSchedulePreview; busy: boolean; runAction: (action: () => Promise<void>) => unknown; refresh: () => Promise<unknown> | unknown };
export default function CorScheduleReviewRequest({ preview, busy, runAction, refresh }: Props) {
  const [reason, setReason] = useState('');
  return <View className="gap-3">
    <Text className="text-light-muted dark:text-dark-muted">Schedules are read-only. If a time or day is incorrect, request an admin review of your COR.</Text>
    {preview.scheduleReviewRequested ? <Text accessibilityRole="alert" className="text-light-text dark:text-dark-text">Admin review requested. Refresh the scan status after the admin checks your COR.</Text> : <>
      <AppInput label="Describe the schedule issue" value={reason} maxLength={1000} onChangeText={setReason} editable={!busy} />
      <AppButton label="Request admin schedule review" variant="outline" disabled={busy || !reason.trim()} onPress={() => runAction(async () => {
        await verificationService.requestCorScheduleReview(preview, reason.trim()); await refresh(); setReason('');
      })} />
    </>}
  </View>;
}
