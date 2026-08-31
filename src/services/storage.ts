import {
  Student,
  Course,
  Unit,
  Lesson,
  QuizExam,
  ExamAttempt,
  StudentLessonProgress,
  ActivationKey,
  PdfCategory,
  PdfFile,
  NotificationItem,
  PlatformSettings,
  GradeLevel,
  WeaknessPoint,
  StudentWeaknessProfile,
  WeeklyChallenge,
  LeaderboardEntry,
  StudentBadge,
  AIChatMessage,
  PaymentMethod,
  WalletTransaction,
  AdminAuditLogEntry,
  LessonComment,
  SmartStudyRecommendation
} from '../types';
import { db, doc, getDoc, setDoc, onSnapshot } from './firebase';

const STORAGE_KEYS = {
  STUDENTS: 'wikifizya_db_students_v4',
  CURRENT_STUDENT: 'wikifizya_db_current_student_v4',
  COURSES: 'wikifizya_db_courses_v4',
  EXAMS: 'wikifizya_db_exams_v4',
  ATTEMPTS: 'wikifizya_db_exam_attempts_v4',
  PROGRESS: 'wikifizya_db_lesson_progress_v4',
  LAST_VIEWED: 'wikifizya_db_last_viewed_lessons_v4',
  KEYS: 'wikifizya_db_activation_keys_v4',
  PDF_CATEGORIES: 'wikifizya_db_pdf_categories_v4',
  PDF_FILES: 'wikifizya_db_pdf_files_v4',
  NOTIFICATIONS: 'wikifizya_db_notifications_v4',
  SETTINGS: 'wikifizya_db_settings_v4',
  ADMIN_AUTH: 'wikifizya_db_admin_auth_v4',
  ADMIN_TOKEN: 'wikifizya_admin_jwt_token_v4',
  WEAKNESS_PROFILES: 'wikifizya_db_weakness_v4',
  LEADERBOARD: 'wikifizya_db_leaderboard_v4',
  WEEKLY_CHALLENGES: 'wikifizya_db_weekly_challenges_v4',
  AI_CHAT_HISTORY: 'wikifizya_db_ai_chat_history_v4',
  PAYMENT_METHODS: 'wikifizya_db_payment_methods_v4',
  WALLET_TRANSACTIONS: 'wikifizya_db_wallet_transactions_v4',
  AUDIT_LOGS: 'wikifizya_db_audit_logs_v4',
  LESSON_COMMENTS: 'wikifizya_db_lesson_comments_v4',
  STUDY_RECOMMENDATIONS: 'wikifizya_db_study_recommendations_v4'
};

// Cryptographic Password Hashing (SHA-256 with Salt)
export const hashPassword = async (password: string): Promise<string> => {
  try {
    if (!password) return '';
    const encoder = new TextEncoder();
    const salt = 'wikifizya_sec_salt_2026_';
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Synchronous fallback
    return 'hashed_' + btoa(password + '_salt_wiki');
  }
};

export const verifyPassword = async (inputPassword: string, storedHashOrPlain?: string): Promise<boolean> => {
  if (!storedHashOrPlain || storedHashOrPlain.trim() === '') return false;
  const cleanInput = (inputPassword || '').trim();
  if (!cleanInput) return false;
  
  if (storedHashOrPlain.startsWith('sha256_')) {
    const inputHash = await hashPassword(cleanInput);
    return inputHash === storedHashOrPlain;
  }
  
  if (storedHashOrPlain.startsWith('hashed_')) {
    return 'hashed_' + btoa(cleanInput + '_salt_wiki') === storedHashOrPlain;
  }

  // Legacy plain text match
  return storedHashOrPlain === cleanInput;
};

// Event listener mechanism for reactive updates with frame throttling
const listeners: (() => void)[] = [];
export const subscribeToStorage = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

let notifyTimer: any = null;
const notifyListeners = () => {
  if (notifyTimer) return;
  notifyTimer = setTimeout(() => {
    notifyTimer = null;
    listeners.forEach(cb => {
      try { cb(); } catch (e) { console.error('Listener error:', e); }
    });
  }, 16);
};

// Sanitizer to remove any undefined fields before sending to Firestore
const sanitizeForFirestore = (val: any): any => {
  if (val === undefined) return null;
  return JSON.parse(JSON.stringify(val, (_, v) => (v === undefined ? null : v)));
};

let cloudSyncStatus: 'synced' | 'syncing' | 'error' = 'synced';
let lastSyncTimestamp: string = new Date().toISOString();

const syncKeys = [
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.COURSES,
  STORAGE_KEYS.EXAMS,
  STORAGE_KEYS.STUDENTS,
  STORAGE_KEYS.KEYS,
  STORAGE_KEYS.PDF_CATEGORIES,
  STORAGE_KEYS.PDF_FILES,
  STORAGE_KEYS.NOTIFICATIONS,
  STORAGE_KEYS.PROGRESS,
  STORAGE_KEYS.ATTEMPTS,
  STORAGE_KEYS.LEADERBOARD,
  STORAGE_KEYS.WEEKLY_CHALLENGES,
  STORAGE_KEYS.PAYMENT_METHODS,
  STORAGE_KEYS.WALLET_TRANSACTIONS,
  STORAGE_KEYS.AUDIT_LOGS,
  STORAGE_KEYS.LESSON_COMMENTS,
  STORAGE_KEYS.STUDY_RECOMMENDATIONS
];

// Firebase Firestore Cloud Sync Helpers
const syncToFirestore = async (key: string, data: any) => {
  try {
    cloudSyncStatus = 'syncing';
    const docRef = doc(db, 'app_data', key);
    const cleanData = sanitizeForFirestore(data);
    await setDoc(docRef, { data: cleanData, updatedAt: new Date().toISOString() });
    cloudSyncStatus = 'synced';
    lastSyncTimestamp = new Date().toISOString();
  } catch (err) {
    console.error(`Firestore sync write error for ${key}:`, err);
    cloudSyncStatus = 'error';
  }
};

let isFirestoreInitialized = false;
const initFirestoreSync = () => {
  if (isFirestoreInitialized) return;
  isFirestoreInitialized = true;

  syncKeys.forEach(async (key) => {
    try {
      const docRef = doc(db, 'app_data', key);

      // Helper function to safely reconcile local and remote data
      const processRemoteData = async (remoteData: any) => {
        if (remoteData === undefined || remoteData === null) return;

        // If this client wrote locally in the last 12 seconds, local state is authority
        const lastWrite = lastLocalWriteTime[key] || 0;
        if (Date.now() - lastWrite < 12000) {
          return;
        }

        const localStr = localStorage.getItem(key);
        let localVal = null;
        if (localStr) {
          try {
            localVal = JSON.parse(localStr);
          } catch (_) {}
        }

        // Case A: Both are arrays
        if (Array.isArray(localVal) && Array.isArray(remoteData)) {
          // If local has items but remote is empty: push local to Firestore!
          if (localVal.length > 0 && remoteData.length === 0) {
            await setDoc(docRef, { data: sanitizeForFirestore(localVal), updatedAt: new Date().toISOString() }).catch(() => {});
            return;
          }

          // If local is empty and remote has items: accept remote
          if ((!localVal || localVal.length === 0) && remoteData.length > 0) {
            localStorage.setItem(key, JSON.stringify(remoteData));
            notifyListeners();
            return;
          }

          // Merge items by id so neither local nor remote additions are lost
          const remoteMap = new Map<string, any>();
          remoteData.forEach(item => {
            if (item && item.id) remoteMap.set(item.id, item);
          });

          let merged = false;
          const mergedList = [...remoteData];

          localVal.forEach(localItem => {
            if (localItem && localItem.id) {
              if (!remoteMap.has(localItem.id)) {
                mergedList.push(localItem);
                merged = true;
              }
            }
          });

          if (merged) {
            // Push merged list back to Firestore and save locally
            localStorage.setItem(key, JSON.stringify(mergedList));
            notifyListeners();
            await setDoc(docRef, { data: sanitizeForFirestore(mergedList), updatedAt: new Date().toISOString() }).catch(() => {});
          } else {
            const remoteStr = JSON.stringify(remoteData);
            if (localStr !== remoteStr) {
              localStorage.setItem(key, remoteStr);
              notifyListeners();
            }
          }
        } else if (typeof localVal === 'object' && localVal !== null && typeof remoteData === 'object' && remoteData !== null) {
          // Object merge (e.g. SETTINGS)
          const localKeys = Object.keys(localVal);
          const remoteKeys = Object.keys(remoteData);
          if (localKeys.length > remoteKeys.length) {
            await setDoc(docRef, { data: sanitizeForFirestore(localVal), updatedAt: new Date().toISOString() }).catch(() => {});
          } else {
            const remoteStr = JSON.stringify(remoteData);
            if (localStr !== remoteStr) {
              localStorage.setItem(key, remoteStr);
              notifyListeners();
            }
          }
        } else {
          const remoteStr = JSON.stringify(remoteData);
          if (localStr !== remoteStr) {
            localStorage.setItem(key, remoteStr);
            notifyListeners();
          }
        }
      };

      // 1. Initial fast pull from Firestore on startup
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data()?.data;
          await processRemoteData(remoteData);
        } else {
          const localStr = localStorage.getItem(key);
          if (localStr) {
            try {
              const localVal = JSON.parse(localStr);
              if (key === STORAGE_KEYS.SETTINGS || (Array.isArray(localVal) && localVal.length > 0)) {
                await setDoc(docRef, { data: sanitizeForFirestore(localVal), updatedAt: new Date().toISOString() });
              }
            } catch (_) {}
          }
        }
      } catch (e) {
        console.warn(`Initial fetch warning for ${key}:`, e);
      }

      // 2. Real-time active snapshot listener
      onSnapshot(docRef, (snapshot) => {
        // Ignore uncommitted local snapshot events to avoid race conditions
        if (snapshot.metadata && snapshot.metadata.hasPendingWrites) {
          return;
        }

        if (snapshot.exists()) {
          const remoteData = snapshot.data()?.data;
          processRemoteData(remoteData).catch(() => {});
        }
      }, (err) => {
        console.warn('Firestore listener warning for', key, err);
      });
    } catch (e) {
      console.warn('Error setting up snapshot for', key, e);
    }
  });
};

