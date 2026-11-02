import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { validateFileSize } from './fileValidation';

export interface DriverDocumentAsset {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
}

export async function captureDriverDocumentWithCamera(prefix = 'photo'): Promise<DriverDocumentAsset | null> {
  if (Platform.OS !== 'web') {
    const permissions = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissions.granted) {
      if (!permissions.canAskAgain) {
        throw new Error('Camera access is disabled. Please enable camera permissions in your device settings.');
      }
      throw new Error('Camera permission was not granted.');
    }
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const filename = asset.fileName || `${prefix}_${Date.now()}.jpg`;
  const file: DriverDocumentAsset = {
    uri: asset.uri,
    name: filename,
    mimeType: asset.mimeType || 'image/jpeg',
    size: asset.fileSize ?? null,
  };

  const validation = validateFileSize(file, 5);
  if (!validation.isValid) throw new Error(validation.message || 'Photo cannot exceed 5MB.');
  return file;
}

export async function pickDriverDocument(imageOnly = false): Promise<DriverDocumentAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: imageOnly ? ['image/jpeg', 'image/png', 'image/webp'] : ['application/pdf', 'image/jpeg', 'image/png'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const file = result.assets[0];
  const validation = validateFileSize(file, 5);
  if (!validation.isValid) throw new Error(validation.message || 'File cannot exceed 5MB.');
  return {
    uri: file.uri,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
  };
}
