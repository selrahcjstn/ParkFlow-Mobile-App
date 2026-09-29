import { Roles } from "./roles";

export const REGISTER_ROLE_OPTIONS: { label: string; value: string }[] = [
  { label: "Student", value: Roles.Student.toString() },
  { label: "Faculty Member", value: Roles.UniversityStaff.toString() },
  {
    label: "University Staff",
    value: Roles.NonAcademicPersonnel.toString(),
  },
];
