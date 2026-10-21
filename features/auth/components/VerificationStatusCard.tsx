import { useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { registerVerificationStatusListener } from '@/services/signalr';
import { verificationService } from '../services/verification.service';

const labels = { Pending: 'Waiting for verification', Processing: 'Processing document', PreVerified: 'Pre-verified · Admin review pending',
  Approved: 'Approved', NeedsReview: 'Needs review', Rejected: 'Rejected' };

export default function VerificationStatusCard() {
  const client = useQueryClient();
  const { data, isError, refetch } = useQuery({ queryKey: ['verification'], queryFn: verificationService.getMine,
    refetchInterval: (query) => query.state.data?.some(r => r.status === 'Pending' || r.status === 'Processing') ? 5000 : false,
    staleTime: 5000 });
  useEffect(() => registerVerificationStatusListener(() => { void client.invalidateQueries({ queryKey: ['verification'] }); }), [client]);
  if (!isError && !data?.length) return null;
  return <View className="rounded-2xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4 my-3">
    <Text className="font-bold text-base text-light-text dark:text-dark-text mb-2">Verification status</Text>
    {isError && <TouchableOpacity onPress={() => void refetch()} accessibilityRole="button"><Text className="text-light-muted dark:text-dark-muted">Status could not be refreshed. Tap to retry.</Text></TouchableOpacity>}
    {data?.filter(record => record.type !== 'Schedule').map(record => <View key={record.id} className="py-2">
      <Text className="font-semibold text-light-text dark:text-dark-text">{record.type === 'Cor' ? 'COR / Employee ID' : record.type}: {labels[record.status]}</Text>
      {record.status !== 'Approved' && <Text className="text-sm text-light-muted dark:text-dark-muted mt-1">{record.reason}</Text>}
      {record.status === 'Processing' && <Text className="text-sm text-light-muted dark:text-dark-muted mt-1">You can continue using the app. We will notify you when verification finishes.</Text>}
      {record.type === 'Account' && record.reason.includes('Verify your email') && <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/(auth)/verify-account-email' as any)}>
        <Text className="text-light-primary dark:text-dark-primary font-semibold mt-2">Verify your email</Text>
      </TouchableOpacity>}
      {(record.status === 'NeedsReview' || record.status === 'Rejected') && <TouchableOpacity accessibilityRole="button" onPress={() => router.push((record.type === 'Vehicle' ? '/(settings)/vehicle' : record.type === 'Account' ? '/(auth)/onboarding-profile' : '/(settings)/setup-schedule') as any)}>
        <Text className="text-light-primary dark:text-dark-primary font-semibold mt-2">{record.type === 'Account' ? 'Update registration information' : 'Update and resubmit'}</Text>
      </TouchableOpacity>}
    </View>)}
  </View>;
}
