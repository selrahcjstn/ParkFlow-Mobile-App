import { useState } from 'react';
import { Image, Modal, Text, View } from 'react-native';
import { AppButton } from '@/components/ui';
import { previewDocument } from '@/services/documentViewer';

export default function DocumentPreviewButton({ url, label = 'View document' }: { url: string; label?: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const open = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { const result = await previewDocument(url); if (result) setImage(result.imageUrl); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not open this document.'); }
    finally { setBusy(false); }
  };
  return <View className="gap-2">
    <AppButton label={label} variant="outline" uppercase={false} onPress={open} loading={busy} />
    {!!error && <Text className="text-light-danger dark:text-dark-danger">{error}</Text>}
    <Modal visible={!!image} onRequestClose={() => setImage(null)} animationType="fade">
      <View className="flex-1 bg-light-background dark:bg-dark-background p-5 pt-14 gap-4">
        <Image source={{ uri: image || '' }} style={{ flex: 1 }} resizeMode="contain" accessibilityLabel={label} />
        <AppButton label="Close" uppercase={false} onPress={() => setImage(null)} />
      </View>
    </Modal>
  </View>;
}
