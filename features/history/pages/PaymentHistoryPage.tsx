import { ContentWrapper } from '@/components/layouts';
import { SectionHeader } from '@/components/shared';
import HistoryPaymentSection from '../components/HistoryPaymentSection';
import { usePaymentHistory } from '../hooks/usePaymentHistory';
import { appDialog } from '@/services/app-dialog';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Text } from 'react-native';

export default function PaymentHistoryPage() {
  const { payments, loading, refreshing, error, hasMore, refresh, refreshIfStale, loadMore } = usePaymentHistory();
  useFocusEffect(useCallback(() => { void refreshIfStale(); }, [refreshIfStale]));
  return <ContentWrapper><SectionHeader title="Payments & transaction history" />
    {!!error && <Text accessibilityRole="alert" className="text-light-danger dark:text-dark-danger">{error}</Text>}
    <HistoryPaymentSection payments={payments} isLoading={loading && payments.length === 0} loadingMore={loading && payments.length > 0}
      hasMore={hasMore} onLoadMore={loadMore} refreshing={refreshing}
      onRefresh={() => void refresh()} onPressPayment={payment => appDialog.show('Transaction',
        `${payment.referenceNumber || ''}\n${payment.plateNumber}\n₱${payment.amount.toFixed(2)} · ${payment.status}`)} />
  </ContentWrapper>;
}
