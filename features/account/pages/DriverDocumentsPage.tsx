import DocumentPreviewButton from '@/features/auth/components/DocumentPreviewButton';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { DocumentPickerAsset } from 'expo-document-picker';
import SubScreenLayout from '@/components/layouts/SubScreenLayout';
import { AppButton } from '@/components/ui';
import RegistrationDocumentField from '@/features/auth/components/RegistrationDocumentField';
import { userService } from '@/features/user/services/user.service';
import { useProfileQuery } from '@/hooks';
import { queryClient } from '@/services/queryClient';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { pickDriverDocument } from '@/utils/pickDriverDocument';

export default function DriverDocumentsPage() {
  const { data: profile, refetch } = useProfileQuery();
  const [license, setLicense] = useState<DocumentPickerAsset | null>(null);
  const [photo, setPhoto] = useState<DocumentPickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const approved = profile?.licenseStatus === 2 || profile?.licenseStatus === 'Verified';
  const pick = async (image: boolean) => {
    try { const file = await pickDriverDocument(image); if (file) (image ? setPhoto : setLicense)(file); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Could not select this document.'); }
  };
  const save = async () => {
    if (busy || (!license && !photo)) return;
    setBusy(true); setMessage('');
    try {
      const result = await userService.submitDriverDocuments(license, photo);
      if (!result.isSuccess) throw new Error(result.message || 'Could not save driver documents.');
      setLicense(null); setPhoto(null);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await refetch(); await useAuthStore.getState().loadUser();
      setMessage(result.message || 'Driver documents saved.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Upload failed. Please try again.'); }
    finally { setBusy(false); }
  };
  return <SubScreenLayout title="Driver documents" onBack={() => router.back()}>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
      <Text className="text-sm text-light-muted dark:text-dark-muted">Provide your valid driver’s license and a clear face photo before your next vehicle entry. Admins review licenses in Vehicles.</Text>
      <View className="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4 gap-2">
        <Text className="font-bold text-light-text dark:text-dark-text">License: {approved ? 'Approved' : profile?.driversLicenseUrl ? 'Awaiting review' : 'Required'}</Text>
        {!!profile?.licenseRejectionReason && <Text className="text-light-danger dark:text-dark-danger">Rejected: {profile.licenseRejectionReason}</Text>}
        <Text className="text-light-muted dark:text-dark-muted">Profile photo: {profile?.profilePictureUrl ? 'Uploaded' : 'Required'}</Text>
      </View>
      {!!profile?.driversLicenseUrl && <DocumentPreviewButton url={profile.driversLicenseUrl} label="View submitted license" />}
      <RegistrationDocumentField label="driver’s license" helperText="PDF, JPG or PNG - Up to 5MB. Replacing a license requires a new admin review."
        file={license} onPick={() => pick(false)} onRemove={() => setLicense(null)} disabled={busy} />
      <RegistrationDocumentField label="profile photo" helperText="Clear face photo - JPG, PNG or WEBP, up to 5MB"
        file={photo} onPick={() => pick(true)} onRemove={() => setPhoto(null)} disabled={busy} />
      {!!message && <Text accessibilityLiveRegion="polite" className="text-light-text dark:text-dark-text">{message}</Text>}
      <AppButton label="Save documents" uppercase={false} onPress={save} loading={busy} disabled={busy || (!license && !photo)} />
    </ScrollView>
  </SubScreenLayout>;
}
