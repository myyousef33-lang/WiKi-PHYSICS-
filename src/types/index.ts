export enum GradeLevel {
  GRADE_10 = 'الصف الأول الثانوي',
  GRADE_11 = 'الصف الثاني الثانوي',
  GRADE_12 = 'الصف الثالث الثانوي (ثانوية عامة)'
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  parentPhone: string;
  password?: string;
  grade: GradeLevel | string;
  governorate: string;
  deviceFingerprint?: string;
  registeredAt: string;
  lastActiveAt: string;
  isBlocked?: boolean;
  registeredDevices?: string[];
  maxDevicesAllowed?: number;
  enrolledCourseIds: string[];
  unlockedPdfIds: string[];
  courseExpiryDates?: Record<string, string>; // courseId -> ISO date
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  grade: GradeLevel | string;
  thumbnail: string;
  price: number;
  validityDays: number;
  isPublished: boolean;
  createdAt: string;
  units: Unit[];
}

export interface Unit {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  unitExamId?: string;
}

export type VideoType = 'youtube' | 'uploaded' | 'external' | 'vimeo';

export interface Lesson {
  id: string;
  courseId: string;
  unitId: string;
  title: string;
  description?: string;
  videoType: VideoType;
  videoUrl: string;
  durationMinutes?: number;
  pdfUrl?: string;
  pdfTitle?: string;
  attachments?: { title: string; url: string; type?: string }[];
  order: number;
  isFreePreview?: boolean;
  quizId?: string;
  homeworkNotes?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation?: string;
  image?: string;
}

export interface QuizExam {
  id: string;
  title: string;
  description?: string;
  type: 'quiz' | 'exam';
  courseId?: string;
  grade?: GradeLevel | string;
  unitId?: string;
  lessonId?: string;
  durationMinutes: number;
  passingPercentage: number;
  maxAttempts: number;
  isPublished: boolean;
  questions: Question[];
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  examId: string;
  examTitle: string;
  courseId?: string;
  courseTitle?: string;
  unitTitle?: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  timeTakenSeconds: number;
  submittedAt: string;
}

export interface StudentLessonProgress {
  id: string;
  studentId: string;
  courseId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: string;
  lastWatchedSeconds?: number;
  lastViewedAt: string;
}

export interface ActivationCode {
  id: string;
  code: string;
  type?: 'course' | 'pdf';
  targetType?: 'course' | 'pdf';
  targetId: string;
  targetName?: string;
  targetTitle?: string;
  validityDays?: number;
  maxDevices?: number;
  isUsed: boolean;
  usedByStudentId?: string;
  usedByStudentName?: string;
  usedByStudentPhone?: string;
  usedAt?: string;
  usedDeviceFingerprint?: string;
  createdAt: string;
  expiresInDays?: number;
}

export type ActivationKey = ActivationCode;

export interface PdfCategory {
  id: string;
  title: string;
  grade: GradeLevel | string;
  description?: string;
  order: number;
}

export interface PdfMaterial {
  id: string;
  categoryId?: string;
  categoryTitle?: string;
  title: string;
  description?: string;
  grade: GradeLevel | string;
  category?: string;
  url?: string;
  fileUrl?: string;
  pageCount?: number;
  fileSize?: string;
  downloadCount?: number;
  isLocked: boolean;
  price?: number;
  associatedCourseId?: string;
  createdAt: string;
}

export type PdfFile = PdfMaterial;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  target?: 'all' | 'grade' | 'course' | 'student';
  targetGrade?: GradeLevel | string;
  targetCourseId?: string;
  targetStudentId?: string;
  createdAt: string;
  readBy?: string[];
  sender?: string;
  priority?: 'normal' | 'urgent';
}

export interface PlatformSettings {
  platformName: string;
  instructorName: string;
  instructorTitle: string;
  instructorPhone: string;
  instructorPhotoUrl?: string;
  telegramChannel: string;
  whatsappNumber: string;
  adminPin: string;
  maxDevicesPerStudent: number;
  maintenanceMode: boolean;
}
