import { api } from '@/services/axios';
import { getRegistrationErrorMessage } from '@/utils/registrationError';
import { useOnboardingStore } from '../store/onboarding.store';
import type { CorSchedulePreview } from './verification.service';
import { Roles } from '@/constants/roles';

type Response<T> = { isSuccess: boolean; data: T; message?: string };
function options(timeout = 15000) {
  const token = useOnboardingStore.getState().registration.sessionToken;
  if (!token) throw new Error('Verify your email before continuing registration.');
  return { headers: { 'X-Registration-Token': token }, timeout, handleNetworkErrorLocally: true, preserveSessionOnError: true };
}
function data<T>(response: Response<T>): T {
  if (!response?.isSuccess) throw new Error(getRegistrationErrorMessage(response, 'Could not complete this step. Please try again.'));
  return response.data;
}
export function addFile(form: FormData, key: string, file: { uri: string; name?: string | null; mimeType?: string | null }) {
  const name = file.name || `${key}.jpg`;
  const extension = name.split('.').pop()?.toLowerCase();
  const type = file.mimeType || (extension === 'pdf' ? 'application/pdf' : extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg');
  form.append(key, { uri: file.uri, name, type } as any);
}
export const registrationService = {
  start: async (email: string, emailVerificationToken: string) => data(await api.post('/registration/session', { email, emailVerificationToken },
    { handleNetworkErrorLocally: true, preserveSessionOnError: true, timeout: 15000 } as any) as unknown as Response<{ token: string; expiresAt: string }>),
  preview: async () => data(await api.get('/registration/cor', options()) as unknown as Response<CorSchedulePreview | null>),
  uploadCor: async (file: { uri: string; name?: string | null; mimeType?: string | null }) => {
    const form = new FormData(); addFile(form, 'file', file);
    return data(await api.post('/registration/cor', form, options(90000)) as unknown as Response<CorSchedulePreview>);
  },
  fetchCor: async (preview: CorSchedulePreview) => data(await api.post('/registration/cor/fetch',
    { recordId: preview.recordId, version: preview.version }, options()) as unknown as Response<CorSchedulePreview>),
  complete: async () => {
    const s = useOnboardingStore.getState();
    const r = s.registration;
    const isEBike = Number(s.vehicle.vehicleType) === VehicleType.ElectricBike;
    if ((!isEBike && !r.orcrFile) || !r.motorFile || !r.licenseFile || !r.profilePhotoFile) {
      throw new Error(isEBike
        ? 'Upload e-bike photo, driver’s license and profile photo before submitting.'
        : 'Upload OR/CR, vehicle photo, driver’s license and profile photo before submitting.');
    }
    const form = new FormData();
    form.append('details', JSON.stringify({ email: r.email.trim(), password: r.password, role: s.role,
      firstName: s.profile.firstName.trim(), lastName: s.profile.lastName.trim(), middleName: s.profile.middleName.trim() || null,
      phoneNumber: s.profile.phoneNumber, ...s.student, ...s.personnel, ...s.vehicle,
      plateNumber: isEBike ? (s.vehicle.plateNumber.trim() || null) : s.vehicle.plateNumber.trim(),
      academicYear: s.corDraft?.academicYear || '', semester: s.corDraft?.semester || '', college: s.corDraft?.college || null }));
    // The backend holds the exact COR bytes that were scanned. Employee IDs are sent here.
    if (s.role !== Roles.Student && r.corFile) addFile(form, 'cor', r.corFile);
    if (r.orcrFile) addFile(form, 'orcr', r.orcrFile);
    addFile(form, 'motor', r.motorFile);
    addFile(form, 'license', r.licenseFile); addFile(form, 'profilePhoto', r.profilePhotoFile);
    return data(await api.post('/registration/complete', form, options(120000)) as unknown as Response<string>);
  },
  cancel: async () => { if (useOnboardingStore.getState().registration.sessionToken) await api.delete('/registration/session', options()); },
};
