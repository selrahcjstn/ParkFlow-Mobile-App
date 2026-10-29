import { ContentWrapper } from '@/components/layouts';
import { SectionHeader } from '@/components/shared';
import HistoryPaymentSection from '../components/HistoryPaymentSection';
import { PaymentRecord } from '../types/payment.types';
import { violationService } from '@/features/violation/services/violation.service';
import { appDialog } from '@/services/app-dialog';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';

export default function PaymentHistoryPage() {
  const [payments,setPayments]=useState<PaymentRecord[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [page,setPage]=useState(1);
  const [hasMore,setHasMore]=useState(false);
  const load=useCallback(async (next=1)=>{
    setLoading(true);setError('');
    try {
      const response=await violationService.getViolationHistory(next,20);
      if(!response.isSuccess) throw new Error(response.message || 'Could not load transactions.');
      const rows=(response.data?.items || []).map((v:any):PaymentRecord=>({
        id:v.violationId || v.id || v.referenceNumber, plateNumber:v.plateNumber || '',
        name:[v.ownerFirstName || v.firstName,v.ownerLastName || v.lastName].filter(Boolean).join(' '),
        amount:Number(v.penaltyFee ?? 0),date:v.paidAt || v.issuedAt || v.createdAt,
        status:v.isPaid || v.settlementStatus==='Settled' ? 'Paid' : 'Pending',
        referenceNumber:v.referenceNumber,violationType:v.violationType,
      }));
      setPayments(previous=>next===1?rows:[...previous,...rows]);setPage(next);setHasMore(rows.length===20);
    } catch(e:any){setError(e?.response?.data?.message || e.message || 'Could not load transactions.');}
    finally{setLoading(false);}
  },[]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  return <ContentWrapper><SectionHeader title="Payments & transaction history" />
    {!!error && <Text accessibilityRole="alert" className="text-light-danger dark:text-dark-danger">{error}</Text>}
    <HistoryPaymentSection payments={payments} isLoading={loading && page===1} loadingMore={loading && page>1}
      hasMore={hasMore} onLoadMore={()=>{if(!loading)void load(page+1);}} refreshing={loading}
      onRefresh={()=>void load()} onPressPayment={payment=>appDialog.show('Transaction',
        `${payment.referenceNumber || ''}\n${payment.plateNumber}\n₱${payment.amount.toFixed(2)} · ${payment.status}`)} />
  </ContentWrapper>;
}
