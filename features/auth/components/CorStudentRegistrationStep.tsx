import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
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
const semesters = ['1st Semester', '2nd Semester', 'Summer'].map(value => ({ label: value, value }));

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
      store.setCorDraft({ ...store.corDraft, recordId: preview.recordId, version: preview.version, week: weeklyPreview(preview) });
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
    await verificationService.confirmStudentCor({ recordId: scan.preview.recordId, version: scan.preview.version,
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
    {scan.preview?.issues.map(issue => <Text key={issue} accessibilityRole="alert" className="text-light-text dark:text-dark-text">{issue} Upload a clearer COR to correct the extraction.</Text>)}
    {draft && scan.preview?.canConfirm && <View className="gap-3" pointerEvents={scan.busy ? 'none' : 'auto'}>
      {scan.preview.studentInformation?.fullName && <Text className="text-light-muted dark:text-dark-muted">Printed name: {scan.preview.studentInformation.fullName}</Text>}
      <AppInput label="First Name" value={profile.firstName} onChangeText={v => setProfileField('firstName', v)} />
      <AppInput label="Middle Name (Optional)" value={profile.middleName} onChangeText={v => setProfileField('middleName', v)} />
      <Text className="text-light-muted dark:text-dark-muted text-sm">A printed middle initial is kept as written. Check the name order and leave ambiguous middle names blank.</Text>
      <AppInput label="Last Name" value={profile.lastName} onChangeText={v => setProfileField('lastName', v)} />
      {needsPhoneNumber && !PHONE_REGEX.test(scan.preview.phoneNumber || '') && <AppInput label="Phone Number" value={profile.phoneNumber} keyboardType="phone-pad" maxLength={11} onChangeText={v => setProfileField('phoneNumber', v.replace(/\D/g, '').slice(0, 11))} />}
      <AppInput label="Student Number" value={student.studentNumber} keyboardType="numeric" maxLength={10} onChangeText={v => setStudentField('studentNumber', v.replace(/\D/g, '').slice(0, 10))} />
      <AppInput label="College (if shown on COR)" value={draft.college} onChangeText={v => editDraft({ college: v })} />
      <Text className="text-light-muted dark:text-dark-muted">Grade / Year Level: {student.yearLevel || 'Not read from COR'}</Text>
      {!isJuniorHigh(student.yearLevel) && <AppInput label="Course / Program" value={student.course} onChangeText={v => setStudentField('course', v)} />}
      <AppInput label="Section" value={student.section} onChangeText={v => setStudentField('section', v)} />
      <Text className="text-light-muted dark:text-dark-muted">Academic Year: {draft.academicYear || 'Not read from COR'}</Text>
      <AppSelect label="Semester" options={semesters} value={draft.semester || undefined} onChange={v => editDraft({ semester: v })} />
      <Text className="text-light-text dark:text-dark-text text-lg font-bold">Review your weekly schedule</Text>
      <Text className="text-light-muted dark:text-dark-muted">Each class day runs from your earliest start to your latest end, including gaps.</Text>
      <CorWeeklySchedulePreview week={weeklyPreview(scan.preview)} />
      <Text className="text-light-muted dark:text-dark-muted">Schedules are saved from your COR without admin approval. Upload a clearer COR if the schedule is incorrect.</Text>
      <Text className="text-light-muted dark:text-dark-muted">Confirmation saves your registration details. Only your OR/CR and vehicle photo require admin approval.</Text>
      <AppButton label="Confirm details and continue to vehicle" onPress={confirm} disabled={scan.busy || !scan.preview.canConfirmSchedule} loading={scan.confirming} />
    </View>}
  </View>;
}
