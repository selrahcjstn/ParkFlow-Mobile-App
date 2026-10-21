import * as DocumentPicker from 'expo-document-picker';
import { validateFileSize } from './fileValidation';

export async function pickDriverDocument(imageOnly = false) {
  const result = await DocumentPicker.getDocumentAsync({
    type: imageOnly ? ['image/jpeg', 'image/png', 'image/webp'] : ['application/pdf', 'image/jpeg', 'image/png'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const file = result.assets[0];
  const validation = validateFileSize(file, 5);
  if (!validation.isValid) throw new Error(validation.message || 'File cannot exceed 5MB.');
  return file;
}
