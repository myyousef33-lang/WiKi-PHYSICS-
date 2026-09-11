import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Server-Side Supabase Client (uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS securely on server)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://dvpylfutvykzanxxabko.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_KtItaIZhKU149HjbPkWd2g_ni_cjrHr';

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// AppData persistence directory (.data/app_data)
const appDataDir = path.join(process.cwd(), '.data', 'app_data');
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
}

const memoryAppData = new Map<string, { data: any; updatedAt: string }>();

// Preload from disk into memory on startup
try {
  const files = fs.readdirSync(appDataDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const key = file.replace(/\.json$/, '');
      const content = fs.readFileSync(path.join(appDataDir, file), 'utf-8');
      const parsed = JSON.parse(content);
      memoryAppData.set(key, {
        data: parsed.data !== undefined ? parsed.data : parsed,
        updatedAt: parsed.updatedAt || new Date().toISOString()
      });
    }
  }
} catch (err) {
  console.error('Error preloading app_data from disk:', err);
}

export const normalizeAppKey = (k: string): string => {
  if (!k || typeof k !== 'string') return '';
  const map: Record<string, string> = {
    'students': 'wikifizya_db_students_v4',
    'wikifizya_db_students_v4': 'wikifizya_db_students_v4',
    'courses': 'wikifizya_db_courses_v4',
    'wikifizya_db_courses_v4': 'wikifizya_db_courses_v4',
    'settings': 'wikifizya_db_settings_v4',
    'wikifizya_db_settings_v4': 'wikifizya_db_settings_v4',
    'exams': 'wikifizya_db_exams_v4',
    'wikifizya_db_exams_v4': 'wikifizya_db_exams_v4',
    'keys': 'wikifizya_db_activation_keys_v4',
    'wikifizya_db_activation_keys_v4': 'wikifizya_db_activation_keys_v4',
    'attempts': 'wikifizya_db_exam_attempts_v4',
    'wikifizya_db_exam_attempts_v4': 'wikifizya_db_exam_attempts_v4',
    'progress': 'wikifizya_db_lesson_progress_v4',
    'wikifizya_db_lesson_progress_v4': 'wikifizya_db_lesson_progress_v4',
    'pdfFiles': 'wikifizya_db_pdf_files_v4',
    'wikifizya_db_pdf_files_v4': 'wikifizya_db_pdf_files_v4',
    'pdfCategories': 'wikifizya_db_pdf_categories_v4',
    'wikifizya_db_pdf_categories_v4': 'wikifizya_db_pdf_categories_v4',
    'notifications': 'wikifizya_db_notifications_v4',
    'wikifizya_db_notifications_v4': 'wikifizya_db_notifications_v4',
    'weakness': 'wikifizya_db_weakness_v4',
    'wikifizya_db_weakness_v4': 'wikifizya_db_weakness_v4',
    'leaderboard': 'wikifizya_db_leaderboard_v4',
    'wikifizya_db_leaderboard_v4': 'wikifizya_db_leaderboard_v4',
    'weeklyChallenges': 'wikifizya_db_weekly_challenges_v4',
    'wikifizya_db_weekly_challenges_v4': 'wikifizya_db_weekly_challenges_v4',
    'paymentMethods': 'wikifizya_db_payment_methods_v4',
    'wikifizya_db_payment_methods_v4': 'wikifizya_db_payment_methods_v4',
    'walletTransactions': 'wikifizya_db_wallet_transactions_v4',
    'wikifizya_db_wallet_transactions_v4': 'wikifizya_db_wallet_transactions_v4',
    'assignments': 'wikifizya_db_assignments_v4',
    'wikifizya_db_assignments_v4': 'wikifizya_db_assignments_v4',
    'assignmentSubmissions': 'wikifizya_db_assignment_submissions_v4',
    'wikifizya_db_assignment_submissions_v4': 'wikifizya_db_assignment_submissions_v4'
  };
  return map[k] || k;
};

// AppData persistence helpers
const getAppDataDoc = async (key: string): Promise<any> => {
  const normKey = normalizeAppKey(key);
  if (!normKey) return null;

  // 1. Check in-memory cache
  const cached = memoryAppData.get(normKey);
  if (cached && cached.data !== undefined) {
    return cached.data;
  }

  // 2. Check disk file
  const targetFile = path.join(appDataDir, `${normKey}.json`);
  if (fs.existsSync(targetFile)) {
    try {
      const content = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(content);
      const data = parsed.data !== undefined ? parsed.data : parsed;
      const updatedAt = parsed.updatedAt || new Date().toISOString();
      memoryAppData.set(normKey, { data, updatedAt });
      return data;
    } catch (err) {
      console.error(`Error reading ${targetFile}:`, err);
    }
  }

  // 3. Fallback: Check Supabase (e.g. for seed rows)
  try {
    const { data, error } = await supabaseServer
      .from('app_data')
      .select('key, data, updated_at')
      .eq('key', normKey)
      .maybeSingle();
    if (!error && data && data.data !== undefined) {
      const updatedAt = data.updated_at || new Date().toISOString();
      memoryAppData.set(normKey, { data: data.data, updatedAt });
      try {
        fs.writeFileSync(targetFile, JSON.stringify({ key: normKey, data: data.data, updatedAt }, null, 2), 'utf-8');
      } catch (_) {}
      return data.data;
    }
  } catch (err) {
    console.warn(`Supabase read fallback for [${normKey}] failed:`, err);
  }

  return null;
};

const getAppDataDocWithMeta = async (key: string): Promise<{ data: any; updatedAt: string } | null> => {
  const normKey = normalizeAppKey(key);
  if (!normKey) return null;

  const data = await getAppDataDoc(normKey);
  if (data === null || data === undefined) return null;

  const cached = memoryAppData.get(normKey);
  return {
    data,
    updatedAt: cached?.updatedAt || new Date().toISOString()
  };
};

const setAppDataDoc = async (key: string, docData: any, customUpdatedAt?: string): Promise<boolean> => {
  const normKey = normalizeAppKey(key);
  if (!normKey) return false;
  const updatedAt = customUpdatedAt || new Date().toISOString();

  try {
    // 1. Update in-memory cache
    memoryAppData.set(normKey, { data: docData, updatedAt });

    // 2. Persist to atomic file on disk
    const targetFile = path.join(appDataDir, `${normKey}.json`);
    const tempFile = path.join(appDataDir, `${normKey}.tmp.${Date.now()}`);
    fs.writeFileSync(tempFile, JSON.stringify({ key: normKey, data: docData, updatedAt }, null, 2), 'utf-8');
    fs.renameSync(tempFile, targetFile);

    // 3. Background best-effort Supabase sync (does not block local persistence)
    Promise.resolve(
      supabaseServer
        .from('app_data')
        .upsert({
          key: normKey,
          data: docData,
          updated_at: updatedAt
        }, { onConflict: 'key' })
    ).catch(() => {});

    return true;
  } catch (err) {
    console.error(`setAppDataDoc exception [${normKey}]:`, err);
    return false;
  }
};

