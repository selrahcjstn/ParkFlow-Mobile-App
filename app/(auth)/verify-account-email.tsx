import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import AuthLayout from '@/features/auth/components/AuthLayout';
import EmailVerificationView from '@/features/auth/components/EmailVerificationView';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { AppButton } from '@/components/ui';

export default function VerifyAccountEmailPage() {
  const { user, loadUser } = useAuthStore();
  const client = useQueryClient();
  const [error, setError] = useState('');
  async function send() {
    setError('');
    if (!user?.email) { setError('Your email could not be loaded. Sign in again.'); return; }
    try {
      const result = await authService.sendOwnedEmailOtp(user.email);
      if (!result.isSuccess) setError(result.message);
    } catch (e: any) { setError(e.response?.data?.message || 'The verification code could not be sent. Try again.'); }
  }
  useEffect(() => { void send(); }, [user?.email]);
  return <AuthLayout>
    {error ? <View className="p-6 gap-4"><Text accessibilityRole="alert" className="text-light-text dark:text-dark-text">{error}</Text><AppButton label="Retry" onPress={send} /><AppButton label="Back" variant="outline" onPress={() => router.back()} /></View> :
      <EmailVerificationView verifyExistingEmail email={user?.email || ''} onBack={() => router.back()} onVerifySuccess={async () => {
        await client.invalidateQueries({ queryKey: ['verification'] }); await loadUser(); router.back();
      }} />}
  </AuthLayout>;
}
