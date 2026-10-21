import type { CorStudentInformation } from '../services/verification.service';
import { mapCorSemester } from './corStudentMapping';

export function corAcademicTermIssues(info: CorStudentInformation, current: { academicYear: string; semester: string }): string[] {
  const errors: string[] = [];
  if (!current.academicYear || !mapCorSemester(current.semester))
    return ['The current school year and semester have not been configured. Please contact the super admin.'];
  if (!info.academicYear)
    errors.push(`School year could not be read from the COR. The current school year is ${current.academicYear}.`);
  else if (info.academicYear.replace(/\s+/g, '') !== current.academicYear.replace(/\s+/g, ''))
    errors.push(`School year mismatch: your COR shows ${info.academicYear}; the current school year is ${current.academicYear}.`);
  if (!info.semester)
    errors.push(`Semester could not be read from the COR. The current semester is ${current.semester}.`);
  else if (mapCorSemester(info.semester) !== mapCorSemester(current.semester))
    errors.push(`Semester mismatch: your COR shows ${info.semester}; the current semester is ${current.semester}.`);
  return errors;
}
