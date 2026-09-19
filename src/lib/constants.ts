export const MADRASSA_NAME = "Mifthahul Uloom Higher Secondary Madrassa";
export const MADRASSA_TAGLINE = "Nurturing Islamic Excellence, Moral Integrity & Academic Eminence";
export const MADRASSA_LOCATION = "Kozhikode, Kerala, India";
export const MADRASSA_PHONE = "+91 495 272 8840";
export const MADRASSA_EMAIL = "office@mifthahululoom.edu.in";
export const MONTHLY_FEE_AMOUNT = 100; // Rs. 100 per student per month

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OFFICE_ADMIN: "OFFICE_ADMIN",
  SADR: "SADR",
  STAFF: "STAFF",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const CLASSES = [
  { id: 25, name: "Class 1" },
  { id: 26, name: "Class 2" },
  { id: 27, name: "Class 3" },
  { id: 28, name: "Class 4" },
  { id: 29, name: "Class 5" },
  { id: 30, name: "Class 6" },
  { id: 31, name: "Class 7" },
  { id: 32, name: "Class 8" },
  { id: 33, name: "Class 9" },
  { id: 34, name: "Class 10" },
  { id: 35, name: "+1" },
  { id: 36, name: "+2" },
];

export const CLASS_NAMES = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "+1",
  "+2",
];

export const SECTIONS = ["Boys", "Girls"] as const;

export const STANDARD_SUBJECTS = {
  primary: [
    { name: "Quran & Tajweed", code: "QUR-P" },
    { name: "Islamic Studies (Fiqh & Aqeedah)", code: "ISL-P" },
    { name: "Arabic Language", code: "ARB-P" },
    { name: "English", code: "ENG-P" },
    { name: "Mathematics", code: "MAT-P" },
    { name: "Environmental Science", code: "EVS-P" },
    { name: "Malayalam", code: "MAL-P" },
  ],
  secondary: [
    { name: "Quran & Tafseer", code: "QUR-S" },
    { name: "Hadith & Fiqh", code: "ISL-S" },
    { name: "Arabic Literature & Grammar", code: "ARB-S" },
    { name: "English", code: "ENG-S" },
    { name: "Mathematics", code: "MAT-S" },
    { name: "General Science", code: "SCI-S" },
    { name: "Social Science", code: "SOC-S" },
    { name: "Malayalam / Hindi", code: "LAN-S" },
  ],
  higherSecondary: [
    { name: "Advanced Islamic Jurisprudence & Tafseer", code: "ISL-HS" },
    { name: "Higher Arabic Literature & Rhetoric", code: "ARB-HS" },
    { name: "English Core", code: "ENG-HS" },
    { name: "Physics / Business Studies", code: "OPT1-HS" },
    { name: "Chemistry / Accountancy", code: "OPT2-HS" },
    { name: "Biology / Economics", code: "OPT3-HS" },
    { name: "Computer Science / Mathematics", code: "OPT4-HS" },
  ],
};

export const EXAM_TYPES = [
  "First Term Monthly Assessment",
  "First Mid-Term Examination",
  "Quarterly Examination",
  "Second Mid-Term Examination",
  "Half-Yearly Examination",
  "Model Examination",
  "Annual Grand Examination",
];

export const MONTHS = [
  "June 2026",
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
  "January 2027",
  "February 2027",
  "March 2027",
  "April 2027",
  "May 2027",
];