import { GradeLevel } from '../types';

/**
 * Normalizes any grade representation (enum value, enum key, short label, or Arabic text)
 * to standard GradeLevel enum, or returns null if unrecognized.
 */
export const normalizeGrade = (grade?: string | GradeLevel | null): GradeLevel | null => {
  if (!grade || typeof grade !== 'string') return null;
  const g = grade.trim();

  // First check direct match
  if (g === GradeLevel.GRADE_10) return GradeLevel.GRADE_10;
  if (g === GradeLevel.GRADE_11) return GradeLevel.GRADE_11;
  if (g === GradeLevel.GRADE_12) return GradeLevel.GRADE_12;

  // Check Grade 10 (First secondary)
  if (
    g.includes('الأول') || 
    g.includes('أولى') || 
    g.includes('GRADE_10') || 
    g.includes('1 ث') || 
    g.startsWith('1') || 
    g.includes('أول')
  ) {
    return GradeLevel.GRADE_10;
  }

  // Check Grade 11 (Second secondary)
  if (
    g.includes('الثاني') || 
    g.includes('تانية') || 
    g.includes('ثانية') || 
    g.includes('GRADE_11') || 
    g.includes('2 ث') || 
    g.startsWith('2') || 
    g.includes('تان')
  ) {
    return GradeLevel.GRADE_11;
  }

  // Check Grade 12 (Third secondary / Thanawya Amma)
  if (
    g.includes('الثالث') || 
    g.includes('تالتة') || 
    g.includes('ثالثة') || 
    g.includes('ثانوية عامة') || 
    g.includes('GRADE_12') || 
    g.includes('3 ث') || 
    g.startsWith('3') || 
    g.includes('تالت')
  ) {
    return GradeLevel.GRADE_12;
  }

  return null;
};

/**
 * Checks if two grade values represent the same academic stage.
 */
export const doGradesMatch = (
  gradeA?: string | GradeLevel | null, 
  gradeB?: string | GradeLevel | null
): boolean => {
  const normA = normalizeGrade(gradeA);
  const normB = normalizeGrade(gradeB);
  if (!normA || !normB) return false;
  return normA === normB;
};

/**
 * Returns a human-friendly label for display in badges and headers.
 */
export const getGradeDisplayLabel = (grade?: string | GradeLevel | null): string => {
  const norm = normalizeGrade(grade);
  if (!norm) return (typeof grade === 'string' && grade.trim()) ? grade.trim() : 'عام';
  switch (norm) {
    case GradeLevel.GRADE_10:
      return 'الصف الأول الثانوي';
    case GradeLevel.GRADE_11:
      return 'الصف الثاني الثانوي';
    case GradeLevel.GRADE_12:
      return 'الصف الثالث الثانوي (ثانوية عامة)';
    default:
      return norm;
  }
};

/**
 * Returns a compact badge label (e.g. 3 ثانوي).
 */
export const getShortGradeLabel = (grade?: string | GradeLevel | null): string => {
  const norm = normalizeGrade(grade);
  if (!norm) return (typeof grade === 'string' && grade.trim()) ? grade.trim() : '';
  switch (norm) {
    case GradeLevel.GRADE_10:
      return '1 ثانوي';
    case GradeLevel.GRADE_11:
      return '2 ثانوي';
    case GradeLevel.GRADE_12:
      return '3 ثانوي';
    default:
      return '';
  }
};
