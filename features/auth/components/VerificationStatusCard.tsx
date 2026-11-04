import { useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { registerVerificationStatusListener } from '@/services/signalr';
import { verificationService } from '../services/verification.service';
import { useAuthStore } from '../store/auth.store';

const labels: Record<string, string> = {
  Pending: 'Waiting for verification',
  Processing: 'Processing document',
  PreVerified: 'Pre-verified · Admin review pending',
  Approved: 'Approved',
  NeedsReview: 'Needs review',
  Rejected: 'Rejected',
};

export default function VerificationStatusCard() {
  const client = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isError, refetch } = useQuery({
    queryKey: ['verification'],
    queryFn: verificationService.getMine,
    refetchInterval: (query) =>
      query.state.data?.some((r) => r.status === 'Pending' || r.status === 'Processing') ? 5000 : false,
    staleTime: 5000,
  });

  useEffect(() => {
    return registerVerificationStatusListener(() => {
      void client.invalidateQueries({ queryKey: ['verification'] });
    });
  }, [client]);

  const isLicenseApproved = user?.licenseStatus === 2 || user?.licenseStatus === 'Verified';
  const isLicenseRejected = user?.licenseStatus === 3 || user?.licenseStatus === 'Rejected';
  const isLicensePending = !!user?.driversLicenseUrl && !isLicenseApproved && !isLicenseRejected;

  const isPersonnelActive = (user?.profileType === 'personnel' || user?.role === 'Faculty' || user?.role === 'UniversityStaff' || user?.role === 'NonAcademicPersonnel' || Boolean(user?.employeeIdNumber)) && (user?.status?.toLowerCase() === 'active' || user?.status === '2');

  const relevantRecords = (data?.filter((record) => {
    if (record.type === 'Schedule') return false;
    if (isPersonnelActive && (record.type === 'Cor' || record.type === 'Account')) return false;
    return true;
  })) || [];
  const hasUnapprovedRecords = relevantRecords.some((record) => record.status !== 'Approved');
  const showLicenseRow = isLicensePending || isLicenseRejected;

  // Hide the card if there are no errors, no pending/rejected records, and no pending/rejected driver license
  if (!isError && relevantRecords.length === 0 && !showLicenseRow) return null;
  if (!isError && !hasUnapprovedRecords && !showLicenseRow) return null;

  return (
    <View className="rounded-2xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4 my-3">
      <Text className="font-bold text-base text-light-text dark:text-dark-text mb-2">Verification status</Text>

      {isError && (
        <TouchableOpacity onPress={() => void refetch()} accessibilityRole="button">
          <Text className="text-light-muted dark:text-dark-muted">Status could not be refreshed. Tap to retry.</Text>
        </TouchableOpacity>
      )}

      {relevantRecords.map((record) => (
        <View key={record.id} className="py-2">
          <Text className="font-semibold text-light-text dark:text-dark-text">
            {record.type === 'Cor' ? 'COR / Employee ID' : record.type}: {labels[record.status] || record.status}
          </Text>
          {record.status !== 'Approved' && (
            <Text className="text-sm text-light-muted dark:text-dark-muted mt-1">{record.reason}</Text>
          )}
          {record.status === 'Processing' && (
            <Text className="text-sm text-light-muted dark:text-dark-muted mt-1">
              You can continue using the app. We will notify you when verification finishes.
            </Text>
          )}
          {record.type === 'Account' && record.reason?.includes('Verify your email') && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/verify-account-email' as any)}
            >
              <Text className="text-light-primary dark:text-dark-primary font-semibold mt-2">Verify your email</Text>
            </TouchableOpacity>
          )}
          {(record.status === 'NeedsReview' || record.status === 'Rejected') && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() =>
                router.push(
                  (record.type === 'Vehicle'
                    ? '/(settings)/vehicle'
                    : record.type === 'Account'
                    ? '/(auth)/onboarding-profile'
                    : '/(settings)/setup-schedule') as any
                )
              }
            >
              <Text className="text-light-primary dark:text-dark-primary font-semibold mt-2">
                {record.type === 'Account' ? 'Update registration information' : 'Update and resubmit'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Driver License Details Row */}
      {isLicensePending && (
        <View className="py-2 border-t border-light-border/40 dark:border-dark-border/40 mt-1">
          <Text className="font-semibold text-light-text dark:text-dark-text">
            Driver’s License: Waiting for admin review
          </Text>
          <Text className="text-sm text-light-muted dark:text-dark-muted mt-1">
            Submitted during registration. Awaiting administrator review with your vehicle documents.
          </Text>
        </View>
      )}

      {isLicenseRejected && (
        <View className="py-2 border-t border-light-border/40 dark:border-dark-border/40 mt-1">
          <Text className="font-semibold text-light-danger dark:text-dark-danger">
            Driver’s License: Rejected
          </Text>
          <Text className="text-sm text-light-muted dark:text-dark-muted mt-1">
            {user?.licenseRejectionReason || 'Your driver’s license was rejected. Please review requirements and submit again.'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push('/(settings)/driver-documents' as any)}
          >
            <Text className="text-light-primary dark:text-dark-primary font-semibold mt-2">Update and resubmit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
