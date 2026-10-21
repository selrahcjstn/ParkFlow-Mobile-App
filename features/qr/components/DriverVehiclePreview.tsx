import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { formatDocumentUrl } from '@/services/documentViewer';

type Props = { profilePictureUrl?: string | null; vehiclePictureUrl?: string | null; fullName?: string | null;
  plateNumber?: string | null; vehicleType?: string | null; brand?: string | null };
function Photo({ url, label }: { url?: string | null; label: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const uri = url && /^(file:|content:|blob:)/.test(url) ? url : formatDocumentUrl(url);
  return <View className="flex-1 gap-2">
    <Text className="text-xs font-bold text-light-muted dark:text-dark-muted">{label}</Text>
    {uri && !failed ? <Image source={{ uri }} accessibilityLabel={label} resizeMode="contain" onError={() => setFailed(true)}
      style={{ height: 160, width: '100%', borderRadius: 12 }} />
      : <View style={{ height: 160 }} className="rounded-xl bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center p-3">
        <Text className="text-sm text-center text-light-muted dark:text-dark-muted">{failed ? 'Photo unavailable' : 'Photo not submitted'}</Text>
      </View>}
  </View>;
}
export default function DriverVehiclePreview(p: Props) {
  return <View className="w-full gap-3 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4 mb-4">
    <Text className="font-bold text-light-text dark:text-dark-text">{p.fullName || 'Driver verification'}</Text>
    <View className="flex-row gap-3"><Photo url={p.profilePictureUrl} label="Driver photo" /><Photo url={p.vehiclePictureUrl} label="Vehicle photo" /></View>
    <Text className="font-bold text-light-text dark:text-dark-text">{[p.plateNumber, p.vehicleType, p.brand].filter(Boolean).join(' • ')}</Text>
    <Text className="text-xs text-light-muted dark:text-dark-muted">Match the person, vehicle and plate at the gate before confirming.</Text>
  </View>;
}
