import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { formatDocumentUrl } from '@/services/documentViewer';

type Props = {
  profilePictureUrl?: string | null;
  vehiclePictureUrl?: string | null;
  fullName?: string | null;
  plateNumber?: string | null;
  vehicleType?: string | null;
  brand?: string | null;
  role?: string | null;
  phoneNumber?: string | null;
};

const isEBike = (t?: string | null) => t === 'ElectricBike' || t === 'E-Bike' || t === 'Electric Bike';
const typeLabel = (t?: string | null) => (isEBike(t) ? 'E-Bike' : t || '');

function Photo({ url, label }: { url?: string | null; label: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const uri = url && /^(file:|content:|blob:)/.test(url) ? url : formatDocumentUrl(url);
  return (
    <View className="flex-1">
      <View style={{ height: 150 }} className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center">
        {uri && !failed ? (
          <Image source={{ uri }} accessibilityLabel={label} resizeMode="contain" onError={() => setFailed(true)}
            style={{ height: '100%', width: '100%' }} />
        ) : (
          <Text className="text-[12px] text-center px-3 text-light-muted dark:text-dark-muted">
            {failed ? 'Photo unavailable' : 'No photo submitted'}
          </Text>
        )}
      </View>
      <Text className="text-[10px] font-bold uppercase tracking-wider text-center py-1.5 text-light-muted dark:text-dark-muted">
        {label}
      </Text>
    </View>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-2.5 border-t border-light-border dark:border-dark-border">
      <Text className="text-[12px] text-light-muted dark:text-dark-muted">{label}</Text>
      <Text className={`text-[13px] font-bold text-light-text dark:text-dark-text ${mono ? 'font-mono' : ''}`}>{value}</Text>
    </View>
  );
}

/** Gate check panel: who is driving, what they are driving, and the photos to compare. */
export default function DriverVehiclePreview(p: Props) {
  const plate = p.plateNumber || (isEBike(p.vehicleType) ? 'No plate (E-Bike)' : '');
  const meta = [p.role, p.phoneNumber].filter(Boolean).join('  ·  ');
  return (
    <View className="w-full rounded-card border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden mb-4">
      <View className="px-4 pt-4 pb-3">
        <Text className="text-[16px] font-bold text-light-text dark:text-dark-text">{p.fullName || 'Driver verification'}</Text>
        {!!meta && <Text className="text-[12px] mt-0.5 text-light-muted dark:text-dark-muted">{meta}</Text>}
      </View>

      <View className="flex-row border-t border-light-border dark:border-dark-border">
        <Photo url={p.profilePictureUrl} label="Driver" />
        <View className="w-px bg-light-border dark:bg-dark-border" />
        <Photo url={p.vehiclePictureUrl} label="Vehicle" />
      </View>

      {!!plate && <Row label="Plate" value={plate} mono />}
      {!!p.vehicleType && <Row label="Type" value={typeLabel(p.vehicleType)} />}
      {!!p.brand && <Row label="Brand" value={p.brand} />}

      <View className="px-4 py-2.5 border-t border-light-border dark:border-dark-border bg-light-surfaceMuted dark:bg-dark-surfaceMuted">
        <Text className="text-[11px] text-light-muted dark:text-dark-muted">
          Compare the person, vehicle and plate with the photos before confirming.
        </Text>
      </View>
    </View>
  );
}