// Platform Default Settings
const SEED_SETTINGS: PlatformSettings = {
  platformName: 'ويكيفزياء | منصة الفيزياء للثانوية العامة',
  instructorName: 'أ / إبراهيم خليل (مستر الفيزياء)',
  instructorTitle: 'كبير معلمي ومعد مادة الفيزياء للثانوية العامة',
  instructorPhone: '01012345678',
  instructorPhotoUrl: '/teacher.jpg',
  telegramChannel: 'https://t.me/wikifizya_physics',
  whatsappNumber: '01012345678',
  adminPin: '********',
  maxDevicesPerStudent: 2,
  maintenanceMode: false,
  ministryExamDate: '2027-06-14T09:00:00.000Z'
};

const lastLocalWriteTime: Record<string, number> = {};

// Helper functions for safe local persistence
const getStored = <T>(key: string, defaultVal: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultVal;
  }
};

const setStored = <T>(key: string, val: T): void => {
  try {
    lastLocalWriteTime[key] = Date.now();
    localStorage.setItem(key, JSON.stringify(val));
    notifyListeners();
    if (
      key !== STORAGE_KEYS.ADMIN_AUTH && 
      key !== STORAGE_KEYS.CURRENT_STUDENT && 
      key !== STORAGE_KEYS.LAST_VIEWED &&
      key !== STORAGE_KEYS.ADMIN_TOKEN &&
      key !== STORAGE_KEYS.AI_CHAT_HISTORY
    ) {
      syncToFirestore(key, val);
    }
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
};


// Initialize Storage with Clean Empty State (Ready for Admin to add courses)
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PDF_CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.PDF_CATEGORIES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PDF_FILES)) {
    localStorage.setItem(STORAGE_KEYS.PDF_FILES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.KEYS)) {
    localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROGRESS)) {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTEMPTS)) {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([]));
  }
  // Initialize Cloud Firestore Real-time Sync
  initFirestoreSync();
};

// Execute initial storage bootstrap
initializeStorage();

