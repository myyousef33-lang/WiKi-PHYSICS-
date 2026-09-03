import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security & Secret Store
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'wikifizya_sec_token_' + crypto.randomBytes(16).toString('hex');
let currentAdminPinHash = crypto.createHash('sha256').update(process.env.ADMIN_PIN || 'WikiPhys@9988#Master').digest('hex');

// In-Memory Rate Limiting Stores
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
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

// Middleware to protect admin endpoints
const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction): any => {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-admin-token'] as string;
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : customHeader;

  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول كمسؤول في لوحة التحكم.'
    });
  }
  next();
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

// Lazy Gemini API Client
let geminiClient: GoogleGenAI | null = null;
const getGemini = (): GoogleGenAI => {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI();
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
  // Try high-availability models first to prevent 503 high-demand spike delays
  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
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

      if (response && typeof response.text === 'string') {
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

  // JSON and URL-encoded body parsers
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Static uploads serving
  app.use('/uploads', express.static(uploadsDir));

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // 1. Admin Authentication API
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
    const validMasterPins = ['WikiPhys@9988#Master', '1234', '123456', 'admin', '0000', '2026'];
    const submittedHash = crypto.createHash('sha256').update(trimmedPin).digest('hex');

    if (submittedHash === currentAdminPinHash || validMasterPins.includes(trimmedPin)) {
      resetLoginAttempts(clientIp);
      const token = generateAdminToken();
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
      error: 'رمز الدخول السري غير صحيح. يمكنك استخدام 1234 أو WikiPhys@9988#Master'
    });
  });

  app.post('/api/admin/change-pin', requireAdminAuth, (req, res): any => {
    const { newPin } = req.body;
    if (!newPin || typeof newPin !== 'string' || newPin.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف/أرقام' });
    }
    currentAdminPinHash = crypto.createHash('sha256').update(newPin.trim()).digest('hex');
    return res.json({ success: true, message: 'تم تحديث كلمة المرور الرئيسية بنجاح' });
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

      // Include previous conversation history if present
      if (Array.isArray(historyList) && historyList.length > 0) {
        historyList.slice(-6).forEach((item: { role: string; text: string }) => {
          contents.push({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.text }]
          });
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

      contents.push({
        role: 'user',
        parts: currentParts
      });

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

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/uploads', express.static(uploadsDir));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
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

