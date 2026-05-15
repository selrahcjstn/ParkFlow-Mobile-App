import { Roles } from "./roles";

export const REGISTER_ROLE_OPTIONS: { label: string; value: string }[] = [
  { label: "Student", value: Roles.Student.toString() },
  { label: "University Staff", value: Roles.UniversityStaff.toString() },
  {
    label: "Non-Academic Personnel",
    value: Roles.NonAcademicPersonnel.toString(),
  },
];