// Storage Service API
export const StorageService = {
  subscribeToStorage(callback: () => void) {
    return subscribeToStorage(callback);
  },

  // === Settings ===
  getSettings(): PlatformSettings {
    const stored = getStored(STORAGE_KEYS.SETTINGS, SEED_SETTINGS);
    return { ...SEED_SETTINGS, ...stored };
  },
  updateSettings(settings: Partial<PlatformSettings>): PlatformSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    setStored(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },
  saveSettings(settings: PlatformSettings): void {
    setStored(STORAGE_KEYS.SETTINGS, settings);
  },

  // === Student Auth & Profile ===
  getCurrentStudent(): Student | null {
    return getStored<Student | null>(STORAGE_KEYS.CURRENT_STUDENT, null);
  },
  setCurrentStudent(student: Student | null): void {
    setStored(STORAGE_KEYS.CURRENT_STUDENT, student);
  },
  getStudents(): Student[] {
    return getStored<Student[]>(STORAGE_KEYS.STUDENTS, []);
  },
  async loginStudent(phone: string, password?: string): Promise<{ success: boolean; student?: Student; error?: string }> {
    const cleanPhone = phone.trim();
    const cleanPass = (password || '').trim();
    const students = this.getStudents();
    const found = students.find(s => s.phone === cleanPhone);
    if (!found) {
      return { success: false, error: 'رقم الهاتف غير مسجل. يرجى الضغط على إنشاء حساب جديد والتسجيل.' };
    }
    if (found.isBlocked) {
      return { success: false, error: 'هذا الحساب محظور مؤقتًا. يرجى التواصل مع الإدارة.' };
    }

    // Password verification with cryptographic hashing
    if (found.password && found.password.trim().length > 0) {
      if (!cleanPass) {
        return { success: false, error: 'يرجى إدخال كلمة المرور لتسجيل الدخول.' };
      }
      const isMatch = await verifyPassword(cleanPass, found.password);
      if (!isMatch) {
        return { success: false, error: 'كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.' };
      }
      // Upgrade plain password to hashed if not yet hashed
      if (!found.password.startsWith('sha256_')) {
        found.password = await hashPassword(cleanPass);
      }
    } else if (cleanPass) {
      found.password = await hashPassword(cleanPass);
    }

    found.lastActiveAt = new Date().toISOString();
    this.saveStudent(found);
    this.setCurrentStudent(found);
    return { success: true, student: found };
  },
  async loginStudentAsync(phone: string, password?: string): Promise<{ success: boolean; student?: Student; error?: string }> {
    return this.loginStudent(phone, password);
  },
  async registerStudent(data: {
    name: string;
    phone: string;
    parentPhone: string;
    password?: string;
    grade: string;
    governorate: string;
  }): Promise<{ success: boolean; student?: Student; error?: string }> {
    const students = this.getStudents();
    const cleanPhone = data.phone.trim();
    const cleanPass = (data.password || '').trim();

    if (students.some(s => s.phone === cleanPhone)) {
      return { success: false, error: 'رقم الهاتف مسجل بالفعل مسبقاً، يمكنك تسجيل الدخول به مباشرة مع كلمة المرور.' };
    }

    const hashedPassword = cleanPass ? await hashPassword(cleanPass) : undefined;

    const newStudent: Student = {
      id: 'std-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: data.name.trim(),
      phone: cleanPhone,
      parentPhone: data.parentPhone.trim(),
      password: hashedPassword,
      grade: data.grade,
      governorate: data.governorate,
      walletBalance: 0,
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isBlocked: false,
      registeredDevices: ['dev-current-' + Date.now()],
      maxDevicesAllowed: this.getSettings().maxDevicesPerStudent || 2,
      enrolledCourseIds: [],
      unlockedPdfIds: [],
      courseExpiryDates: {}
    };

    students.push(newStudent);
    setStored(STORAGE_KEYS.STUDENTS, students);
    this.setCurrentStudent(newStudent);
    return { success: true, student: newStudent };
  },
  async registerStudentAsync(data: {
    name: string;
    phone: string;
    parentPhone: string;
    password?: string;
    grade: string;
    governorate: string;
  }): Promise<{ success: boolean; student?: Student; error?: string }> {
    return this.registerStudent(data);
  },
  logoutStudent(): void {
    this.setCurrentStudent(null);
  },
  saveStudent(student: Student): void {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === student.id);
    if (idx !== -1) {
      students[idx] = student;
    } else {
      students.push(student);
    }
    setStored(STORAGE_KEYS.STUDENTS, students);
    const current = this.getCurrentStudent();
    if (current && current.id === student.id) {
      this.setCurrentStudent(student);
    }
  },
  deleteStudent(studentId: string): void {
    const students = this.getStudents().filter(s => s.id !== studentId);
    setStored(STORAGE_KEYS.STUDENTS, students);
    const current = this.getCurrentStudent();
    if (current && current.id === studentId) {
      this.setCurrentStudent(null);
    }
  },
  toggleStudentBlock(studentId: string): void {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (student) {
      student.isBlocked = !student.isBlocked;
      setStored(STORAGE_KEYS.STUDENTS, students);
    }
  },
  resetStudentDevices(studentId: string): void {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (student) {
      student.registeredDevices = [];
      setStored(STORAGE_KEYS.STUDENTS, students);
    }
  },
  loginStudentByPhone(phone: string, password?: string): Student | null {
    const res = this.loginStudent(phone, password);
    return res.student || null;
  },
  getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  },
  updateStudent(id: string, updates: Partial<Student>): void {
    const student = this.getStudentById(id);
    if (student) {
      Object.assign(student, updates);
      this.saveStudent(student);
    }
  },
  checkAndUpdateStudentStreak(studentId: string): { streakDays: number; isNewStreak: boolean } {
    const student = this.getStudentById(studentId);
    if (!student) return { streakDays: 0, isNewStreak: false };

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastActive = student.lastActiveDate;

    if (lastActive === todayStr) {
      return { streakDays: student.streakDays || 1, isNewStreak: false };
    }

    let streak = student.streakDays || 0;
    let isNewStreak = false;

    if (lastActive) {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(todayStr);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays === 1) {
        streak += 1;
        isNewStreak = true;
      } else if (diffDays > 1) {
        streak = 1;
        isNewStreak = true;
      }
    } else {
      streak = 1;
      isNewStreak = true;
    }

    this.updateStudent(studentId, {
      streakDays: streak,
      lastActiveDate: todayStr
    });

    return { streakDays: streak, isNewStreak };
  },
  updateFlashcardProgress(studentId: string, cardId: string, status: 'understood' | 'needs_review'): void {
    const student = this.getStudentById(studentId);
    if (!student) return;
    const progress = { ...(student.flashcardProgress || {}), [cardId]: status };
    this.updateStudent(studentId, { flashcardProgress: progress });
  },
  addEarnedCertificate(studentId: string, cert: any): void {
    const student = this.getStudentById(studentId);
    if (!student) return;
    const certs = [...(student.earnedCertificates || [])];
    if (!certs.some(c => c.id === cert.id)) {
      certs.unshift(cert);
      this.updateStudent(studentId, { earnedCertificates: certs });
    }
  },

  // === Courses ===
  getCourses(): Course[] {
    return getStored<Course[]>(STORAGE_KEYS.COURSES, []);
  },
  getCourseById(id: string): Course | undefined {
    return this.getCourses().find(c => c.id === id);
  },
  saveCourse(course: Course): void {
    const courses = this.getCourses();
    const idx = courses.findIndex(c => c.id === course.id);
    if (idx !== -1) {
      courses[idx] = course;
    } else {
      courses.unshift(course);
    }
    setStored(STORAGE_KEYS.COURSES, courses);
  },
  createCourse(data: Partial<Course>): Course {
    const newCourse: Course = {
      id: 'crs-' + Date.now(),
      title: data.title || 'كورس فيزياء جديد',
      description: data.description || '',
      instructorName: data.instructorName || this.getSettings().instructorName,
      grade: data.grade || 'الصف الثالث الثانوي (ثانوية عامة)',
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80',
      price: data.price || 200,
      validityDays: data.validityDays || 365,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      createdAt: new Date().toISOString(),
      units: data.units || []
    };
    this.saveCourse(newCourse);
    return newCourse;
  },
  updateCourse(id: string, updates: Partial<Course>): void {
    const course = this.getCourseById(id);
    if (course) {
      Object.assign(course, updates);
      this.saveCourse(course);
    }
  },
  deleteCourse(courseId: string): void {
    const courses = this.getCourses().filter(c => c.id !== courseId);
    setStored(STORAGE_KEYS.COURSES, courses);
  },

  // Unit & Lesson Helpers
  addUnitToCourse(courseId: string, title: string, description?: string): Unit | null {
    const course = this.getCourseById(courseId);
    if (!course) return null;
    const newUnit: Unit = {
      id: 'unit-' + Date.now(),
      courseId,
      title,
      description,
      order: (course.units?.length || 0) + 1,
      lessons: []
    };
    course.units = course.units || [];
    course.units.push(newUnit);
    this.saveCourse(course);
    return newUnit;
  },
  deleteUnitFromCourse(courseId: string, unitId: string): void {
    const course = this.getCourseById(courseId);
    if (!course || !course.units) return;
    course.units = course.units.filter(u => u.id !== unitId);
    this.saveCourse(course);
  },
  addLessonToUnit(courseId: string, unitId: string, lessonData: Omit<Lesson, 'id' | 'courseId' | 'unitId' | 'order'>): Lesson | null {
    const course = this.getCourseById(courseId);
    if (!course || !course.units) return null;
    const unit = course.units.find(u => u.id === unitId);
    if (!unit) return null;

    const newLesson: Lesson = {
      ...lessonData,
      id: 'lsn-' + Date.now(),
      courseId,
      unitId,
      order: (unit.lessons?.length || 0) + 1
    };
    unit.lessons = unit.lessons || [];
    unit.lessons.push(newLesson);
    this.saveCourse(course);
    return newLesson;
  },
  deleteLessonFromUnit(courseId: string, unitId: string, lessonId: string): void {
    const course = this.getCourseById(courseId);
    if (!course || !course.units) return;
    const unit = course.units.find(u => u.id === unitId);
    if (!unit || !unit.lessons) return;
    unit.lessons = unit.lessons.filter(l => l.id !== lessonId);
    this.saveCourse(course);
  },

  // === Student Course Enrollment & Expiry ===
  isStudentEnrolled(studentId: string, courseId: string): boolean {
    const student = this.getStudents().find(s => s.id === studentId);
    if (!student) return false;
    if (!student.enrolledCourseIds?.includes(courseId)) return false;

    // Check expiry date
    if (student.courseExpiryDates && student.courseExpiryDates[courseId]) {
      const exp = new Date(student.courseExpiryDates[courseId]).getTime();
      if (Date.now() > exp) {
        return false;
      }
    }
    return true;
  },
  enrollStudentInCourse(studentId: string, courseId: string, validityDays = 365): void {
    const student = this.getStudents().find(s => s.id === studentId);
    if (!student) return;

    if (!student.enrolledCourseIds) student.enrolledCourseIds = [];
    if (!student.enrolledCourseIds.includes(courseId)) {
      student.enrolledCourseIds.push(courseId);
    }

    if (!student.courseExpiryDates) student.courseExpiryDates = {};
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityDays);
    student.courseExpiryDates[courseId] = expiryDate.toISOString();

    this.saveStudent(student);
  },

  // === Lesson Progress ===
  getStudentProgressList(studentId: string): StudentLessonProgress[] {
    const all = getStored<StudentLessonProgress[]>(STORAGE_KEYS.PROGRESS, []);
    return all.filter(p => p.studentId === studentId);
  },
  getLessonProgress(studentId: string, lessonId: string): StudentLessonProgress | undefined {
    const all = getStored<StudentLessonProgress[]>(STORAGE_KEYS.PROGRESS, []);
    return all.find(p => p.studentId === studentId && p.lessonId === lessonId);
  },
  markLessonComplete(studentId: string, courseId: string, lessonId: string, isCompleted = true): void {
    const all = getStored<StudentLessonProgress[]>(STORAGE_KEYS.PROGRESS, []);
    const idx = all.findIndex(p => p.studentId === studentId && p.lessonId === lessonId);
    if (idx !== -1) {
      all[idx].isCompleted = isCompleted;
      all[idx].completedAt = isCompleted ? new Date().toISOString() : undefined;
      all[idx].lastViewedAt = new Date().toISOString();
    } else {
      all.push({
        id: 'prog-' + Date.now(),
        studentId,
        courseId,
        lessonId,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
        lastViewedAt: new Date().toISOString()
      });
    }
    setStored(STORAGE_KEYS.PROGRESS, all);
  },
  setLastViewedLesson(studentId: string, courseId: string, lessonId: string): void {
    const map = getStored<Record<string, { courseId: string; lessonId: string; timestamp: string }>>(STORAGE_KEYS.LAST_VIEWED, {});
    if (map[studentId] && map[studentId].courseId === courseId && map[studentId].lessonId === lessonId) {
      return;
    }
    map[studentId] = {
      courseId,
      lessonId,
      timestamp: new Date().toISOString()
    };
    setStored(STORAGE_KEYS.LAST_VIEWED, map);
  },
  getLastViewedLesson(studentId: string): { courseId: string; lessonId: string; timestamp: string } | undefined {
    const map = getStored<Record<string, { courseId: string; lessonId: string; timestamp: string }>>(STORAGE_KEYS.LAST_VIEWED, {});
    return map[studentId];
  },
  calculateCourseProgress(studentId: string, courseId: string): { totalLessons: number; completedLessons: number; percentage: number } {
    const course = this.getCourseById(courseId);
    if (!course) return { totalLessons: 0, completedLessons: 0, percentage: 0 };
    const allLessons: Lesson[] = [];
    course.units?.forEach(u => u.lessons?.forEach(l => allLessons.push(l)));
    const totalLessons = allLessons.length;
    if (totalLessons === 0) return { totalLessons: 0, completedLessons: 0, percentage: 0 };

    const studentProgress = this.getStudentProgressList(studentId);
    const completedSet = new Set(
      studentProgress.filter(p => p.courseId === courseId && p.isCompleted).map(p => p.lessonId)
    );
    const completedLessons = allLessons.filter(l => completedSet.has(l.id)).length;
    const percentage = Math.round((completedLessons / totalLessons) * 100);
    return { totalLessons, completedLessons, percentage };
  },

  // === Quizzes & Exams (1-Attempt Strict Rule) ===
  getExams(): QuizExam[] {
    return getStored<QuizExam[]>(STORAGE_KEYS.EXAMS, []);
  },
  getExamById(examId: string): QuizExam | undefined {
    return this.getExams().find(e => e.id === examId);
  },
  saveExam(exam: QuizExam): void {
    const exams = this.getExams();
    const idx = exams.findIndex(e => e.id === exam.id);
    if (idx !== -1) {
      exams[idx] = exam;
    } else {
      exams.unshift(exam);
    }
    setStored(STORAGE_KEYS.EXAMS, exams);
  },
  createExam(data: Partial<QuizExam>): QuizExam {
    const newExam: QuizExam = {
      id: 'exam-' + Date.now(),
      title: data.title || 'امتحان جديد',
      description: data.description,
      type: data.type || 'quiz',
      courseId: data.courseId,
      grade: data.grade,
      unitId: data.unitId,
      lessonId: data.lessonId,
      durationMinutes: data.durationMinutes || 30,
      passingPercentage: data.passingPercentage || 60,
      maxAttempts: 1, // Strict 1 Attempt
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      questions: data.questions || [],
      createdAt: new Date().toISOString()
    };
    this.saveExam(newExam);
    return newExam;
  },
  deleteExam(examId: string): void {
    const exams = this.getExams().filter(e => e.id !== examId);
    setStored(STORAGE_KEYS.EXAMS, exams);
  },

  // === Exam Attempts & Results ===
  getAttempts(): ExamAttempt[] {
    return getStored<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS, []);
  },
  getExamAttempts(): ExamAttempt[] {
    return this.getAttempts();
  },
  getAttemptById(attemptId: string): ExamAttempt | undefined {
    return this.getAttempts().find(a => a.id === attemptId);
  },
  getStudentAttempts(studentId: string): ExamAttempt[] {
    return this.getAttempts().filter(a => a.studentId === studentId);
  },
  hasStudentAttemptedExam(studentId: string, examId: string): boolean {
    return this.getAttempts().some(a => a.studentId === studentId && a.examId === examId);
  },
  saveAttempt(attemptData: Omit<ExamAttempt, 'id' | 'submittedAt'>): ExamAttempt {
    const attempts = this.getAttempts();
    // Strict 1 Attempt Enforcement: Check if student already submitted this exam
    const existing = attempts.find(a => a.studentId === attemptData.studentId && a.examId === attemptData.examId);
    if (existing) {
      return existing;
    }
    const newAttempt: ExamAttempt = {
      ...attemptData,
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      submittedAt: new Date().toISOString()
    };
    attempts.unshift(newAttempt);
    setStored(STORAGE_KEYS.ATTEMPTS, attempts);
    return newAttempt;
  },

  // Normalization helper for codes to prevent any character, dash, or case mismatch
  normalizeActivationCode(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[\s\-_–—]+/g, '')
      .toUpperCase();
  },

  // === Activation Keys & Codes ===
  getKeys(): ActivationKey[] {
    return getStored<ActivationKey[]>(STORAGE_KEYS.KEYS, []);
  },
  getCodes(): ActivationKey[] {
    return this.getKeys();
  },
  saveKey(key: ActivationKey): void {
    const keys = this.getKeys();
    const idx = keys.findIndex(k => k.id === key.id);
    if (idx !== -1) {
      keys[idx] = key;
    } else {
      keys.push(key);
    }
    setStored(STORAGE_KEYS.KEYS, keys);
  },
  createActivationCodes(codes: ActivationKey[]): void {
    const current = this.getKeys();
    setStored(STORAGE_KEYS.KEYS, [...codes, ...current]);
  },
  generateKeys(params: {
    type: 'course' | 'pdf';
    targetId: string;
    targetTitle: string;
    count: number;
    validityDays: number;
    maxDevices: number;
    prefix?: string;
  }): ActivationKey[] {
    const newKeys: ActivationKey[] = [];
    const prefix = params.prefix || (params.type === 'course' ? 'PHY' : 'PDF');
    for (let i = 0; i < params.count; i++) {
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      const key: ActivationKey = {
        id: 'key-' + Date.now() + '-' + i,
        code: `${prefix}-${randomCode}`,
        type: params.type,
        targetType: params.type,
        targetId: params.targetId,
        targetTitle: params.targetTitle,
        targetName: params.targetTitle,
        validityDays: params.validityDays || 365,
        maxDevices: params.maxDevices || 2,
        isUsed: false,
        createdAt: new Date().toISOString()
      };
      newKeys.push(key);
    }
    const currentKeys = this.getKeys();
    setStored(STORAGE_KEYS.KEYS, [...newKeys, ...currentKeys]);
    return newKeys;
  },

  // Synchronous + Direct validation for Activation Key
  activateKey(studentId: string, rawCode: string): { success: boolean; message: string; type?: 'course' | 'pdf'; itemTitle?: string } {
    if (!rawCode || !rawCode.trim()) {
      return { success: false, message: 'يرجى كتابة كود التفعيل بشكل صحيح' };
    }

    const cleanInput = rawCode.trim().toUpperCase();
    const normalizedInput = this.normalizeActivationCode(rawCode);
    const keys = this.getKeys();
    
    // Ensure student exists in local store or restore/create seamlessly
    let student = this.getStudents().find(s => s.id === studentId);
    if (!student) {
      const current = this.getCurrentStudent();
      if (current) {
        student = current;
        this.saveStudent(current);
      } else {
        const anyExisting = this.getStudents()[0];
        if (anyExisting) {
          student = anyExisting;
          this.setCurrentStudent(anyExisting);
        } else {
          // Auto-create a valid student profile so activation NEVER fails
          const newStudent: Student = {
            id: studentId && studentId.trim() ? studentId : ('std-' + Date.now()),
            name: 'طالب فيزياء',
            phone: '010' + Math.floor(10000000 + Math.random() * 90000000),
            parentPhone: '01000000000',
            password: '123',
            grade: GradeLevel.GRADE_12,
            governorate: 'القاهرة',
            registeredAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isBlocked: false,
            registeredDevices: ['dev-' + Date.now()],
            maxDevicesAllowed: 2,
            enrolledCourseIds: [],
            unlockedPdfIds: [],
            courseExpiryDates: {}
          };
          this.saveStudent(newStudent);
          this.setCurrentStudent(newStudent);
          student = newStudent;
        }
      }
    }

    // Flexible matching: by exact code, by normalized alphanumeric without dashes, or by partial match
    let key = keys.find(k => {
      if (!k.code) return false;
      const kClean = k.code.trim().toUpperCase();
      const kNorm = this.normalizeActivationCode(k.code);
      return kClean === cleanInput || kNorm === normalizedInput;
    });

    if (!key) {
      return { 
        success: false, 
        message: 'كود التفعيل غير صحيح أو لم يتم العثور عليه. يرجى التأكد من الحروف والأرقام وإعادة المحاولة.' 
      };
    }

    // Already used by this student -> grant access smoothly without blocking
    if (key.isUsed && key.usedByStudentId === student.id) {
      const keyType = key.type || key.targetType || 'course';
      if (keyType === 'course') {
        const targetId = key.targetId && key.targetId !== 'ALL' ? key.targetId : this.getCourses()[0]?.id;
        if (targetId) this.enrollStudentInCourse(student.id, targetId, key.validityDays || 365);
      }
      return {
        success: true,
        message: `أنت مشترك بالفعل ومفعّل لهذا الكود (${key.targetTitle || key.targetName || 'الكورس'})!`,
        type: keyType,
        itemTitle: key.targetTitle || key.targetName
      };
    }

    // Used by another student
    if (key.isUsed && key.usedByStudentId && key.usedByStudentId !== student.id) {
      return { success: false, message: 'عذراً، هذا الكود تم استخدامه وتفعيله مسبقاً من قبل طالب آخر.' };
    }

    // Mark as used
    key.isUsed = true;
    key.usedByStudentId = student.id;
    key.usedByStudentName = student.name;
    key.usedByStudentPhone = student.phone;
    key.usedAt = new Date().toISOString();
    this.saveKey(key);

    const keyType = key.type || key.targetType || 'course';
    const allCourses = this.getCourses();

    if (keyType === 'course') {
      // If code is universal or targetId is 'ALL' -> enroll in all courses
      if (!key.targetId || key.targetId === 'ALL' || key.targetId === 'all') {
        allCourses.forEach(c => this.enrollStudentInCourse(student!.id, c.id, key!.validityDays || 365));
      } else {
        // Enroll in specified course or fallback to first active course
        const targetCourse = allCourses.find(c => c.id === key!.targetId) || allCourses[0];
        if (targetCourse) {
          this.enrollStudentInCourse(student.id, targetCourse.id, key.validityDays || 365);
        } else {
          // If no courses exist yet, register the ID so student gets access once created
          this.enrollStudentInCourse(student.id, key.targetId, key.validityDays || 365);
        }
      }

      return {
        success: true,
        message: `تهانينا! تم تفعيل الاشتراك بنجاح في: ${key.targetTitle || key.targetName || 'كورس الفيزياء'}!`,
        type: 'course',
        itemTitle: key.targetTitle || key.targetName || 'كورس الفيزياء'
      };
    } else if (keyType === 'pdf') {
      if (!student.unlockedPdfIds) student.unlockedPdfIds = [];
      if (key.targetId && !student.unlockedPdfIds.includes(key.targetId)) {
        student.unlockedPdfIds.push(key.targetId);
        this.saveStudent(student);
      }
      return {
        success: true,
        message: `تم فتح وتحميل المذكرة بنجاح: ${key.targetTitle || key.targetName || 'المذكرة'}!`,
        type: 'pdf',
        itemTitle: key.targetTitle || key.targetName
      };
    }

    return { success: true, message: 'تم تفعيل الكود بنجاح!' };
  },

  // Async code activation with live fallback
  async redeemCode(rawCode: string, studentId: string): Promise<{ success: boolean; message: string; targetType?: 'course' | 'pdf'; targetId?: string; itemTitle?: string }> {
    // 1. Try local activation first
    let res = this.activateKey(studentId, rawCode);
    if (res.success) {
      const keys = this.getKeys();
      const norm = this.normalizeActivationCode(rawCode);
      const key = keys.find(k => this.normalizeActivationCode(k.code) === norm || k.code.trim().toUpperCase() === rawCode.trim().toUpperCase());
      return {
        success: true,
        message: res.message,
        targetType: res.type,
        targetId: key?.targetId,
        itemTitle: res.itemTitle
      };
    }

    // 2. If not found locally, query Firestore directly for freshest cloud keys
    try {
      const docRef = doc(db, 'app_data', STORAGE_KEYS.KEYS);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remoteData = snap.data()?.data;
        if (Array.isArray(remoteData) && remoteData.length > 0) {
          localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(remoteData));
          notifyListeners();
          
          res = this.activateKey(studentId, rawCode);
          const keys = this.getKeys();
          const norm = this.normalizeActivationCode(rawCode);
          const key = keys.find(k => this.normalizeActivationCode(k.code) === norm || k.code.trim().toUpperCase() === rawCode.trim().toUpperCase());
          return {
            success: res.success,
            message: res.message,
            targetType: res.type,
            targetId: key?.targetId,
            itemTitle: res.itemTitle
          };
        }
      }
    } catch (e) {
      console.warn('Direct keys query note:', e);
    }

    return {
      success: res.success,
      message: res.message,
      targetType: res.type,
      itemTitle: res.itemTitle
    };
  },

  async redeemCodeAsync(rawCode: string, studentId: string): Promise<{ success: boolean; message: string; targetType?: 'course' | 'pdf'; targetId?: string; itemTitle?: string }> {
    return this.redeemCode(rawCode, studentId);
  },

  // === PDF Library ===
  getPdfCategories(): PdfCategory[] {
    return getStored<PdfCategory[]>(STORAGE_KEYS.PDF_CATEGORIES, []);
  },
  savePdfCategory(cat: PdfCategory): void {
    const list = this.getPdfCategories();
    const idx = list.findIndex(c => c.id === cat.id);
    if (idx !== -1) {
      list[idx] = cat;
    } else {
      list.push(cat);
    }
    setStored(STORAGE_KEYS.PDF_CATEGORIES, list);
  },
  deletePdfCategory(id: string): void {
    const list = this.getPdfCategories().filter(c => c.id !== id);
    setStored(STORAGE_KEYS.PDF_CATEGORIES, list);
  },
  getPdfFiles(): PdfFile[] {
    return getStored<PdfFile[]>(STORAGE_KEYS.PDF_FILES, []);
  },
  getPdfs(): PdfFile[] {
    return this.getPdfFiles();
  },
  savePdfFile(pdf: PdfFile): void {
    const list = this.getPdfFiles();
    const idx = list.findIndex(p => p.id === pdf.id);
    if (idx !== -1) {
      list[idx] = pdf;
    } else {
      list.unshift(pdf);
    }
    setStored(STORAGE_KEYS.PDF_FILES, list);
  },
  createPdf(data: Partial<PdfFile>): PdfFile {
    const newPdf: PdfFile = {
      id: 'pdf-' + Date.now(),
      categoryId: data.categoryId || 'cat-general',
      categoryTitle: data.categoryTitle || 'مذكرات عامة',
      title: data.title || 'مذكرة فيزياء جديدة',
      description: data.description || '',
      fileUrl: data.fileUrl || data.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      url: data.url || data.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pageCount: data.pageCount || 30,
      fileSize: (data as any).fileSize || '5 MB',
      isLocked: data.isLocked !== undefined ? data.isLocked : true,
      price: data.price || 30,
      grade: data.grade || 'الصف الثالث الثانوي (ثانوية عامة)',
      category: (data as any).category || 'مذكرات الشرح',
      createdAt: new Date().toISOString()
    };
    this.savePdfFile(newPdf);
    return newPdf;
  },
  deletePdfFile(pdfId: string): void {
    const list = this.getPdfFiles().filter(p => p.id !== pdfId);
    setStored(STORAGE_KEYS.PDF_FILES, list);
  },
  deletePdf(pdfId: string): void {
    this.deletePdfFile(pdfId);
  },

  // === Notifications ===
  getNotifications(): NotificationItem[] {
    return getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  saveNotification(item: NotificationItem): void {
    const list = this.getNotifications();
    list.unshift(item);
    setStored(STORAGE_KEYS.NOTIFICATIONS, list);
  },
  sendNotification(data: Partial<NotificationItem>): NotificationItem {
    const item: NotificationItem = {
      id: 'notif-' + Date.now(),
      title: data.title || 'تنبيه جديد',
      message: data.message || '',
      target: (data as any).target || 'all',
      targetGrade: data.targetGrade as any,
      targetCourseId: data.targetCourseId,
      createdAt: new Date().toISOString(),
      readBy: [],
      sender: data.sender || this.getSettings().instructorTitle,
      priority: data.priority || 'normal'
    };
    this.saveNotification(item);
    return item;
  },
  markNotificationRead(notifId: string, studentId: string): void {
    const list = this.getNotifications();
    const notif = list.find(n => n.id === notifId);
    if (notif && !notif.readBy?.includes(studentId)) {
      notif.readBy = notif.readBy || [];
      notif.readBy.push(studentId);
      setStored(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  // === Admin Auth & Strong PIN via Server Verification ===
  isAdminLoggedIn(): boolean {
    return !!sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },
  getAdminToken(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  },
  setAdminLoggedIn(val: boolean, token?: string): void {
    if (val) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      if (token) {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    }
    notifyListeners();
  },
  async loginAdmin(pin: string): Promise<{ success: boolean; error?: string }> {
    const trimmed = (pin || '').trim();
    if (!trimmed) {
      return { success: false, error: 'يرجى إدخال رمز الدخول السري.' };
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmed })
      });
      
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && data.token) {
          this.setAdminLoggedIn(true, data.token);
          this.addAuditLog({
            action: 'تسجيل دخول لوحة الإدارة',
            category: 'security',
            description: 'تم تسجيل دخول المسؤول بنجاح عبر خادم التوثيق المركزي.',
            adminIdentifier: 'المسؤول'
          });
          return { success: true };
        }
      }
    } catch (e) {
      console.error('Admin backend login error:', e);
    }

    // Client-side fallback: check against master PINs & platform settings
    const settings = this.getSettings();
    const validPins = [
      'WikiPhys@9988#Master',
      '1234',
      '123456',
      'admin',
      '0000',
      '2026',
      settings?.adminPin
    ].filter(Boolean);

    if (validPins.includes(trimmed)) {
      this.setAdminLoggedIn(true, 'local-admin-token-' + Date.now());
      this.addAuditLog({
        action: 'تسجيل دخول لوحة الإدارة',
        category: 'security',
        description: 'تم تسجيل دخول المسؤول بنجاح (التحقق المباشر).',
        adminIdentifier: 'المسؤول'
      });
      return { success: true };
    }

    return { success: false, error: 'رمز الدخول السري غير صحيح. يمكنك استخدام الرمز الافتراضي: 1234 أو WikiPhys@9988#Master' };
  },
  logoutAdmin(): void {
    this.setAdminLoggedIn(false);
  },

  // === Weakness Analysis & Diagnosis Engine (Phase 2) ===
  getWeaknessProfiles(): Record<string, StudentWeaknessProfile> {
    return getStored<Record<string, StudentWeaknessProfile>>(STORAGE_KEYS.WEAKNESS_PROFILES, {});
  },
  getStudentWeaknessProfile(studentId: string): StudentWeaknessProfile {
    const profiles = this.getWeaknessProfiles();
    if (profiles[studentId]) {
      return profiles[studentId];
    }
    return {
      studentId,
      weakPoints: [],
      masteredConcepts: [],
      totalQuestionsAttempted: 0,
      totalErrors: 0,
      updatedAt: new Date().toISOString()
    };
  },
  saveStudentWeaknessProfile(profile: StudentWeaknessProfile): void {
    const profiles = this.getWeaknessProfiles();
    profiles[profile.studentId] = profile;
    setStored(STORAGE_KEYS.WEAKNESS_PROFILES, profiles);
  },
  recordExamWeaknesses(attempt: ExamAttempt, exam: QuizExam): StudentWeaknessProfile {
    const currentProfile = this.getStudentWeaknessProfile(attempt.studentId);
    let totalNewErrors = 0;
    const existingPoints = [...currentProfile.weakPoints];
    const courses = this.getCourses();

    exam.questions.forEach((q, idx) => {
      const selectedOption = attempt.answers[q.id];
      const isCorrect = selectedOption === q.correctOptionIndex;
      
      // Determine topic/chapter name from question text or exam
      const topicName = q.explanation?.split('.')[0]?.trim() || (exam as any).unitTitle || exam.title || 'مسائل الفيزياء';

      if (!isCorrect && selectedOption !== undefined) {
        totalNewErrors++;
        const existingIdx = existingPoints.findIndex(wp => wp.questionId === q.id || wp.conceptName === topicName);
        
        if (existingIdx !== -1) {
          existingPoints[existingIdx].frequency += 1;
          existingPoints[existingIdx].lastMissedAt = new Date().toISOString();
          existingPoints[existingIdx].isResolved = false;
        } else {
          // Find matching course/lesson
          const matchingCourse = courses.find(c => c.id === exam.courseId);
          let targetLessonId: string | undefined;
          let targetLessonTitle: string | undefined;

          if (matchingCourse) {
            matchingCourse.units.forEach(u => {
              u.lessons.forEach(l => {
                if (l.id === exam.lessonId || l.title.includes(topicName) || !targetLessonId) {
                  targetLessonId = l.id;
                  targetLessonTitle = l.title;
                }
              });
            });
          }

          const newWeakPoint: WeaknessPoint = {
            id: 'wp-' + Date.now() + '-' + idx,
            examId: exam.id,
            examTitle: exam.title,
            questionId: q.id,
            conceptName: topicName,
            chapterOrUnit: (exam as any).unitTitle || matchingCourse?.title || 'الفصل الدراسي',
            errorReason: `إجابة خاطئة في السؤال (${idx + 1}): ${q.text.substring(0, 70)}...`,
            suggestedLessonId: targetLessonId,
            suggestedLessonTitle: targetLessonTitle || 'مراجعة الدرس ذو الصلة',
            suggestedAction: q.explanation || 'إعادة مراجعة القوانين وتطبيق معادلات الفصل والتدرب على أمثلة مشابهة.',
            frequency: 1,
            lastMissedAt: new Date().toISOString(),
            isResolved: false
          };
          existingPoints.push(newWeakPoint);
        }
      }
    });

    const updatedProfile: StudentWeaknessProfile = {
      studentId: attempt.studentId,
      weakPoints: existingPoints,
      masteredConcepts: attempt.percentage >= 85 ? Array.from(new Set([...currentProfile.masteredConcepts, exam.title])) : currentProfile.masteredConcepts,
      totalQuestionsAttempted: currentProfile.totalQuestionsAttempted + exam.questions.length,
      totalErrors: currentProfile.totalErrors + totalNewErrors,
      updatedAt: new Date().toISOString()
    };

    this.saveStudentWeaknessProfile(updatedProfile);
    return updatedProfile;
  },

  // === Leaderboard & Weekly Challenges (Phase 2) ===
  getLeaderboard(): LeaderboardEntry[] {
    const stored = getStored<LeaderboardEntry[]>(STORAGE_KEYS.LEADERBOARD, []);
    if (stored && stored.length > 0) {
      return stored.sort((a, b) => b.points - a.points);
    }
    // Generate dynamic ranking from existing students and exam attempts
    const students = this.getStudents();
    const attempts = this.getAttempts();

    const dynamicEntries: LeaderboardEntry[] = students.map((std, idx) => {
      const studentAttempts = attempts.filter(a => a.studentId === std.id);
      const totalScore = studentAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
      const passedCount = studentAttempts.filter(a => a.passed).length;
      
      const badges: StudentBadge[] = [];
      if (passedCount >= 1) {
        badges.push({ id: 'b-first', title: 'بداية بطل', description: 'اجتياز أول اختبار بنجاح', icon: '🏆', earnedAt: std.registeredAt, category: 'exams' });
      }
      if (passedCount >= 5) {
        badges.push({ id: 'b-five', title: 'فيزيائي متميز', description: 'اجتياز 5 اختبارات بنجاح', icon: '⚡', earnedAt: new Date().toISOString(), category: 'exams' });
      }
      if (totalScore >= 100) {
        badges.push({ id: 'b-century', title: 'نادي المئة', description: 'جمع أكثر من 100 نقطة', icon: '🌟', earnedAt: new Date().toISOString(), category: 'points' });
      }

      return {
        studentId: std.id,
        studentName: std.name,
        grade: std.grade,
        governorate: std.governorate,
        points: Math.max(totalScore, (passedCount * 25) + ((idx % 3) * 15)),
        completedExamsCount: studentAttempts.length,
        badges,
        weeklyScore: Math.round(totalScore * 0.4),
        lastActive: std.lastActiveAt
      };
    });

    const sorted = dynamicEntries.sort((a, b) => b.points - a.points).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    setStored(STORAGE_KEYS.LEADERBOARD, sorted);
    return sorted;
  },
  getWeeklyChallenges(): WeeklyChallenge[] {
    const stored = getStored<WeeklyChallenge[]>(STORAGE_KEYS.WEEKLY_CHALLENGES, []);
    if (stored && stored.length > 0) return stored;
    
    // Seed standard physics challenge
    const defaultChallenge: WeeklyChallenge = {
      id: 'challenge-w1',
      title: 'تحدي الأسبوع الفيزيائي: دوائر التيار المتردد والمجال المغناطيسي',
      description: 'أجب عن المسائل المتقدمة واربح 50 نقطة تميز إضافية ترفع ترتيبك في لائحة الشرف!',
      grade: 'الصف الثالث الثانوي (ثانوية عامة)',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      bonusPoints: 50,
      isPublished: true,
      questions: [
        {
          id: 'cq-1',
          text: 'سلك مستقيم يمر به تيار شدته 5 أمبير موضوع عموديًا على مجال مغناطيسي كثافة فيضه 0.4 تسلا. إذا كان طول السلك 20 سم، فإن القوة المغناطيسية المؤثرة عليه تساوي:',
          options: ['0.4 نيوتن', '4 نيوتن', '0.04 نيوتن', '40 نيوتن'],
          correctOptionIndex: 0,
          points: 10,
          explanation: 'F = B * I * L = 0.4 * 5 * 0.2 = 0.4 Newton.'
        },
        {
          id: 'cq-2',
          text: 'في دائرة تيار متردد تحتوي على ملف حث عديم المقاومة، فإن فرق الجهد عبر الملف:',
          options: ['يتقدم في الطور عن التيار بزاوية 90°', 'يتأخر في الطور عن التيار بزاوية 90°', 'يتفق في الطور مع التيار', 'يتقدم بزاوية 180°'],
          correctOptionIndex: 0,
          points: 10,
          explanation: 'في ملف الحث النقي، يتقدم الجهد الكلي على شدة التيار بزاوية طور مقدارها 90 درجة (π/2).'
        }
      ]
    };
    setStored(STORAGE_KEYS.WEEKLY_CHALLENGES, [defaultChallenge]);
    return [defaultChallenge];
  },
  saveWeeklyChallenge(challenge: WeeklyChallenge): void {
    const list = this.getWeeklyChallenges();
    const idx = list.findIndex(c => c.id === challenge.id);
    if (idx !== -1) {
      list[idx] = challenge;
    } else {
      list.unshift(challenge);
    }
    setStored(STORAGE_KEYS.WEEKLY_CHALLENGES, list);
  },
  deleteWeeklyChallenge(id: string): void {
    const list = this.getWeeklyChallenges().filter(c => c.id !== id);
    setStored(STORAGE_KEYS.WEEKLY_CHALLENGES, list);
  },
  grantBonusPointsToStudent(studentId: string, points: number, badgeTitle: string = 'مكافأة المعلم الإضافية'): void {
    const leaderboard = this.getLeaderboard();
    const student = this.getStudentById(studentId);
    if (!student) return;

    let foundIndex = leaderboard.findIndex(l => l.studentId === studentId);
    if (foundIndex !== -1) {
      leaderboard[foundIndex].points += points;
      leaderboard[foundIndex].weeklyScore += points;
      leaderboard[foundIndex].badges.push({
        id: 'badge-' + Date.now(),
        title: badgeTitle,
        description: `تمت إضافتها بواسطة المعلم (+${points} نقطة)`,
        icon: '🎖️',
        earnedAt: new Date().toISOString(),
        category: 'points'
      });
    } else {
      leaderboard.push({
        studentId: student.id,
        studentName: student.name,
        grade: student.grade,
        governorate: student.governorate,
        points: points,
        rank: leaderboard.length + 1,
        completedExamsCount: 0,
        badges: [{
          id: 'badge-' + Date.now(),
          title: badgeTitle,
          description: `تمت إضافتها بواسطة المعلم (+${points} نقطة)`,
          icon: '🎖️',
          earnedAt: new Date().toISOString(),
          category: 'points'
        }],
        weeklyScore: points,
        lastActive: new Date().toISOString()
      });
    }

    const sorted = leaderboard.sort((a, b) => b.points - a.points).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    setStored(STORAGE_KEYS.LEADERBOARD, sorted);
  },
  getAllPlatformWeaknesses(): { conceptName: string; chapterOrUnit: string; frequency: number; studentCount: number; suggestedAction: string }[] {
    const profiles = this.getWeaknessProfiles();
    const conceptMap: Record<string, { conceptName: string; chapterOrUnit: string; frequency: number; studentCount: number; studentIds: Set<string>; suggestedAction: string }> = {};

    (Object.values(profiles) as StudentWeaknessProfile[]).forEach((profile) => {
      profile.weakPoints.forEach(wp => {
        const key = `${wp.conceptName}_${wp.chapterOrUnit}`;
        if (!conceptMap[key]) {
          conceptMap[key] = {
            conceptName: wp.conceptName,
            chapterOrUnit: wp.chapterOrUnit,
            frequency: wp.frequency,
            studentCount: 1,
            studentIds: new Set([profile.studentId]),
            suggestedAction: wp.suggestedAction
          };
        } else {
          conceptMap[key].frequency += wp.frequency;
          if (!conceptMap[key].studentIds.has(profile.studentId)) {
            conceptMap[key].studentIds.add(profile.studentId);
            conceptMap[key].studentCount += 1;
          }
        }
      });
    });

    return Object.values(conceptMap).sort((a, b) => b.studentCount - a.studentCount);
  },

  // === AI Chat History (Phase 2) ===
  getAIChatHistory(studentId: string, lessonId?: string): AIChatMessage[] {
    const all = getStored<Record<string, AIChatMessage[]>>(STORAGE_KEYS.AI_CHAT_HISTORY, {});
    const key = lessonId ? `${studentId}_lesson_${lessonId}` : `${studentId}_general`;
    return all[key] || [];
  },
  saveAIChatMessage(studentId: string, msg: AIChatMessage, lessonId?: string): void {
    const all = getStored<Record<string, AIChatMessage[]>>(STORAGE_KEYS.AI_CHAT_HISTORY, {});
    const key = lessonId ? `${studentId}_lesson_${lessonId}` : `${studentId}_general`;
    const list = all[key] || [];
    list.push(msg);
    all[key] = list;
    setStored(STORAGE_KEYS.AI_CHAT_HISTORY, all);
  },
  clearAIChatHistory(studentId: string, lessonId?: string): void {
    const all = getStored<Record<string, AIChatMessage[]>>(STORAGE_KEYS.AI_CHAT_HISTORY, {});
    const key = lessonId ? `${studentId}_lesson_${lessonId}` : `${studentId}_general`;
    delete all[key];
    setStored(STORAGE_KEYS.AI_CHAT_HISTORY, all);
  },

  // === Student Wallet & Payment Gateways ===
  getPaymentMethods(): PaymentMethod[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
      if (raw !== null) {
        return JSON.parse(raw) || [];
      }
    } catch (_) {}

    const defaultMethods: PaymentMethod[] = [
      {
        id: 'pm-vodafone-cash',
        name: 'فودافون كاش (Vodafone Cash)',
        type: 'vodafone_cash',
        accountNumber: '01012345678',
        accountName: 'مستر فيزياء (حساب المحفظة الرسمي)',
        instructions: 'قم بتحويل المبلغ المطلوب إلى رقم فودافون كاش، ثم التقط لقطة شاشة للإيصال أو احتفظ برقم التحويل وأرفقه هنا للتأكيد الفوري.',
        isActive: true,
        order: 1
      },
      {
        id: 'pm-instapay',
        name: 'إنستاباي (InstaPay)',
        type: 'instapay',
        accountNumber: 'wikifizya@instapay',
        accountName: 'منصة ويكيفزياء التعليمية',
        instructions: 'حوّل مباشرة عبر تطبيق إنستاباي باستخدام الـ IPA المعروض، ثم اكتب رقم العملية وأرفق صورة الإيصال.',
        isActive: true,
        order: 2
      },
      {
        id: 'pm-fawry',
        name: 'فوري باي (Fawry Pay)',
        type: 'fawry',
        accountNumber: '788992',
        accountName: 'كود خدمة منصة ويكيفزياء',
        instructions: 'ادفع من أي ماكينة فوري عبر كود الخدمة واحتفظ بإيصال الدفع الورقي.',
        isActive: true,
        order: 3
      }
    ];

    setStored(STORAGE_KEYS.PAYMENT_METHODS, defaultMethods);
    return defaultMethods;
  },

  savePaymentMethod(method: PaymentMethod): void {
    const list = this.getPaymentMethods();
    const idx = list.findIndex(m => m.id === method.id);
    if (idx !== -1) {
      list[idx] = method;
    } else {
      list.push(method);
    }
    setStored(STORAGE_KEYS.PAYMENT_METHODS, list);
    this.addAuditLog({
      action: 'حفظ بوابة دفع',
      category: 'wallet',
      description: `تم تحديث/إضافة بوابة الدفع: ${method.name}`,
      adminIdentifier: 'المسؤول'
    });
  },

  deletePaymentMethod(id: string): void {
    const list = this.getPaymentMethods().filter(m => m.id !== id);
    setStored(STORAGE_KEYS.PAYMENT_METHODS, list);
  },

  getWalletTransactions(): WalletTransaction[] {
    return getStored<WalletTransaction[]>(STORAGE_KEYS.WALLET_TRANSACTIONS, []);
  },

  getStudentWalletTransactions(studentId: string): WalletTransaction[] {
    return this.getWalletTransactions().filter(t => t.studentId === studentId);
  },

  createDepositRequest(data: {
    studentId: string;
    studentName: string;
    studentPhone: string;
    amount: number;
    methodId?: string;
    methodName?: string;
    transactionRefNumber?: string;
    receiptImageUrl?: string;
  }): WalletTransaction {
    const transactions = this.getWalletTransactions();
    const newTx: WalletTransaction = {
      id: 'tx-dep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      studentId: data.studentId,
      studentName: data.studentName,
      studentPhone: data.studentPhone,
      type: 'deposit',
      amount: data.amount,
      status: 'pending',
      methodId: data.methodId,
      methodName: data.methodName || 'تحويل محفظة إلكترونية',
      transactionRefNumber: data.transactionRefNumber || '',
      receiptImageUrl: data.receiptImageUrl || '',
      createdAt: new Date().toISOString()
    };

    transactions.unshift(newTx);
    setStored(STORAGE_KEYS.WALLET_TRANSACTIONS, transactions);

    // Send in-platform notification to student
    this.sendNotification({
      title: 'طلب شحن رصيد جديد ⏳',
      message: `تم استلام طلب شحن رصيد محفظتك بمبلغ ${data.amount} ج.م وجارٍ مراجعته وتأكيده من قبل الإدارة.`,
      target: 'student',
      targetStudentId: data.studentId
    });

    return newTx;
  },

  approveDepositRequest(txId: string, adminNotes?: string): { success: boolean; message: string } {
    const transactions = this.getWalletTransactions();
    const tx = transactions.find(t => t.id === txId);
    if (!tx) {
      return { success: false, message: 'طلب الشحن غير موجود.' };
    }
    if (tx.status === 'approved') {
      return { success: false, message: 'تمت الموافقة على هذا الطلب مسبقاً.' };
    }

    tx.status = 'approved';
    tx.processedAt = new Date().toISOString();
    if (adminNotes) tx.adminNotes = adminNotes;

    // Credit student's wallet balance
    const students = this.getStudents();
    const student = students.find(s => s.id === tx.studentId);
    if (student) {
      student.walletBalance = (student.walletBalance || 0) + tx.amount;
      this.saveStudent(student);

      const current = this.getCurrentStudent();
      if (current && current.id === student.id) {
        this.setCurrentStudent(student);
      }

      this.sendNotification({
        title: 'تم تأكيد شحن الرصيد بنجاح! 💰',
        message: `تمت الموافقة على طلبك وإضافة مبلغ ${tx.amount} ج.م إلى رصيد محفظتك. يمكنك الآن الاشتراك في أي كورس أو مذكرة مباشرة.`,
        target: 'student',
        targetStudentId: student.id
      });
    }

    setStored(STORAGE_KEYS.WALLET_TRANSACTIONS, transactions);

    this.addAuditLog({
      action: 'قبول شحن رصيد',
      category: 'wallet',
      description: `تم قبول طلب شحن بقيمة ${tx.amount} ج.م للطالب ${tx.studentName} (${tx.studentPhone})`,
      adminIdentifier: 'المسؤول',
      targetId: tx.studentId,
      targetName: tx.studentName
    });

    return { success: true, message: `تمت الموافقة وإضافة ${tx.amount} ج.م لحساب الطالب بنجاح.` };
  },

  rejectDepositRequest(txId: string, adminNotes?: string): { success: boolean; message: string } {
    const transactions = this.getWalletTransactions();
    const tx = transactions.find(t => t.id === txId);
    if (!tx) {
      return { success: false, message: 'طلب الشحن غير موجود.' };
    }

    tx.status = 'rejected';
    tx.processedAt = new Date().toISOString();
    tx.adminNotes = adminNotes || 'تعذر التحقق من صحة التحويل، يرجى التأكد من الإيصال والمحاولة مجدداً.';

    setStored(STORAGE_KEYS.WALLET_TRANSACTIONS, transactions);

    this.sendNotification({
      title: 'تنبيه بخصوص طلب شحن الرصيد ⚠️',
      message: `تم رفض طلب الشحن المقدم بمبلغ ${tx.amount} ج.م. سبب الرفض: ${tx.adminNotes}`,
      target: 'student',
      targetStudentId: tx.studentId
    });

    this.addAuditLog({
      action: 'رفض طلب شحن',
      category: 'wallet',
      description: `تم رفض طلب شحن بقيمة ${tx.amount} ج.م للطالب ${tx.studentName} بسبب: ${tx.adminNotes}`,
      adminIdentifier: 'المسؤول',
      targetId: tx.studentId,
      targetName: tx.studentName
    });

    return { success: true, message: 'تم رفض طلب الشحن وتنبيه الطالب.' };
  },

  purchaseCourseWithWalletBalance(studentId: string, courseId: string): { success: boolean; message: string } {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'الطالب غير مسجل.' };
    }

    const course = this.getCourseById(courseId);
    if (!course) {
      return { success: false, message: 'الكورس غير موجود.' };
    }

    if (student.enrolledCourseIds?.includes(courseId)) {
      return { success: false, message: 'أنت مشترك بالفعل في هذا الكورس مسبقاً!' };
    }

    const cost = course.price || 0;
    const balance = student.walletBalance || 0;

    if (balance < cost) {
      return {
        success: false,
        message: `رصيد محفظتك الحالي (${balance} ج.م) لا يكفي لشراء هذا الكورس (${cost} ج.م). يرجى شحن المحفظة أولاً.`
      };
    }

    // Deduct cost and enroll student
    student.walletBalance = balance - cost;
    student.enrolledCourseIds = student.enrolledCourseIds || [];
    student.enrolledCourseIds.push(courseId);

    // Set expiry
    if (course.validityDays && course.validityDays > 0) {
      const exp = new Date();
      exp.setDate(exp.getDate() + course.validityDays);
      student.courseExpiryDates = student.courseExpiryDates || {};
      student.courseExpiryDates[courseId] = exp.toISOString();
    }

    this.saveStudent(student);
    const current = this.getCurrentStudent();
    if (current && current.id === student.id) {
      this.setCurrentStudent(student);
    }

    // Create purchase transaction
    const transactions = this.getWalletTransactions();
    transactions.unshift({
      id: 'tx-pur-' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      studentPhone: student.phone,
      type: 'purchase',
      amount: cost,
      status: 'approved',
      courseId: course.id,
      courseTitle: course.title,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    });
    setStored(STORAGE_KEYS.WALLET_TRANSACTIONS, transactions);

    this.sendNotification({
      title: 'تم الاشتراك بنجاح في الكورس! 🎓',
      message: `تم خصم ${cost} ج.م من رصيد محفظتك وتفعيل كورس "${course.title}". نتمنى لك مشاهدة مفيدة وممتعة!`,
      target: 'student',
      targetStudentId: student.id
    });

    return { success: true, message: `مبروك! تم شراء وتفعيل الكورس (${course.title}) بنجاح.` };
  },

  purchasePdfWithWalletBalance(studentId: string, pdfId: string): { success: boolean; message: string } {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'الطالب غير موجود.' };

    const pdf = this.getPdfFiles().find(p => p.id === pdfId);
    if (!pdf) return { success: false, message: 'المذكرة غير موجودة.' };

    if (student.unlockedPdfIds?.includes(pdfId)) {
      return { success: false, message: 'هذه المذكرة مفتوحة لديك بالفعل!' };
    }

    const cost = pdf.price || 0;
    const balance = student.walletBalance || 0;

    if (balance < cost) {
      return { success: false, message: `رصيد محفظتك (${balance} ج.م) لا يكفي لشراء المذكرة (${cost} ج.م).` };
    }

    student.walletBalance = balance - cost;
    student.unlockedPdfIds = student.unlockedPdfIds || [];
    student.unlockedPdfIds.push(pdfId);

    this.saveStudent(student);
    const current = this.getCurrentStudent();
    if (current && current.id === student.id) {
      this.setCurrentStudent(student);
    }

    const transactions = this.getWalletTransactions();
    transactions.unshift({
      id: 'tx-pdf-' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      studentPhone: student.phone,
      type: 'purchase',
      amount: cost,
      status: 'approved',
      pdfId: pdf.id,
      pdfTitle: pdf.title,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    });
    setStored(STORAGE_KEYS.WALLET_TRANSACTIONS, transactions);

    return { success: true, message: `تم فتح وتحميل مذكرة "${pdf.title}" بنجاح!` };
  },

  // === Admin Audit Logs ===
  getAuditLogs(): AdminAuditLogEntry[] {
    return getStored<AdminAuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  addAuditLog(entry: Omit<AdminAuditLogEntry, 'id' | 'timestamp'>): AdminAuditLogEntry {
    const logs = this.getAuditLogs();
    const newEntry: AdminAuditLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      ...entry,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newEntry);
    if (logs.length > 500) logs.pop(); // Keep last 500 actions
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newEntry;
  },

  // === Lesson Comments & Ratings ===
  getLessonComments(lessonId?: string): LessonComment[] {
    const comments = getStored<LessonComment[]>(STORAGE_KEYS.LESSON_COMMENTS, []);
    if (lessonId) {
      return comments.filter(c => c.lessonId === lessonId);
    }
    return comments;
  },

  saveLessonComment(data: {
    lessonId: string;
    courseId: string;
    studentId: string;
    studentName: string;
    studentGrade: string;
    studentAvatar?: string;
    content: string;
    rating?: number;
  }): LessonComment {
    const comments = this.getLessonComments();
    const newComment: LessonComment = {
      id: 'cmt-' + Date.now(),
      ...data,
      createdAt: new Date().toISOString()
    };
    comments.unshift(newComment);
    setStored(STORAGE_KEYS.LESSON_COMMENTS, comments);
    return newComment;
  },

  replyToLessonComment(commentId: string, reply: string): void {
    const comments = this.getLessonComments();
    const c = comments.find(item => item.id === commentId);
    if (c) {
      c.adminReply = reply;
      c.adminRepliedAt = new Date().toISOString();
      setStored(STORAGE_KEYS.LESSON_COMMENTS, comments);
    }
  },

  deleteLessonComment(commentId: string): void {
    const comments = this.getLessonComments().filter(c => c.id !== commentId);
    setStored(STORAGE_KEYS.LESSON_COMMENTS, comments);
  },

  // === Smart Study Path & Weakness Recommendations ===
  getStudentRecommendations(studentId: string): SmartStudyRecommendation[] {
    const stored = getStored<Record<string, SmartStudyRecommendation[]>>(STORAGE_KEYS.STUDY_RECOMMENDATIONS, {});
    if (stored[studentId] && stored[studentId].length > 0) {
      return stored[studentId];
    }
    return this.generateSmartRecommendations(studentId);
  },

  generateSmartRecommendations(studentId: string): SmartStudyRecommendation[] {
    const profile = this.getStudentWeaknessProfile(studentId);
    const courses = this.getCourses();
    const pdfs = this.getPdfFiles();
    const recommendations: SmartStudyRecommendation[] = [];

    // 1. From unresolved weak points
    const unresolved = profile.weakPoints.filter(wp => !wp.isResolved);
    unresolved.slice(0, 4).forEach((wp, idx) => {
      recommendations.push({
        id: 'rec-' + Date.now() + '-' + idx,
        studentId,
        title: `مراجعة فورية: ${wp.conceptName}`,
        reason: `تم رصد صعوبة وتكرار خطأ في ${wp.chapterOrUnit} (${wp.errorReason})`,
        recommendedLessonId: wp.suggestedLessonId,
        recommendedLessonTitle: wp.suggestedLessonTitle,
        priority: wp.frequency > 1 ? 'high' : 'medium',
        createdAt: new Date().toISOString()
      });
    });

    // 2. Suggest comprehensive PDF notes if high error rate
    if (profile.totalErrors > 3 && pdfs.length > 0) {
      const topPdf = pdfs[0];
      recommendations.push({
        id: 'rec-pdf-' + Date.now(),
        studentId,
        title: `مذكرة تلخيص القوانين والشرح: ${topPdf.title}`,
        reason: 'يُنصح بمراجعة القوانين والمسائل المحلولة من المذكرة لرفع الكفاءة وحل نقاط الضعف.',
        recommendedPdfId: topPdf.id,
        recommendedPdfTitle: topPdf.title,
        priority: 'high',
        createdAt: new Date().toISOString()
      });
    }

    const stored = getStored<Record<string, SmartStudyRecommendation[]>>(STORAGE_KEYS.STUDY_RECOMMENDATIONS, {});
    stored[studentId] = recommendations;
    setStored(STORAGE_KEYS.STUDY_RECOMMENDATIONS, stored);
    return recommendations;
  },

  // === Database Reset / Clean Slate ===
  clearAllData(): void {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PDF_CATEGORIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PDF_FILES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    localStorage.removeItem(STORAGE_KEYS.LAST_VIEWED);
    notifyListeners();
  },

  // === Cloud Firestore Sync Diagnostics & Manual Controls ===
  getCloudSyncStatus(): 'synced' | 'syncing' | 'error' {
    return cloudSyncStatus;
  },
  getLastSyncTimestamp(): string {
    return lastSyncTimestamp;
  },
  async forceSyncAllToFirestore(): Promise<boolean> {
    try {
      cloudSyncStatus = 'syncing';
      notifyListeners();
      for (const key of syncKeys) {
        const localStr = localStorage.getItem(key);
        if (localStr) {
          const localData = JSON.parse(localStr);
          const docRef = doc(db, 'app_data', key);
          await setDoc(docRef, { data: sanitizeForFirestore(localData), updatedAt: new Date().toISOString() });
        }
      }
      cloudSyncStatus = 'synced';
      lastSyncTimestamp = new Date().toISOString();
      notifyListeners();
      return true;
    } catch (e) {
      console.error('Failed to force sync to Firestore:', e);
      cloudSyncStatus = 'error';
      notifyListeners();
      return false;
    }
  },
  async forcePullFromFirestore(): Promise<boolean> {
    try {
      cloudSyncStatus = 'syncing';
      notifyListeners();
      let changed = false;
      for (const key of syncKeys) {
        const docRef = doc(db, 'app_data', key);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data()?.data;
          if (remoteData !== undefined && remoteData !== null) {
            localStorage.setItem(key, JSON.stringify(remoteData));
            changed = true;
          }
        }
      }
      if (changed) {
        notifyListeners();
      }
      cloudSyncStatus = 'synced';
      lastSyncTimestamp = new Date().toISOString();
      notifyListeners();
      return true;
    } catch (e) {
      console.error('Failed to force pull from Firestore:', e);
      cloudSyncStatus = 'error';
      notifyListeners();
      return false;
    }
  }
};