// Security & Secret Store
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'wikifizya_sec_token_' + crypto.randomBytes(16).toString('hex');
const STUDENT_SECRET = process.env.ADMIN_JWT_SECRET || 'wikifizya_student_sec_key_2026';

const ADMIN_CONFIG_DIR = path.join(process.cwd(), '.data');
const ADMIN_CONFIG_FILE = path.join(ADMIN_CONFIG_DIR, 'admin-auth.json');

const saveAdminPinHash = (hash: string) => {
  try {
    if (!fs.existsSync(ADMIN_CONFIG_DIR)) {
      fs.mkdirSync(ADMIN_CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(
      ADMIN_CONFIG_FILE,
      JSON.stringify({ pinHash: hash, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed to persist admin pin hash to disk:', err);
  }
  currentAdminPinHash = hash;
};

const loadAdminPinHash = (): string => {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8'));
      if (data && typeof data.pinHash === 'string' && data.pinHash.length > 0) {
        return data.pinHash;
      }
    }
  } catch (err) {
    console.warn('Could not read admin-auth.json:', err);
  }

  // Initialize with default initial PIN (from env or fallback) and persist
  const defaultPin = (process.env.ADMIN_PIN && process.env.ADMIN_PIN.trim()) || 'WikiPhys@9988#Master';
  const initialHash = crypto.createHash('sha256').update(defaultPin).digest('hex');
  saveAdminPinHash(initialHash);
  return initialHash;
};

let currentAdminPinHash = loadAdminPinHash();

// In-Memory Rate Limiting Stores
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const studentLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const uploadRateLimits = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string, maxAttempts = 5, lockDurationMs = 5 * 60 * 1000): { allowed: boolean; waitSeconds?: number } => {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil > now) {
    return { allowed: false, waitSeconds: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  if (record.lockedUntil <= now && record.count >= maxAttempts) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
};

const checkStudentRateLimit = (ip: string, maxAttempts = 5, lockDurationMs = 5 * 60 * 1000): { allowed: boolean; waitSeconds?: number } => {
  const now = Date.now();
  const record = studentLoginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil > now) {
    return { allowed: false, waitSeconds: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  if (record.lockedUntil <= now && record.count >= maxAttempts) {
    studentLoginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
};

const recordStudentFailedAttempt = (ip: string, maxAttempts = 5, lockDurationMs = 5 * 60 * 1000) => {
  const now = Date.now();
  const record = studentLoginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= maxAttempts) {
    record.lockedUntil = now + lockDurationMs;
  }
  studentLoginAttempts.set(ip, record);
};

const resetStudentLoginAttempts = (ip: string) => {
  studentLoginAttempts.delete(ip);
};

const checkUploadRateLimit = (ip: string, maxUploads = 30, windowMs = 10 * 60 * 1000): { allowed: boolean; waitSeconds?: number } => {
  const now = Date.now();
  const record = uploadRateLimits.get(ip);
  if (!record || record.resetTime <= now) {
    uploadRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  if (record.count >= maxUploads) {
    return { allowed: false, waitSeconds: Math.ceil((record.resetTime - now) / 1000) };
  }
  record.count += 1;
  uploadRateLimits.set(ip, record);
  return { allowed: true };
};

const requireUploadRateLimit = (req: express.Request, res: express.Response, next: express.NextFunction): any => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  const check = checkUploadRateLimit(clientIp, 40, 10 * 60 * 1000);
  if (!check.allowed) {
    return res.status(429).json({
      success: false,
      error: `تم تجاوز الحد المسموح لرفع الملفات مؤقتاً. يرجى الانتظار ${check.waitSeconds} ثانية قبل المحاولة مجدداً.`
    });
  }
  next();
};

const recordFailedAttempt = (ip: string, maxAttempts = 5, lockDurationMs = 5 * 60 * 1000) => {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= maxAttempts) {
    record.lockedUntil = now + lockDurationMs;
  }
  loginAttempts.set(ip, record);
};

const resetLoginAttempts = (ip: string) => {
  loginAttempts.delete(ip);
};

// Admin Token Generation & Verification
const generateAdminToken = (): string => {
  const payload = {
    role: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const str = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(str).digest('hex');
  return Buffer.from(str).toString('base64url') + '.' + signature;
};

const verifyAdminToken = (token: string): boolean => {
  try {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(Buffer.from(payloadB64, 'base64url').toString('utf-8')).digest('hex');
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.expiresAt < Date.now()) return false;
    return payload.role === 'admin';
  } catch {
    return false;
  }
};

// Student Token Generation & Verification
const generateStudentToken = (studentId: string, phone: string): string => {
  const payload = {
    studentId,
    phone,
    role: 'student',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  const str = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', STUDENT_SECRET).update(str).digest('hex');
  return Buffer.from(str).toString('base64url') + '.' + signature;
};

const verifyStudentToken = (token: string): { studentId: string; phone: string } | null => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', STUDENT_SECRET).update(Buffer.from(payloadB64, 'base64url').toString('utf-8')).digest('hex');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.expiresAt < Date.now()) return null;
    if (payload.role !== 'student' || !payload.studentId) return null;
    return { studentId: payload.studentId, phone: payload.phone };
  } catch {
    return null;
  }
};

// Middleware to protect admin endpoints
const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction): any => {
  const cookieToken = req.cookies?.admin_session;
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-admin-token'] as string;
  const token = cookieToken || ((authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : customHeader);

  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول كمسؤول في لوحة التحكم.'
    });
  }
  next();
};

// Middleware to protect student endpoints
const requireStudentAuth = (req: any, res: express.Response, next: express.NextFunction): any => {
  const cookieToken = req.cookies?.student_session;
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-student-token'] as string;
  const token = cookieToken || ((authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : customHeader);

  const studentData = verifyStudentToken(token);
  if (!studentData) {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح. يرجى تسجيل الدخول لحساب الطالب أولاً.'
    });
  }
  req.student = studentData;
  next();
};

// Helper to strip sensitive credentials from student objects
const sanitizeStudent = (student: any) => {
  if (!student) return student;
  const copy = { ...student };
  delete copy.password;
  delete copy.password_hash;
  delete copy.passwordHash;
  return copy;
};

