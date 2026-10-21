import { useEffect, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { userService } from '@/features/user/services/user.service';
import { validateFileSize } from '@/utils/fileValidation';
import { getRegistrationErrorMessage } from '@/utils/registrationError';
import { verificationService, type CorSchedulePreview } from '../services/verification.service';
import { registrationService } from '../services/registration.service';
import { useOnboardingStore } from '../store/onboarding.store';
import { corAcademicTermIssues } from '../utils/corAcademicTerm';

export function useCorScan(studentRegistration = false) {
  const sessionToken = useOnboardingStore(state => state.registration.sessionToken);
  const temporary = studentRegistration && !!sessionToken;
  const [preview, setPreview] = useState<CorSchedulePreview | null>(() => temporary ? useOnboardingStore.getState().registration.corPreview : null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState(() => temporary ? useOnboardingStore.getState().registration.corFile?.name || '' : '');
  const [operation, setOperation] = useState<'upload' | 'fetch' | 'confirm' | null>(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const generation = useRef(0), actionRunning = useRef(false);
  useEffect(() => {
    let active = true; let timer: ReturnType<typeof setTimeout>;
    const expected = generation.current;
    async function refresh() {
      try {
        if (temporary && !useOnboardingStore.getState().registration.corFile) return;
        const result = await (temporary ? registrationService.preview() : studentRegistration ? verificationService.getStudentCorPreview() : verificationService.getCorSchedule());
        if (!active || expected !== generation.current) return;
        if (result && (!documentUrl || result.documentUrl === documentUrl)) {
          setPreview(result);
          if (temporary) useOnboardingStore.getState().setRegistrationField('corPreview', result);
          // Uploaded documents wait for an explicit Fetch Information request.
          if (!result.fetchRequested || !['Pending', 'Processing'].includes(result.status)) return;
          timer = setTimeout(refresh, 1000);
        }
      } catch (err) { if (active && expected === generation.current) setError(getRegistrationErrorMessage(err, 'Could not fetch your COR information. Refresh to try again.')); }
    }
    void refresh();
    return () => { active = false; clearTimeout(timer); };
  }, [documentUrl, refreshKey, studentRegistration, temporary, sessionToken]);
  async function runAction(action: () => Promise<void>, kind: 'upload' | 'fetch' | 'confirm' = 'confirm') {
    if (actionRunning.current) return;
    actionRunning.current = true; setOperation(kind); setError('');
    try { await action(); }
    catch (err) { setError(getRegistrationErrorMessage(err)); }
    finally { actionRunning.current = false; setOperation(null); }
  }
  async function upload() {
    await runAction(async () => {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0]; const check = validateFileSize(file, 5);
      if (!check.isValid) throw new Error(check.message || 'File size cannot exceed 5MB.');
      if (temporary) {
        const uploaded = await registrationService.uploadCor(file);
        generation.current++;
        const store = useOnboardingStore.getState();
        store.setCorDraft(null); store.setRegistrationField('corFile', file);
        store.setRegistrationField('corPreview', uploaded); store.setRegistrationField('preparedCorUrl', undefined);
        setPreview(uploaded); setDocumentUrl(uploaded.documentUrl); setFileName(file.name);
        setRefreshKey(key => key + 1);
        return;
      }
      const response = await userService.uploadCorDocument(file.uri, file.name, '');
      const data = response?.data ?? response?.result;
      const url = (data as any)?.secureUrl || (data as any)?.url;
      if (!response?.isSuccess || !url) throw new Error(getRegistrationErrorMessage(response));
      generation.current++;
      setPreview((data as any)?.corPreview || null); setDocumentUrl(url); setFileName(file.name);
      setRefreshKey(key => key + 1);
    }, 'upload');
  }
  async function fetchInformation() {
    await runAction(async () => {
      if (!preview) throw new Error('Refresh the uploaded COR before fetching information.');
      const expected = generation.current;
      const result = await (temporary ? registrationService.fetchCor(preview) : verificationService.fetchCorInformation(preview));
      if (expected !== generation.current) return;
      setPreview(result); setRefreshKey(key => key + 1);
      if (temporary) useOnboardingStore.getState().setRegistrationField('corPreview', result);
    }, 'fetch');
  }
  async function validateCurrentTerm() {
    if (!preview?.studentInformation) throw new Error('Fetch your COR information before confirming.');
    const current = await verificationService.getCurrentAcademicTerm();
    const issues = corAcademicTermIssues(preview.studentInformation, current);
    if (issues.length) {
      const rejected = { ...preview, status: 'Rejected' as const, canConfirm: false, canConfirmSchedule: false,
        currentAcademicYear: current.academicYear, currentSemester: current.semester, issues };
      setPreview(rejected);
      if (temporary) useOnboardingStore.getState().setRegistrationField('corPreview', rejected);
      throw new Error(issues.join(' '));
    }
  }
  return { preview, documentUrl: documentUrl || preview?.documentUrl, fileName, validateCurrentTerm,
    busy: operation !== null, uploading: operation === 'upload', fetching: operation === 'fetch', confirming: operation === 'confirm',
    error, setError, upload, fetchInformation, runAction,
    processing: !!preview?.fetchRequested && ['Pending', 'Processing'].includes(preview.status),
    refresh: () => { setError(''); setRefreshKey(key => key + 1); } };
}
