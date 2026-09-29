export const YEAR_LEVEL_OPTIONS: { label: string; value: string }[] = [
  { label: "Grade 7 (High School)", value: "7" },
  { label: "Grade 8 (High School)", value: "8" },
  { label: "Grade 9 (High School)", value: "9" },
  { label: "Grade 10 (High School)", value: "10" },
  { label: "1st Year (College)", value: "1" },
  { label: "2nd Year (College)", value: "2" },
  { label: "3rd Year (College)", value: "3" },
  { label: "4th Year (College)", value: "4" },
  { label: "5th Year+ (College)", value: "5" },
];

export const isJuniorHigh = (yearLevel?: number | string | null): boolean => {
  if (!yearLevel) return false;
  const num = Number(yearLevel);
  return num >= 7 && num <= 10;
};

export const COLLEGE_COURSE_OPTIONS: { label: string; value: string }[] = [
  // College of Computer Studies & Information Technology
  { label: "BS Computer Science (BSCS)", value: "BS Computer Science (BSCS)" },
  { label: "BS Information Technology (BSIT)", value: "BS Information Technology (BSIT)" },
  { label: "BS Information Systems (BSIS)", value: "BS Information Systems (BSIS)" },
  { label: "BS Data Science and Analytics (BSDSA)", value: "BS Data Science and Analytics (BSDSA)" },
  { label: "Associate in Computer Technology (ACT)", value: "Associate in Computer Technology (ACT)" },
  // College of Engineering
  { label: "BS Civil Engineering (BSCE)", value: "BS Civil Engineering (BSCE)" },
  { label: "BS Computer Engineering (BSCpE)", value: "BS Computer Engineering (BSCpE)" },
  { label: "BS Electrical Engineering (BSEE)", value: "BS Electrical Engineering (BSEE)" },
  { label: "BS Electronics Engineering (BSECE)", value: "BS Electronics Engineering (BSECE)" },
  { label: "BS Mechanical Engineering (BSME)", value: "BS Mechanical Engineering (BSME)" },
  { label: "BS Industrial Engineering (BSIE)", value: "BS Industrial Engineering (BSIE)" },
  { label: "BS Chemical Engineering (BSChE)", value: "BS Chemical Engineering (BSChE)" },
  { label: "BS Environmental and Sanitary Engineering (BSESE)", value: "BS Environmental and Sanitary Engineering (BSESE)" },
  { label: "BS Geodetic Engineering (BSGE)", value: "BS Geodetic Engineering (BSGE)" },
  // College of Business, Accountancy & Management
  { label: "BS Accountancy (BSA)", value: "BS Accountancy (BSA)" },
  { label: "BS Management Accounting (BSMA)", value: "BS Management Accounting (BSMA)" },
  { label: "BS Accounting Information Systems (BSAIS)", value: "BS Accounting Information Systems (BSAIS)" },
  { label: "BSBA - Major in Marketing Management (BSBA-MM)", value: "BSBA - Major in Marketing Management (BSBA-MM)" },
  { label: "BSBA - Major in Financial Management (BSBA-FM)", value: "BSBA - Major in Financial Management (BSBA-FM)" },
  { label: "BSBA - Major in Human Resource Management (BSBA-HRM)", value: "BSBA - Major in Human Resource Management (BSBA-HRM)" },
  { label: "BSBA - Major in Operations Management (BSBA-OM)", value: "BSBA - Major in Operations Management (BSBA-OM)" },
  { label: "BS Entrepreneurship (BSEntrep)", value: "BS Entrepreneurship (BSEntrep)" },
  { label: "BS Hospitality Management (BSHM)", value: "BS Hospitality Management (BSHM)" },
  { label: "BS Tourism Management (BSTM)", value: "BS Tourism Management (BSTM)" },
  { label: "BS Customs Administration (BSCA)", value: "BS Customs Administration (BSCA)" },
  { label: "BS Real Estate Management (BSREM)", value: "BS Real Estate Management (BSREM)" },
  // College of Arts, Sciences & Humanities
  { label: "BS Psychology (BSPsych)", value: "BS Psychology (BSPsych)" },
  { label: "BA Psychology (ABPsych)", value: "BA Psychology (ABPsych)" },
  { label: "BA Communication (BAComm)", value: "BA Communication (BAComm)" },
  { label: "BA Journalism (BAJourn)", value: "BA Journalism (BAJourn)" },
  { label: "BA Political Science (BAPolSci)", value: "BA Political Science (BAPolSci)" },
  { label: "BA English Language Studies (BAELS)", value: "BA English Language Studies (BAELS)" },
  { label: "BS Biology (BSBio)", value: "BS Biology (BSBio)" },
  { label: "BS Applied Mathematics (BSAM)", value: "BS Applied Mathematics (BSAM)" },
  { label: "BS Chemistry (BSChem)", value: "BS Chemistry (BSChem)" },
  { label: "BS Social Work (BSSW)", value: "BS Social Work (BSSW)" },
  // College of Education
  { label: "Bachelor of Elementary Education (BEEd)", value: "Bachelor of Elementary Education (BEEd)" },
  { label: "Bachelor of Secondary Education - Major in English (BSEd-Eng)", value: "Bachelor of Secondary Education - Major in English (BSEd-Eng)" },
  { label: "Bachelor of Secondary Education - Major in Mathematics (BSEd-Math)", value: "Bachelor of Secondary Education - Major in Mathematics (BSEd-Math)" },
  { label: "Bachelor of Secondary Education - Major in Science (BSEd-Sci)", value: "Bachelor of Secondary Education - Major in Science (BSEd-Sci)" },
  { label: "Bachelor of Secondary Education - Major in Social Studies (BSEd-SS)", value: "Bachelor of Secondary Education - Major in Social Studies (BSEd-SS)" },
  { label: "Bachelor of Secondary Education - Major in Filipino (BSEd-Fil)", value: "Bachelor of Secondary Education - Major in Filipino (BSEd-Fil)" },
  { label: "Bachelor of Physical Education (BPEd)", value: "Bachelor of Physical Education (BPEd)" },
  { label: "Bachelor of Special Needs Education (BSNEd)", value: "Bachelor of Special Needs Education (BSNEd)" },
  { label: "Bachelor of Early Childhood Education (BECEd)", value: "Bachelor of Early Childhood Education (BECEd)" },
  // College of Nursing & Health Sciences
  { label: "BS Nursing (BSN)", value: "BS Nursing (BSN)" },
  { label: "BS Medical Laboratory Science / Medical Technology (BSMLS)", value: "BS Medical Laboratory Science / Medical Technology (BSMLS)" },
  { label: "BS Pharmacy (BSPharm)", value: "BS Pharmacy (BSPharm)" },
  { label: "BS Physical Therapy (BSPT)", value: "BS Physical Therapy (BSPT)" },
  { label: "BS Radiologic Technology (BSRT)", value: "BS Radiologic Technology (BSRT)" },
  { label: "BS Nutrition and Dietetics (BSND)", value: "BS Nutrition and Dietetics (BSND)" },
  { label: "BS Respiratory Therapy (BSRTh)", value: "BS Respiratory Therapy (BSRTh)" },
  // College of Architecture & Fine Arts
  { label: "BS Architecture (BSArch)", value: "BS Architecture (BSArch)" },
  { label: "Bachelor of Fine Arts (BFA)", value: "Bachelor of Fine Arts (BFA)" },
  { label: "BS Interior Design (BSID)", value: "BS Interior Design (BSID)" },
  // College of Criminology & Security
  { label: "BS Criminology (BSCrim)", value: "BS Criminology (BSCrim)" },
  { label: "BS Industrial Security Management (BSISM)", value: "BS Industrial Security Management (BSISM)" }
];
