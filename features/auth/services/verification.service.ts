import { api } from '@/services/axios';

export type VerificationState = 'Pending' | 'Processing' | 'PreVerified' | 'Approved' | 'NeedsReview' | 'Rejected';
export interface VerificationStatus {
  id: string;
  type: 'Account' | 'Cor' | 'Vehicle' | 'Schedule';
  status: VerificationState;
  reason: string;
  ocrOutcome?: string;
  verifiedAt?: string;
}
export interface CorSchedulePreview {
  recordId: string; version: number; status: VerificationState; documentUrl: string;
  items: { dayOfWeek: number; startTime: string; endTime: string }[];
  issues: string[]; canConfirm: boolean; canConfirmSchedule: boolean; scheduleReviewRequested: boolean;
  week?: CorWeekDay[];
  studentInformation?: CorStudentInformation | null;
  informationConfirmed?: boolean;
  phoneNumber?: string | null;
  fetchRequested: boolean;
  currentAcademicYear?: string | null;
  currentSemester?: string | null;
}
export interface CorWeekDay { dayOfWeek: number; hasClasses: boolean | null; startTime: string | null; endTime: string | null }
export interface CorStudentInformation { fullName?: string | null; firstName?: string | null; lastName?: string | null; middleName?: string | null;
  studentNumber?: string | null; college?: string | null; course?: string | null; yearLevel?: number | null; section?: string | null;
  academicYear?: string | null; semester?: string | null }
export const verificationService = {
  getCorSchedule: async (): Promise<CorSchedulePreview | null> =>
    await api.get('/verification/cor-schedule', { timeout: 15000, handleNetworkErrorLocally: true } as any) as unknown as CorSchedulePreview | null,
  getStudentCorPreview: async (): Promise<CorSchedulePreview | null> =>
    await api.get('/onboarding/student/cor-preview', { timeout: 15000, handleNetworkErrorLocally: true } as any) as unknown as CorSchedulePreview | null,
  fetchCorInformation: async (preview: CorSchedulePreview): Promise<CorSchedulePreview> => {
    const response = await api.post('/verification/cor-information/fetch', { recordId: preview.recordId, version: preview.version },
      { timeout: 15000, handleNetworkErrorLocally: true } as any) as unknown as { isSuccess: boolean; data?: CorSchedulePreview; message?: string };
    if (!response?.isSuccess || !response.data) throw new Error(response?.message || 'Information could not be fetched. Refresh and try again.');
    return response.data;
  },
  confirmStudentCor: async (payload: unknown) => {
    const response = await api.post('/onboarding/student/cor-confirm', payload,
      { timeout: 15000, handleNetworkErrorLocally: true } as any) as unknown as { isSuccess: boolean; message?: string };
    if (!response?.isSuccess) throw new Error(response?.message || 'Student details could not be saved. Refresh and try again.');
  },
  confirmCorSchedule: async (preview: CorSchedulePreview) => {
    const response = await api.post('/verification/cor-schedule/confirm', { recordId: preview.recordId, version: preview.version },
      { timeout: 15000, handleNetworkErrorLocally: true } as any) as unknown as { isSuccess: boolean; message?: string };
    if (!response?.isSuccess) throw new Error(response?.message || 'The schedule could not be saved. Refresh and try again.');
  },
  requestCorScheduleReview: async (preview: CorSchedulePreview, reason: string) => {
    const response = await api.post('/verification/cor-schedule/request-review',
      { recordId: preview.recordId, version: preview.version, reason },
      { timeout: 15000, handleNetworkErrorLocally: true } as any) as unknown as { isSuccess: boolean; message?: string };
    if (!response?.isSuccess) throw new Error(response?.message || 'Review could not be requested. Refresh and try again.');
  },
  getMine: async (): Promise<VerificationStatus[]> => {
    const response = await api.get('/verification/my', { timeout: 15000, handleNetworkErrorLocally: true } as any);
    return response as unknown as VerificationStatus[];
  },
  getCurrentAcademicTerm: async (): Promise<{ academicYear: string; semester: string }> => {
    const response = await api.get('/verification/academic-term', { timeout: 15000, handleNetworkErrorLocally: true } as any);
    const term = response as unknown as { academicYear: string; semester: string };
    if (!term.academicYear || !term.semester) throw new Error('The university academic term has not been configured. Please contact campus administration.');
    return term;
  },
  getAcademicTerm: async (): Promise<string> => {
    return (await verificationService.getCurrentAcademicTerm()).academicYear;
  },
};