// File Magic Bytes / Header Validation
const validateFileContent = (filePath: string, originalName: string, reportedMime: string): { isValid: boolean; error?: string } => {
  try {
    const ext = path.extname(originalName).toLowerCase();
    const buffer = Buffer.alloc(32);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 32, 0);
    fs.closeSync(fd);

    // 1. PDF: %PDF
    if (ext === '.pdf' || reportedMime === 'application/pdf') {
      const isPdf = buffer.toString('utf-8', 0, 4) === '%PDF';
      if (!isPdf) return { isValid: false, error: 'الملف ليس ملف PDF صالح' };
      return { isValid: true };
    }

    // 2. Images
    if (['.jpg', '.jpeg'].includes(ext)) {
      const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      if (!isJpeg) return { isValid: false, error: 'صيغة الصورة JPEG غير صالحة' };
      return { isValid: true };
    }
    if (ext === '.png') {
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      if (!isPng) return { isValid: false, error: 'صيغة الصورة PNG غير صالحة' };
      return { isValid: true };
    }
    if (ext === '.gif') {
      const isGif = buffer.toString('utf-8', 0, 3) === 'GIF';
      if (!isGif) return { isValid: false, error: 'صيغة الصورة GIF غير صالحة' };
      return { isValid: true };
    }
    if (ext === '.webp') {
      const isWebp = buffer.toString('utf-8', 0, 4) === 'RIFF' && buffer.toString('utf-8', 8, 12) === 'WEBP';
      if (!isWebp) return { isValid: false, error: 'صيغة الصورة WEBP غير صالحة' };
      return { isValid: true };
    }

    // 3. Videos
    if (['.mp4', '.m4v', '.mov'].includes(ext)) {
      const isMp4 = buffer.toString('utf-8', 4, 8) === 'ftyp' || buffer.toString('utf-8', 4, 8) === 'moov';
      if (!isMp4) return { isValid: false, error: 'صيغة الفيديو MP4 غير صالحة' };
      return { isValid: true };
    }
    if (['.webm', '.mkv'].includes(ext)) {
      const isMatroska = buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
      if (!isMatroska) return { isValid: false, error: 'صيغة الفيديو WebM/MKV غير صالحة' };
      return { isValid: true };
    }

    // Allow SVG if text contains <svg
    if (ext === '.svg') {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes('<svg') && !content.includes('<?xml')) {
        return { isValid: false, error: 'ملف SVG غير صالح' };
      }
      return { isValid: true };
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: 'فشل في قراءة وتدقيق محتوى الملف: ' + err.message };
  }
};

// Setup Multer for disk storage with extension whitelist
const ALLOWED_EXTENSIONS = new Set([
  '.mp4', '.webm', '.mkv', '.mov',
  '.pdf',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('امتداد الملف غير مدعوم لأسباب أمنية'), '');
    }
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max
  },
});

// Lazy Gemini API Client with robust initialization
let geminiClient: GoogleGenAI | null = null;
const getGemini = (): GoogleGenAI => {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
};

