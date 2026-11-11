import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton, AppInput } from '@/components/ui';
import { isJuniorHigh } from '@/constants/courses';
import { PHONE_REGEX, STUDENT_ID_REGEX } from '@/utils/registerValidation';
import { useAuthStore } from '../store/auth.store';
import { useOnboardingStore } from '../store/onboarding.store';
import { useCorScan } from '../hooks/useCorScan';
import { mapCorCourse, mapCorSection, mapCorSemester, validCorName, weeklyPreview } from '../utils/corStudentMapping';
import { verificationService } from '../services/verification.service';
import CorUploadStep from './CorUploadStep';
import CorWeeklySchedulePreview from './CorWeeklySchedulePreview';

type Props = { onConfirmed: (documentUrl: string) => void | Promise<void> };

export default function CorStudentRegistrationStep({ onConfirmed }: Props) {
  const scan = useCorScan(true);
  const { profile, student, corDraft, setCorDraft, setProfileField, setStudentField } = useOnboardingStore();
  const [needsPhoneNumber] = useState(() => !PHONE_REGEX.test(profile.phoneNumber));
  useEffect(() => {
    const preview = scan.preview;
    if (!preview?.canConfirm || !preview.studentInformation) return;
    const store = useOnboardingStore.getState();
    if (!PHONE_REGEX.test(store.profile.phoneNumber) && preview.phoneNumber && PHONE_REGEX.test(preview.phoneNumber))
      store.setProfileField('phoneNumber', preview.phoneNumber);
    // Keep corrections when returning from vehicle/documents or refreshing this scan.
    if (store.corDraft?.documentUrl === preview.documentUrl) {
      store.setStudentField('section', mapCorSection(store.student.section));
      store.setCorDraft({ ...store.corDraft, recordId: preview.recordId, version: preview.version, week: weeklyPreview(preview),
        academicYear: preview.studentInformation.academicYear || '', semester: mapCorSemester(preview.studentInformation.semester) });
      return;
    }
    const info = preview.studentInformation;
    const user = useAuthStore.getState().user;
    store.setProfileField('firstName', info.firstName || '');
    store.setProfileField('lastName', info.lastName || '');
    store.setProfileField('middleName', user?.studentNumber ? user.middleName || '' : info.middleName || '');
    store.setStudentField('studentNumber', info.studentNumber || '');
    store.setStudentField('course', mapCorCourse(info.course) || info.course?.trim() || '');
    store.setStudentField('yearLevel', info.yearLevel || 0);
    store.setStudentField('section', mapCorSection(info.section));
    store.setCorDraft({ documentUrl: preview.documentUrl, recordId: preview.recordId, version: preview.version,
      academicYear: info.academicYear || '', semester: mapCorSemester(info.semester), college: info.college || '',
      week: weeklyPreview(preview), informationConfirmed: false });
  }, [scan.preview?.recordId, scan.preview?.version, scan.preview?.canConfirm]);

  const draft = corDraft?.documentUrl === scan.preview?.documentUrl ? corDraft : null;
  const editDraft = (change: Partial<NonNullable<typeof corDraft>>) => {
    if (draft && !scan.busy) setCorDraft({ ...draft, ...change, informationConfirmed: false });
  };
  const confirm = () => scan.runAction(async () => {
    if (!draft || !scan.preview?.canConfirm) return;
    if (!validCorName(profile.firstName) || !validCorName(profile.lastName) ||
      profile.middleName.trim() && !validCorName(profile.middleName))
      throw new Error('Complete and check your first, last and optional middle name.');
    if (!PHONE_REGEX.test(profile.phoneNumber)) throw new Error('Enter an 11-digit phone number starting with 09.');
    if (!STUDENT_ID_REGEX.test(student.studentNumber)) throw new Error('Enter your 10-digit student number.');
    if (!student.yearLevel || !student.section.trim() || !isJuniorHigh(student.yearLevel) && !student.course)
      throw new Error('Check your course and section. If the grade/year level could not be scanned, upload a clearer COR.');
    if (!draft.academicYear) throw new Error('The academic year could not be scanned. Upload a clearer COR.');
    if (!scan.preview.canConfirmSchedule) throw new Error('The schedule could not be read completely. Upload a clearer COR to continue.');
    await scan.validateCurrentTerm();
    // New registrations remain local until the final document submission.
    if (!useOnboardingStore.getState().registration.sessionToken) await verificationService.confirmStudentCor({ recordId: scan.preview.recordId, version: scan.preview.version,
      information: { firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), middleName: profile.middleName.trim() || null,
        phoneNumber: profile.phoneNumber, studentNumber: student.studentNumber, college: draft.college.trim() || null,
        course: isJuniorHigh(student.yearLevel) ? '' : student.course, yearLevel: student.yearLevel, section: student.section.trim(),
        academicYear: draft.academicYear.trim(), semester: draft.semester } });
    setCorDraft({ ...draft, informationConfirmed: true });
    await onConfirmed(draft.documentUrl);
  });

  return <View className="gap-4">
    <Text className="text-light-text dark:text-dark-text text-lg font-bold">Student details from your COR</Text>
    <Text className="text-light-muted dark:text-dark-muted">Upload your COR, tap Fetch Information, then review your personal details and weekly schedule.</Text>
    <CorUploadStep scan={scan} />
    {draft && scan.preview?.canConfirm && <View className="gap-3" pointerEvents={scan.busy ? 'none' : 'auto'}>
      {scan.preview.studentInformation?.fullName && <AppInput label="Printed Name" value={scan.preview.studentInformation.fullName} editable={false} selectTextOnFocus={false} />}
      <AppInput label="First Name" value={profile.firstName} editable={false} selectTextOnFocus={false} />
      <AppInput label="Middle Name (Optional)" value={profile.middleName} editable={false} selectTextOnFocus={false} />
      <Text className="text-light-muted dark:text-dark-muted text-sm">Your name, student number and section are read from your COR and can't be edited. If something is wrong, upload a clearer COR and fetch again.</Text>
      <AppInput label="Last Name" value={profile.lastName} editable={false} selectTextOnFocus={false} />
      {needsPhoneNumber && !PHONE_REGEX.test(scan.preview.phoneNumber || '') && <AppInput label="Phone Number" value={profile.phoneNumber} keyboardType="phone-pad" maxLength={11} onChangeText={v => setProfileField('phoneNumber', v.replace(/\D/g, '').slice(0, 11))} />}
      <AppInput label="Student Number" value={student.studentNumber} keyboardType="numeric" maxLength={10} editable={false} selectTextOnFocus={false} />
      <AppInput label="College (if shown on COR)" value={draft.college} onChangeText={v => editDraft({ college: v })} />
      <AppInput label="Grade / Year Level" value={student.yearLevel ? String(student.yearLevel) : ''} placeholder="Not read from COR" editable={false} selectTextOnFocus={false} />
      {!isJuniorHigh(student.yearLevel) && <AppInput label="Course / Program" value={student.course} onChangeText={v => setStudentField('course', v)} />}
      <AppInput label="Section" value={student.section} editable={false} selectTextOnFocus={false} />
      <AppInput label="School Year" value={draft.academicYear} placeholder="Not read from COR" editable={false} selectTextOnFocus={false} />
      <AppInput label="Semester" value={draft.semester} placeholder="Not read from COR" editable={false} selectTextOnFocus={false} />
      <View className="gap-2">
        <View className="gap-1">
          <Text className="text-light-text dark:text-dark-text text-base font-bold">Review your weekly schedule</Text>
          <Text className="text-light-muted dark:text-dark-muted text-xs leading-4">Earliest start - latest end, including breaks.</Text>
        </View>
        <CorWeeklySchedulePreview week={weeklyPreview(scan.preview)} />
      </View>
      <Text className="text-light-muted dark:text-dark-muted">Double-check your personal details and weekly schedule before confirming.</Text>
      <AppButton label="Confirm" uppercase={false} onPress={confirm} disabled={scan.busy || !scan.preview.canConfirmSchedule} loading={scan.confirming} />
    </View>}
  </View>;
}
