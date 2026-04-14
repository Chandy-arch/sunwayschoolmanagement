// School-wide constants

export const SCHOOL_GRADES = [
  "Pre KG",
  "LKG",
  "UKG",
  "Grade 1A",
  "Grade 1B",
  "Grade 2A",
  "Grade 3A",
  "Grade 3B",
  "Grade 4",
  "Grade 5",
  "Grade 6",
] as const;

export type SchoolGrade = (typeof SCHOOL_GRADES)[number];

/**
 * Derive the section letter from a grade name.
 * Grades ending in A/B return that letter; others default to "A".
 */
export function getSectionFromGrade(grade: string): string {
  const match = grade.match(/([AB])$/);
  return match ? match[1] : "A";
}
