export enum GradeLevel {
  GRADE_10 = 'الصف الأول الثانوي',
  GRADE_11 = 'الصف الثاني الثانوي',
  GRADE_12 = 'الصف الثالث الثانوي (ثانوية عامة)'
}

export interface EarnedCertificate {
  id: string;
  title: string;
  type: 'exam' | 'unit' | 'course';
  examOrUnitName: string;
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  parentPhone: string;
  password?: string;
  grade: GradeLevel | string;
  governorate: string;
  gender?: 'male' | 'female';
  deviceFingerprint?: string;
  registeredAt: string;
  lastActiveAt: string;
  isBlocked?: boolean;
  registeredDevices?: string[];
  maxDevicesAllowed?: number;
  enrolledCourseIds: string[];
  unlockedPdfIds: string[];
  courseExpiryDates?: Record<string, string>; // courseId -> ISO date
  avatarUrl?: string;
  streakDays?: number;
  lastActiveDate?: string;
  flashcardProgress?: Record<string, 'understood' | 'needs_review'>;
  earnedCertificates?: EarnedCertificate[];
  walletBalance?: number;
}

export interface CourseReview {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: string;
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
  order?: number;
  rating?: number;
  ratingCount?: number;
  reviews?: CourseReview[];
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
  isFree?: boolean;
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
  ministryExamDate?: string; // ISO date format, e.g. 2026-06-14
  homeIntroVideoUrl?: string;
  homeVideoPlacement?: 'top' | 'below_hero' | 'below_courses' | 'bottom' | 'hidden';
  autoParentReportTemplate?: string;
  enable2FA?: boolean;
  admin2FASecret?: string;
  vodafoneCashNumber?: string;
  instapayUsername?: string;
  fawryServiceCode?: string;
}

export type PaymentMethodType = 'vodafone_cash' | 'instapay' | 'fawry' | 'orange_cash' | 'etisalat_cash' | 'we_pay' | 'paymob' | 'custom';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  accountNumber: string;
  accountName?: string;
  instructions?: string;
  qrCodeUrl?: string;
  paymentLink?: string;
  isActive: boolean;
  order: number;
}

export type WalletTransactionType = 'deposit' | 'purchase' | 'refund';
export type WalletTransactionStatus = 'pending' | 'approved' | 'rejected';

export interface WalletTransaction {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  type: WalletTransactionType;
  amount: number;
  status: WalletTransactionStatus;
  methodId?: string;
  methodName?: string;
  transactionRefNumber?: string; // رقم الحوالة / العملية
  receiptImageUrl?: string;
  courseId?: string;
  courseTitle?: string;
  pdfId?: string;
  pdfTitle?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export interface AdminAuditLogEntry {
  id: string;
  action: string;
  category: 'course' | 'exam' | 'student' | 'wallet' | 'pdf' | 'security' | 'settings' | 'notification';
  description: string;
  adminIdentifier: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface LessonComment {
  id: string;
  lessonId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  studentAvatar?: string;
  content: string;
  rating?: number; // 1-5 stars
  adminReply?: string;
  adminRepliedAt?: string;
  createdAt: string;
}

export interface SmartStudyRecommendation {
  id: string;
  studentId: string;
  title: string;
  reason: string;
  recommendedCourseId?: string;
  recommendedCourseTitle?: string;
  recommendedLessonId?: string;
  recommendedLessonTitle?: string;
  recommendedPdfId?: string;
  recommendedPdfTitle?: string;
  targetExamScore?: number;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface WeaknessPoint {
  id: string;
  examId: string;
  examTitle: string;
  questionId: string;
  conceptName: string;
  chapterOrUnit: string;
  errorReason: string;
  suggestedLessonId?: string;
  suggestedLessonTitle?: string;
  suggestedAction: string;
  frequency: number;
  lastMissedAt: string;
  isResolved?: boolean;
}

export interface StudentWeaknessProfile {
  studentId: string;
  weakPoints: WeaknessPoint[];
  masteredConcepts: string[];
  totalQuestionsAttempted: number;
  totalErrors: number;
  updatedAt: string;
}

export interface WeeklyChallengeQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  grade: GradeLevel | string;
  startDate: string;
  endDate: string;
  bonusPoints: number;
  questions: WeeklyChallengeQuestion[];
  isPublished: boolean;
}

export interface StudentBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: 'points' | 'exams' | 'streak' | 'challenge';
}

export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  grade: string;
  governorate: string;
  points: number;
  completedExamsCount: number;
  rank?: number;
  badges: StudentBadge[];
  weeklyScore: number;
  lastActive: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle?: string;
  unitId?: string;
  lessonId?: string;
  lessonTitle?: string;
  title: string;
  description?: string;
  pdfUrl: string;
  deadline?: string; // ISO string
  maxGrade: number;
  gradeLevel?: GradeLevel | string;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  studentGrade?: string;
  submittedAt: string;
  annotatedPdfData: string; // JSON string of drawing layers or PDF URL with annotations
  submissionType?: 'upload' | 'draw' | 'both';
  solutionFiles?: string[]; // URLs or base64 of uploaded solution images/PDF pages
  studentNotes?: string; // Notes or explanations from the student
  status: 'pending' | 'graded'; // قيد المراجعة | تم التصحيح
  grade?: number;
  maxGrade?: number;
  teacherNotes?: string;
  teacherAnnotatedData?: string;
  feedbackStatus?: 'approved' | 'needs_revision' | 'excellent';
  gradedAt?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  timestamp: string;
  lessonId?: string;
  courseId?: string;
}