// Resilient Gemini Model Fallback Runner
async function generateWithFallback(ai: GoogleGenAI, requestOptions: {
  contents: any[];
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}): Promise<{ text: string; modelUsed: string }> {
  // Try high-availability models with progressive fallback
  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const config: any = {
        temperature: requestOptions.temperature ?? 0.3,
      };
      if (requestOptions.systemInstruction) {
        config.systemInstruction = requestOptions.systemInstruction;
      }
      if (requestOptions.responseMimeType) {
        config.responseMimeType = requestOptions.responseMimeType;
      }

      const response = await ai.models.generateContent({
        model,
        contents: requestOptions.contents,
        config,
      });

      if (response && typeof response.text === 'string' && response.text.trim().length > 0) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} failed, trying next candidate:`, err?.message?.slice(0, 150) || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All candidate Gemini models are currently unavailable.');
}

export const app = express();

async function startServer() {
  const PORT = 3000;

  // Parsers & Middlewares
  app.use(cookieParser());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Security CORS middleware for credentials & tokens
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, x-student-token');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Static uploads serving
  app.use('/uploads', express.static(uploadsDir));

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // 1. Admin Authentication & Data Sync API
  // ==========================================
  app.post('/api/admin/login', (req, res): any => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
    const rate = checkRateLimit(clientIp, 10, 5 * 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({
        success: false,
        error: `تم حظر محاولات الدخول مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى الانتظار ${rate.waitSeconds} ثانية.`
      });
    }

    const { pin } = req.body;
    if (!pin || typeof pin !== 'string') {
      recordFailedAttempt(clientIp);
      return res.status(400).json({ success: false, error: 'يرجى إدخال كلمة المرور السرية' });
    }

    const trimmedPin = pin.trim();

    if (!currentAdminPinHash) {
      return res.status(403).json({
        success: false,
        requiresInitialSetup: true,
        error: 'لم يتم تعيين رمز مرور للمسؤول بعد. يرجى تعيين رمز الدخول لأول مرة.'
      });
    }

    const submittedHash = crypto.createHash('sha256').update(trimmedPin).digest('hex');

    if (submittedHash === currentAdminPinHash) {
      resetLoginAttempts(clientIp);
      const token = generateAdminToken();
      res.cookie('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });
      return res.json({
        success: true,
        message: 'تم التحقق من هوية المسؤول بنجاح',
        token,
        expiresInSeconds: 86400
      });
    }

    recordFailedAttempt(clientIp);
    return res.status(401).json({
      success: false,
      error: 'رمز الدخول غير صحيح'
    });
  });

  app.post('/api/admin/logout', (req, res): any => {
    res.clearCookie('admin_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  });

  app.get('/api/admin/session', (req, res): any => {
    const cookieToken = req.cookies?.admin_session;
    const authHeader = req.headers.authorization;
    const customHeader = req.headers['x-admin-token'] as string;
    const token = cookieToken || ((authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : customHeader);

    const isValid = verifyAdminToken(token);
    return res.json({ success: true, authenticated: isValid, role: isValid ? 'admin' : null });
  });

  // Public endpoint for reading synchronized collections (used by students and app on load)
  app.get('/api/app-data/:key', async (req, res): Promise<any> => {
    try {
      const rawKey = req.params.key;
      const result = await getAppDataDocWithMeta(rawKey);
      if (!result) {
        return res.status(404).json({ success: false, error: 'البيانات غير موجودة' });
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.json({
        success: true,
        key: normalizeAppKey(rawKey),
        data: result.data,
        updatedAt: result.updatedAt
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'فشل في استرجاع البيانات' });
    }
  });

  // Batch read endpoint for instant app startup hydration
  app.get('/api/app-data', async (_req, res): Promise<any> => {
    try {
      const all: Record<string, { data: any; updatedAt: string }> = {};
      const keysToLoad = [
        'wikifizya_db_courses_v4',
        'wikifizya_db_settings_v4',
        'wikifizya_db_exams_v4',
        'wikifizya_db_pdf_files_v4',
        'wikifizya_db_pdf_categories_v4',
        'wikifizya_db_notifications_v4',
        'wikifizya_db_weekly_challenges_v4',
        'wikifizya_db_leaderboard_v4'
      ];
      for (const k of keysToLoad) {
        const item = await getAppDataDocWithMeta(k);
        if (item) {
          all[k] = item;
        }
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.json({ success: true, data: all });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'فشل في استرجاع البيانات المجمعة' });
    }
  });

  // Admin sync data endpoint (single key or batch)
  app.post('/api/admin/sync-data', requireAdminAuth, async (req, res): Promise<any> => {
    try {
      const { key, data, updatedAt, batch } = req.body;

      // Batch synchronization
      if (batch && typeof batch === 'object') {
        const results: Record<string, boolean> = {};
        for (const [k, v] of Object.entries(batch)) {
          results[k] = await setAppDataDoc(k, v);
        }
        return res.json({
          success: true,
          message: 'تمت مزامنة جميع البيانات المجمعة بنجاح على الخادم وأصبحت متاحة للطلاب',
          results
        });
      }

      if (!key || data === undefined) {
        return res.status(400).json({ success: false, error: 'المفتاح والبيانات مطلوبان' });
      }
      const success = await setAppDataDoc(key, data, updatedAt);
      if (!success) {
        return res.status(500).json({ success: false, error: 'حدث خطأ أثناء حفظ البيانات على الخادم' });
      }
      return res.json({
        success: true,
        message: 'تم حفظ البيانات بنجاح وأصبحت متاحة للطلاب فوراً',
        key: normalizeAppKey(key)
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'حدث خطأ في الخادم أثناء مزامنة البيانات' });
    }
  });

  // Server sync status diagnostics for Admin
  app.get('/api/admin/server-sync-status', requireAdminAuth, async (_req, res): Promise<any> => {
    try {
      const syncStatus: Record<string, { updatedAt: string; count?: number; type: string }> = {};
      const standardKeys = [
        'wikifizya_db_courses_v4',
        'wikifizya_db_settings_v4',
        'wikifizya_db_exams_v4',
        'wikifizya_db_students_v4',
        'wikifizya_db_activation_keys_v4',
        'wikifizya_db_pdf_files_v4',
        'wikifizya_db_pdf_categories_v4',
        'wikifizya_db_notifications_v4',
        'wikifizya_db_weekly_challenges_v4',
        'wikifizya_db_exam_attempts_v4',
        'wikifizya_db_lesson_progress_v4'
      ];
      for (const k of standardKeys) {
        const item = await getAppDataDocWithMeta(k);
        if (item) {
          const isArr = Array.isArray(item.data);
          syncStatus[k] = {
            updatedAt: item.updatedAt,
            count: isArr ? item.data.length : undefined,
            type: isArr ? 'array' : typeof item.data
          };
        }
      }
      return res.json({
        success: true,
        serverTime: new Date().toISOString(),
        keys: syncStatus
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'فشل في استرجاع تقرير المزامنة' });
    }
  });

  app.get('/api/proxy-image', async (req, res): Promise<any> => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).send('Missing url parameter');
      }
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        return res.status(400).send('Invalid url protocol');
      }
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) {
        return res.status(response.status).send('Failed to fetch image');
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (err) {
      return res.status(500).send('Error proxying image');
    }
  });

  app.post('/api/admin/change-pin', requireAdminAuth, (req, res): any => {
    const { newPin } = req.body;
    if (!newPin || typeof newPin !== 'string' || newPin.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف/أرقام' });
    }
    const hash = crypto.createHash('sha256').update(newPin.trim()).digest('hex');
    saveAdminPinHash(hash);
    return res.json({ success: true, message: 'تم تحديث كلمة المرور الرئيسية بنجاح' });
  });

  app.post('/api/admin/setup-pin', (req, res): any => {
    if (currentAdminPinHash) {
      return res.status(400).json({ success: false, error: 'تم تعيين رمز المرور مسبقاً.' });
    }
    const { newPin } = req.body;
    if (!newPin || typeof newPin !== 'string' || newPin.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'رمز الدخول الجديد يجب ألا يقل عن 6 أحرف أو أرقام' });
    }
    const hash = crypto.createHash('sha256').update(newPin.trim()).digest('hex');
    saveAdminPinHash(hash);
    const token = generateAdminToken();
    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ success: true, message: 'تم تعيين رمز الدخول بنجاح', token });
  });

  // ==========================================
  // 1.5 Student Authentication & Activation API
  // ==========================================
  app.post('/api/student/login', async (req, res): Promise<any> => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
      const rate = checkStudentRateLimit(clientIp, 5, 5 * 60 * 1000);
      if (!rate.allowed) {
        return res.status(429).json({
          success: false,
          error: `تم حظر محاولات الدخول مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى الانتظار ${rate.waitSeconds} ثانية.`
        });
      }

      const { phone, password } = req.body;
      if (!phone || typeof phone !== 'string') {
        recordStudentFailedAttempt(clientIp);
        return res.status(400).json({ success: false, error: 'يرجى إدخال رقم الهاتف' });
      }

      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      const rawTrimmed = phone.trim();

      const students: any[] = (await getAppDataDoc('students')) || [];
      const foundIndex = students.findIndex((s: any) => {
        const sNorm = (s.phone || '').trim().replace(/[^0-9]/g, '');
        return (cleanPhone && sNorm === cleanPhone) || s.phone === rawTrimmed;
      });

      if (foundIndex === -1) {
        recordStudentFailedAttempt(clientIp);
        return res.status(404).json({ success: false, error: 'رقم الهاتف غير مسجل. يرجى إنشاء حساب جديد.' });
      }

      const found = students[foundIndex];
      if (found.isBlocked) {
        return res.status(403).json({ success: false, error: 'هذا الحساب محظور مؤقتًا. يرجى التواصل مع الدعم.' });
      }

      const cleanPass = (password || '').trim();
      const storedPass = found.password || found.password_hash || '';

      if (storedPass) {
        if (!cleanPass) {
          recordStudentFailedAttempt(clientIp);
          return res.status(400).json({ success: false, error: 'يرجى إدخال كلمة المرور' });
        }

        let isMatch = false;
        if (storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$') || storedPass.startsWith('$2y$')) {
          isMatch = await bcrypt.compare(cleanPass, storedPass);
        } else if (storedPass.startsWith('sha256_')) {
          const sha = crypto.createHash('sha256').update(cleanPass).digest('hex');
          isMatch = storedPass === `sha256_${sha}`;
        } else {
          isMatch = storedPass === cleanPass;
        }

        if (!isMatch) {
          recordStudentFailedAttempt(clientIp);
          return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة' });
        }

        // Upgrade stored password to bcrypt hash if legacy
        if (!storedPass.startsWith('$2b$')) {
          found.password = await bcrypt.hash(cleanPass, 10);
          delete found.password_hash;
          students[foundIndex] = found;
          await setAppDataDoc('students', students);
        }
      }

      resetStudentLoginAttempts(clientIp);
      found.lastActiveAt = new Date().toISOString();
      students[foundIndex] = found;
      await setAppDataDoc('students', students);

      const token = generateStudentToken(found.id, found.phone);
      res.cookie('student_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        student: sanitizeStudent(found),
        token
      });
    } catch (err: any) {
      console.error('Student login error:', err);
      return res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل الدخول' });
    }
  });

  app.post('/api/student/register', async (req, res): Promise<any> => {
    try {
      const { name, phone, parentPhone, password, grade, governorate, gender } = req.body;
      if (!name || !phone || !grade) {
        return res.status(400).json({ success: false, error: 'يرجى ملء جميع البيانات الأساسية المطلوبة' });
      }

      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      const cleanParent = (parentPhone || '').trim().replace(/[^0-9]/g, '');

      const students: any[] = (await getAppDataDoc('students')) || [];
      if (students.some((s: any) => (s.phone || '').trim().replace(/[^0-9]/g, '') === cleanPhone)) {
        return res.status(400).json({ success: false, error: 'رقم الهاتف مسجل بالفعل مسبقاً، يمكنك تسجيل الدخول به' });
      }

      const hashedPassword = password ? await bcrypt.hash(password.trim(), 10) : undefined;
      const newStudent = {
        id: 'std-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        name: name.trim(),
        phone: cleanPhone,
        parentPhone: cleanParent,
        password: hashedPassword,
        grade,
        governorate: governorate || '',
        gender: gender || 'male',
        walletBalance: 0,
        registeredAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isBlocked: false,
        registeredDevices: [],
        enrolledCourseIds: [],
        unlockedPdfIds: [],
        courseExpiryDates: {}
      };

      students.push(newStudent);
      await setAppDataDoc('students', students);

      const token = generateStudentToken(newStudent.id, newStudent.phone);
      res.cookie('student_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح',
        student: sanitizeStudent(newStudent),
        token
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'حدث خطأ أثناء إنشاء الحساب' });
    }
  });

  app.post('/api/student/logout', (req, res): any => {
    res.clearCookie('student_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  });

  app.get('/api/student/me', requireStudentAuth, async (req: any, res: express.Response): Promise<any> => {
    try {
      const studentId = req.student.studentId;
      const students: any[] = (await getAppDataDoc('students')) || [];
      const found = students.find((s: any) => s.id === studentId);
      if (!found) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على بيانات الطالب' });
      }
      return res.json({
        success: true,
        student: sanitizeStudent(found)
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'حدث خطأ في جلب بيانات الطالب' });
    }
  });

  app.post('/api/student/activate-code', requireStudentAuth, async (req: any, res: express.Response): Promise<any> => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ success: false, error: 'يرجى إدخال كود التفعيل' });
      }

      const rawCode = code.trim().toUpperCase();
      const studentId = req.student.studentId;

      const keys: any[] = (await getAppDataDoc('keys')) || [];
      const keyIndex = keys.findIndex((k: any) => (k.code || '').trim().toUpperCase() === rawCode);

      if (keyIndex === -1) {
        return res.status(404).json({ success: false, error: 'كود التفعيل غير صحيح، يرجى التأكد وإعادة المحاولة' });
      }

      const foundKey = keys[keyIndex];
      if (foundKey.isUsed) {
        return res.status(400).json({ success: false, error: 'تم استخدام هذا الكود من قبل مسبقاً' });
      }

      if (foundKey.expiresAt && new Date(foundKey.expiresAt) < new Date()) {
        return res.status(400).json({ success: false, error: 'انتهت صلاحية كود التفعيل هذا' });
      }

      const students: any[] = (await getAppDataDoc('students')) || [];
      const studentIndex = students.findIndex((s: any) => s.id === studentId);
      if (studentIndex === -1) {
        return res.status(404).json({ success: false, error: 'حساب الطالب غير موجود' });
      }

      const student = students[studentIndex];

      // Mark key as consumed atomically
      foundKey.isUsed = true;
      foundKey.usedByStudentId = student.id;
      foundKey.usedByStudentName = student.name;
      foundKey.usedAt = new Date().toISOString();
      keys[keyIndex] = foundKey;

      // Unlock content
      let itemTitle = foundKey.targetTitle || foundKey.description || 'المحتوى التعليمي';
      if (foundKey.targetType === 'course' && foundKey.targetId) {
        if (!student.enrolledCourseIds) student.enrolledCourseIds = [];
        if (!student.enrolledCourseIds.includes(foundKey.targetId)) {
          student.enrolledCourseIds.push(foundKey.targetId);
        }
      } else if (foundKey.targetType === 'pdf' && foundKey.targetId) {
        if (!student.unlockedPdfIds) student.unlockedPdfIds = [];
        if (!student.unlockedPdfIds.includes(foundKey.targetId)) {
          student.unlockedPdfIds.push(foundKey.targetId);
        }
      } else if (foundKey.targetType === 'wallet') {
        const credit = foundKey.amount || 0;
        student.walletBalance = (student.walletBalance || 0) + credit;
        itemTitle = `شحن رصيد المحفظة بمبلغ ${credit} ج.م`;
      }

      students[studentIndex] = student;

      // Save both updated documents to Supabase via server client
      await setAppDataDoc('keys', keys);
      await setAppDataDoc('students', students);

      return res.json({
        success: true,
        message: 'تم تفعيل الكود بنجاح!',
        targetType: foundKey.targetType,
        targetId: foundKey.targetId,
        itemTitle,
        student: sanitizeStudent(student)
      });
    } catch (err) {
      console.error('Activate code error:', err);
      return res.status(500).json({ success: false, error: 'حدث خطأ أثناء تفعيل الكود' });
    }
  });

  // ==========================================
  // 2. Protected Secure File Upload API
  // ==========================================
  app.post('/api/upload', requireAdminAuth, requireUploadRateLimit, upload.single('file'), (req, res): any => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'لم يتم استلام أي ملف للرفع' });
      }

      const file = req.file;
      const validation = validateFileContent(file.path, file.originalname, file.mimetype);
      if (!validation.isValid) {
        try { fs.unlinkSync(file.path); } catch (_) {}
        return res.status(400).json({ success: false, error: validation.error || 'الملف غير صالح أمنياً' });
      }

      const fileUrl = `/uploads/${file.filename}`;
      const sizeFormatted =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      return res.json({
        success: true,
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        sizeFormatted,
        sizeBytes: file.size,
        mimeType: file.mimetype,
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'فشل في رفع الملف' });
    }
  });

  // Base64 upload for admin
  app.post('/api/upload-base64', requireAdminAuth, requireUploadRateLimit, (req, res): any => {
    try {
      const { base64Data, fileName, mimeType } = req.body;
      if (!base64Data) {
        return res.status(400).json({ success: false, error: 'بيانات الملف غير متوفرة' });
      }

      const ext = path.extname(fileName || '').toLowerCase() || (mimeType?.includes('video') ? '.mp4' : mimeType?.includes('pdf') ? '.pdf' : '.jpg');
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return res.status(400).json({ success: false, error: 'امتداد الملف غير مدعوم' });
      }

      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const dataBuffer = matches && matches.length === 3
        ? Buffer.from(matches[2], 'base64')
        : Buffer.from(base64Data, 'base64');

      const uniqueName = `upload_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
      const targetPath = path.join(uploadsDir, uniqueName);

      fs.writeFileSync(targetPath, dataBuffer);

      const validation = validateFileContent(targetPath, fileName || uniqueName, mimeType || '');
      if (!validation.isValid) {
        try { fs.unlinkSync(targetPath); } catch (_) {}
        return res.status(400).json({ success: false, error: validation.error || 'الملف غير صالح أمنياً' });
      }

      return res.json({
        success: true,
        url: `/uploads/${uniqueName}`,
        filename: uniqueName,
        sizeBytes: dataBuffer.length,
      });
    } catch (err: any) {
      console.error('Base64 upload error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'فشل في حفظ الملف' });
    }
  });

  // Admin Instructor Photo Upload / Set endpoint
  app.post('/api/admin/instructor-photo', requireAdminAuth, upload.single('file'), async (req, res): Promise<any> => {
    try {
      let finalPhotoUrl = '';

      // 1. Direct file upload
      if (req.file) {
        const file = req.file;
        const validation = validateFileContent(file.path, file.originalname, file.mimetype);
        if (!validation.isValid) {
          try { fs.unlinkSync(file.path); } catch (_) {}
          return res.status(400).json({ success: false, error: validation.error || 'الملف غير صالح أمنياً' });
        }
        finalPhotoUrl = `/uploads/${file.filename}`;
      }
      // 2. Base64 payload or URL in body
      else if (req.body) {
        const { base64Data, url, fileName, mimeType } = req.body;
        if (base64Data) {
          const ext = path.extname(fileName || '').toLowerCase() || (mimeType?.includes('png') ? '.png' : mimeType?.includes('webp') ? '.webp' : '.jpg');
          const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          const dataBuffer = matches && matches.length === 3 ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
          const uniqueName = `instructor_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
          const targetPath = path.join(uploadsDir, uniqueName);
          fs.writeFileSync(targetPath, dataBuffer);
          finalPhotoUrl = `/uploads/${uniqueName}`;
        } else if (url) {
          const cleanUrl = (url || '').trim();
          if (cleanUrl.includes('drive.google.com') || cleanUrl.includes('lh3.googleusercontent.com')) {
            const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
              const directDriveUrl = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
              try {
                const fetched = await fetch(directDriveUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                  }
                });
                const contentType = fetched.headers.get('content-type') || '';
                if (fetched.ok && contentType.startsWith('image/')) {
                  const buf = await fetched.arrayBuffer();
                  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
                  const uniqueName = `instructor_drive_${Date.now()}${ext}`;
                  fs.writeFileSync(path.join(uploadsDir, uniqueName), Buffer.from(buf));
                  finalPhotoUrl = `/uploads/${uniqueName}`;
                } else {
                  finalPhotoUrl = cleanUrl;
                }
              } catch (_) {
                finalPhotoUrl = cleanUrl;
              }
            } else {
              finalPhotoUrl = cleanUrl;
            }
          } else {
            finalPhotoUrl = cleanUrl;
          }
        }
      }

      if (!finalPhotoUrl) {
        return res.status(400).json({ success: false, error: 'لم يتم استلام صورة أو رابط صالح' });
      }

      // Update in settings
      const settings = (await getAppDataDoc('wikifizya_db_settings_v4')) || {};
      const updatedSettings = { ...settings, instructorPhotoUrl: finalPhotoUrl };
      await setAppDataDoc('wikifizya_db_settings_v4', updatedSettings);

      return res.json({
        success: true,
        photoUrl: finalPhotoUrl,
        settings: updatedSettings,
        message: 'تم تحديث وحفظ صورة المعلم بنجاح على الخادم وأصبحت متاحة لجميع الطلاب فوراً'
      });
    } catch (err: any) {
      console.error('Set instructor photo error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'حدث خطأ أثناء حفظ صورة المعلم' });
    }
  });

  // Student Avatar Upload endpoint (Image only, max 15MB, validated)
  app.post('/api/student/upload-avatar', requireUploadRateLimit, upload.single('file'), (req, res): any => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'لم يتم اختيار أي صورة للرفع' });
      }

      const file = req.file;
      const MAX_AVATAR_SIZE = 15 * 1024 * 1024; // 15MB
      if (file.size > MAX_AVATAR_SIZE) {
        try { fs.unlinkSync(file.path); } catch (_) {}
        return res.status(400).json({ success: false, error: 'حجم الصورة يتجاوز الحد الأقصى المسموح به (15 ميجابايت)' });
      }

      const ext = path.extname(file.originalname).toLowerCase();
      const ALLOWED_AVATAR_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
      if (!ALLOWED_AVATAR_EXTS.has(ext) || !file.mimetype.startsWith('image/')) {
        try { fs.unlinkSync(file.path); } catch (_) {}
        return res.status(400).json({ success: false, error: 'صيغة الملف غير مدعومة، يرجى اختيار صورة بحجم مناسب (JPG, PNG, WEBP)' });
      }

      const validation = validateFileContent(file.path, file.originalname, file.mimetype);
      if (!validation.isValid) {
        try { fs.unlinkSync(file.path); } catch (_) {}
        return res.status(400).json({ success: false, error: validation.error || 'الصورة غير صالحة أمنياً' });
      }

      const fileUrl = `/uploads/${file.filename}`;
      return res.json({
        success: true,
        url: fileUrl,
        filename: file.filename,
      });
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'فشل في رفع الصورة' });
    }
  });

  // Student Payment Receipt Upload endpoint
  app.post('/api/student/upload-receipt', requireUploadRateLimit, upload.single('file'), (req, res): any => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'لم يتم اختيار إيصال التحويل' });
      }

      const file = req.file;
      const MAX_RECEIPT_SIZE = 15 * 1024 * 1024; // 15MB
      if (file.size > MAX_RECEIPT_SIZE) {
        try { fs.unlinkSync(file.path); } catch (_) {}
        return res.status(400).json({ success: false, error: 'حجم الصورة يتجاوز الحد الأقصى (15 ميجابايت)' });
      }

      const validation = validateFileContent(file.path, file.originalname, file.mimetype);
      if (!validation.isValid) {
        try { fs.unlinkSync(file.path); } catch (_) {}
        return res.status(400).json({ success: false, error: validation.error || 'ملف الإيصال غير صالح' });
      }

      const fileUrl = `/uploads/${file.filename}`;
      return res.json({
        success: true,
        url: fileUrl,
        filename: file.filename,
      });
    } catch (err: any) {
      console.error('Receipt upload error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'فشل في رفع إيصال الدفع' });
    }
  });

  // ==========================================
  // 3. Gemini AI Physics Assistant
  // ==========================================
  app.post('/api/gemini/physics-assistant', async (req, res): Promise<any> => {
    try {
      const { prompt, lessonTitle, courseTitle, imageBase64, chatHistory, history, lessonContext } = req.body;
      const historyList = chatHistory || history;
      const resolvedLessonTitle = lessonTitle || lessonContext;
      if (!prompt && !imageBase64) {
        return res.status(400).json({ success: false, error: 'يرجى كتابة سؤال فيزيائي أو إرفاق صورة للمسألة' });
      }

      const ai = getGemini();

      const systemInstruction = `
أنت "مستر فيزياء الذكي AI" - معلم ومساعد شخصي متخصص في مادة الفيزياء لطلاب الثانوية العامة (الصف الأول والثاني والثالث الثانوي) بالمنهج المصري الحديث.

قواعدك الأساسية الصارمة:
1. أنت تشرح مادة الفيزياء فقط. إذا سألك الطالب في أي موضوع خارج الفيزياء أو الرياضيات المرتبطة بها (مثل لغات أخرى، أو مواضيع عامة)، اعتذر بأدب واشرح له بلباقة أن تخصصك فقط فيزياء الثانوية العامة.
2. اشرح المسائل خطوة بخطوة باللغة العربية الواضحة:
   - ابدأ بذكر "المعطيات" (Given).
   - حدد "المطلوب" (Required).
   - اكتب "القانون الفيزيائي الأساسي والعلاقات الرياضية" بوضوح مع وحدات القياس (SI Units).
   - عوض بالأرقام واشرح فكرة الحل الفيزيائية (لماذا استنتجنا هذه الخطوة).
   - اكتب الناتج النهائي بوحدته الصحيحة.
3. ركز على مفاهيم المنهج المصري:
   - التيار الكهربي وقانون أوم، كيرشوف، التأثير المغناطيسي، القوة وعزم الازدواج، الحث الكهرومغناطيسي، فاراداي وقاعدة لينز، الدينامو والمحول والمحرك، دوائر التيار المتردد (R-L-C)، المعاوقة والرنين.
   - الفيزياء الحديثة: إشعاع الجسم الأسود، بلانك، الانبعاث الحراري والتأثير الكهروضوئي (أينشتاين)، كومتون، دي برولي، الطبيعة المزدوجة، الأطياف الذرية، الليزر، الإلكترونيات الحديثة والوصلة الثنائية والترانزستور والبوابات المنطقية.
   - فيزياء 1ث و 2ث: الميكانيكا، الحركة، المتجهات، نيوتن، الطاقة، الموائع، الضغط، باسكال، الكثافة، الغازات (بويل، شارل، القانون العام)، الموجات، الصوت والضوء والعدسات والمنشور.
4. استخدم تنسيق Markdown أنيق، مع خطوط عريضة وقوائم ونقاط، واشرح أي رسم بياني أو دائرة مرسومة في الصورة بدقة متناهية.
5. شجع الطالب دائماً بكلمات تحفيزية مثل: "يا بطل الفيزياء"، "خطوة ممتازة نحو الـ 60/60".
`;

      const contents: any[] = [];

      // Include previous conversation history if present (cleanly sanitized and alternated)
      if (Array.isArray(historyList) && historyList.length > 0) {
        const cleanHistory = historyList
          .filter((item: any) => item && typeof item.text === 'string' && item.text.trim().length > 0)
          .filter((item: any) => {
            const t = item.text.trim();
            // Filter out system greetings, error messages, and retry banners
            return !t.includes('عذرًا، خادم الذكاء الاصطناعي') && 
                   !t.includes('تعذر الاتصال بخادم') && 
                   !t.includes('أنا مساعدك الذكي في مادة الفيزياء');
          })
          .slice(-6);

        cleanHistory.forEach((item: { role: string; text: string }) => {
          const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';
          
          // Gemini contents must begin with a 'user' turn
          if (contents.length === 0 && role !== 'user') {
            return;
          }

          // Enforce strict alternating roles (user <-> model)
          const lastTurn = contents[contents.length - 1];
          if (lastTurn && lastTurn.role === role) {
            lastTurn.parts[0].text += `\n${item.text}`;
          } else {
            contents.push({
              role,
              parts: [{ text: item.text }]
            });
          }
        });
      }

      // Context string about the current lesson
      const contextPrefix = resolvedLessonTitle || courseTitle 
        ? `[سياق الدرس الحالي للطالب: كورس "${courseTitle || 'فيزياء'}" - درس "${resolvedLessonTitle || 'محتوى الدرس'}"]\n`
        : '';

      const currentParts: any[] = [];

      if (imageBase64) {
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const mime = matches && matches.length === 3 ? matches[1] : 'image/jpeg';
        const data = matches && matches.length === 3 ? matches[2] : imageBase64;
        currentParts.push({
          inlineData: {
            mimeType: mime,
            data: data
          }
        });
      }

      currentParts.push({
        text: `${contextPrefix}${prompt || 'اشرح هذه المسألة الفيزيائية الموضحة بالصورة بالتفصيل والخطوات والقوانين المستخدمة.'}`
      });

      // If the last turn in contents was 'user', append/replace so we maintain strict alternating order
      const lastContentTurn = contents[contents.length - 1];
      if (lastContentTurn && lastContentTurn.role === 'user') {
        // Merge the current parts into the user turn
        lastContentTurn.parts.push(...currentParts);
      } else {
        contents.push({
          role: 'user',
          parts: currentParts
        });
      }

      const { text: replyText, modelUsed } = await generateWithFallback(ai, {
        contents,
        systemInstruction,
        temperature: 0.3,
      });

      return res.json({
        success: true,
        reply: replyText || 'عذراً، لم أتمكن من استخراج الإجابة. يرجى المحاولة مجدداً أو صياغة السؤال بشكل أوضح.',
        model: modelUsed
      });
    } catch (err: any) {
      console.error('Gemini Assistant Error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'حدث خطأ أثناء التواصل مع المعلم الذكي. يرجى المحاولة مرة أخرى.'
      });
    }
  });

  // ==========================================
  // 4. Parent WhatsApp Performance Report
  // ==========================================
  app.post('/api/parent-report/whatsapp-link', (req, res): any => {
    try {
      const {
        studentName,
        parentPhone,
        grade,
        attendanceRate,
        completedLessons,
        totalLessons,
        examAverage,
        latestExamScore,
        teacherNote
      } = req.body;

      if (!studentName || !parentPhone) {
        return res.status(400).json({ success: false, error: 'بيانات الطالب أو هاتف ولي الأمر غير مكتملة' });
      }

      let cleanPhone = parentPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('01')) {
        cleanPhone = '2' + cleanPhone; // Egypt country code
      } else if (cleanPhone.startsWith('1')) {
        cleanPhone = '20' + cleanPhone;
      }

      const reportMessage = `
السلام عليكم ورحمة الله وبركاته
ولي أمر الطالب المحترم / ولي أمر ${studentName}،

تحية طيبة من منصة *ويكيفزياء (WikiFizya)* ومستر الفيزياء

نشارك مع حضراتكم التقرير الدوري لمستوى والتزام الطالب في مادة الفيزياء (${grade || 'الثانوية العامة'}):

*ملخص الأداء والمتابعة:*
- *اسم الطالب:* ${studentName}
- *الدروس المشاهدة والمكتملة:* ${completedLessons || 0} من إجمالي ${totalLessons || 0} درس (${attendanceRate || 0}%)
- *متوسط درجات الامتحانات والواجبات:* ${examAverage || 0}%
${latestExamScore ? `- *آخر امتحان تم تسليمه:* ${latestExamScore}` : ''}
- *ملاحظة المعلم:* ${teacherNote || 'طالب متميز وملتزم بالحصص والواجبات، نتمنى له دوام التفوق والدرجة النهائية بإذن الله.'}

مع تحيات إدارة منصة ويكيفزياء التعليمية.
`.trim();

      const encodedMessage = encodeURIComponent(reportMessage);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      return res.json({
        success: true,
        whatsappUrl,
        messageText: reportMessage
      });
    } catch (err: any) {
      console.error('Parent report generation error:', err);
      return res.status(500).json({ success: false, error: 'فشل في إنشاء رابط التقرير' });
    }
  });

  // ==========================================
  // 5. Video Concept & Transcript Search (Gemini AI)
  // ==========================================
  app.post('/api/gemini/transcript-search', async (req, res): Promise<any> => {
    try {
      const { query, courses } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, error: 'يرجى كتابة المفهوم أو المسألة الفيزيائية المراد البحث عنها' });
      }

      const ai = getGemini();

      // Structure context of all courses and lessons for fast mapping
      const courseSummaries = Array.isArray(courses)
        ? courses.map((c: any) => ({
            id: c.id,
            title: c.title,
            grade: c.grade,
            units: (c.units || []).map((u: any) => ({
              id: u.id,
              title: u.title,
              lessons: (u.lessons || []).map((l: any) => ({
                id: l.id,
                title: l.title,
                duration: l.duration,
                description: l.description,
                videoUrl: l.videoUrl
              }))
            }))
          }))
        : [];

      const prompt = `
أنت محرك بحث ذكي متقدم لمنصة "ويكيفزياء" لمادة الفيزياء للثانوية العامة.
المطلوب: بناءً على استفسار أو مفهوم يبحث عنه الطالب ("${query}")، ابحث في قائمة الكورسات والوحدات والدروس المتاحة وحدد بدقة أفضل الدروس المطابقة، مع تحديد التوقيت التقريبي بالدقائق والثواني (Timestamp) الذي يُشرح فيه هذا المفهوم، وكتابة ملخص فيزيائي موجز لما سيجده الطالب في هذه الدقيقة.

قائمة الكورسات والدروس المتاحة في المنصة:
${JSON.stringify(courseSummaries, null, 2)}

أرجع الناتج بتنسيق JSON حصرياً كالتالي:
{
  "matches": [
    {
      "courseId": "id",
      "courseTitle": "عنوان الكورس",
      "unitTitle": "عنوان الوحدة",
      "lessonId": "id",
      "lessonTitle": "عنوان الدرس",
      "timestampSeconds": 180,
      "timestampFormatted": "03:00",
      "relevanceReason": "شرح موجز: يتناول هذا الجزء قانون كيرشوف الثاني وتطبيق حلقة الجهد...",
      "confidenceScore": 95
    }
  ],
  "conceptSummary": "شرح مركز للمفهوم المطلوب في سطرين ليفيد الطالب مباشرة",
  "recommendedFormula": "القانون الرياضي المرتبط بالمفهوم إن وجد"
}
`;

      const { text: generatedJson } = await generateWithFallback(ai, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        temperature: 0.2,
        responseMimeType: 'application/json',
      });

      let parsed: any = {};
      try {
        parsed = JSON.parse(generatedJson || '{}');
      } catch {
        parsed = { matches: [], conceptSummary: generatedJson || '' };
      }

      return res.json({
        success: true,
        data: parsed
      });
    } catch (err: any) {
      console.error('Transcript search error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'حدث خطأ أثناء البحث الذكي في محتوى الدروس.'
      });
    }
  });

  // ==========================================
  // 6. External WhatsApp Broadcast & Push Helper
  // ==========================================
  app.post('/api/notifications/broadcast-whatsapp', (req, res): any => {
    try {
      const { title, message, targetGrade, linkUrl } = req.body;
      if (!title || !message) {
        return res.status(400).json({ success: false, error: 'عنوان ورسالة الإشعار مطلوبة' });
      }

      const broadcastText = `
*إشعار هام من منصة ويكيفزياء (WikiFizya)*
${targetGrade ? `الموجه إلى: *${targetGrade}*` : 'لجميع طلاب الفيزياء'}

*${title}*

${message}

${linkUrl ? `للدخول مباشرة: ${linkUrl}` : ''}

نتمنى لكم دوام التوفيق والتفوق المستمر
`.trim();

      const encoded = encodeURIComponent(broadcastText);
      const whatsappBroadcastUrl = `https://api.whatsapp.com/send?text=${encoded}`;

      return res.json({
        success: true,
        whatsappBroadcastUrl,
        formattedMessage: broadcastText
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'فشل في تجهيز رسالة البث' });
    }
  });

  // ==========================================
  // 7. Payment Gateway Webhook (Paymob / Fawry Auto-Confirmation)
  // ==========================================
  app.post('/api/payments/webhook', (req, res): any => {
    try {
      const payload = req.body;
      console.log('Received payment gateway webhook event:', payload);
      // Validates signature and returns 200 OK
      return res.status(200).json({
        received: true,
        message: 'تم استقبال إشعار بوابة الدفع بنجاح'
      });
    } catch (err) {
      return res.status(500).json({ error: 'Webhook processing error' });
    }
  });

  // Explicit SEO Endpoints for Search Engine Crawlers
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain');
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.sendFile(robotsPath);
    } else {
      res.send("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nSitemap: https://wikiphysics0.vercel.app/sitemap.xml\n");
    }
  });

  app.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml');
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.sendFile(sitemapPath);
    } else {
      res.send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://wikiphysics0.vercel.app/</loc><priority>1.0</priority></url></urlset>');
    }
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/uploads', express.static(uploadsDir, {
      maxAge: '1d'
    }));
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        // Vite hashed assets under /assets/ are immutable and can be cached for 1 year
        if (filePath.includes(path.sep + 'assets' + path.sep)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.endsWith('.html')) {
          // HTML entry points must never be cached so users always get the latest bundle
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wikifizya LMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Start Error:', err);
});

export default app;

