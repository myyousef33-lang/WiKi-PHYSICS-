import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup Multer for disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate safe clean filename with original extension
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
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
    fileSize: 500 * 1024 * 1024, // 500 MB max file size for videos/PDFs/images
  },
});

async function startServer() {
  const app = express();
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

  // Direct File Upload API Endpoint (Videos, PDFs, Images)
  app.post('/api/upload', upload.single('file'), (req, res): any => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'لم يتم استلام أي ملف للرفع' });
      }

      const file = req.file;
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

  // Base64 fallback upload endpoint (if needed)
  app.post('/api/upload-base64', (req, res): any => {
    try {
      const { base64Data, fileName, mimeType } = req.body;
      if (!base64Data) {
        return res.status(400).json({ success: false, error: 'بيانات الملف غير متوفرة' });
      }

      // Extract base64 payload
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const dataBuffer = matches && matches.length === 3
        ? Buffer.from(matches[2], 'base64')
        : Buffer.from(base64Data, 'base64');

      const ext = path.extname(fileName || '').toLowerCase() || (mimeType?.includes('video') ? '.mp4' : mimeType?.includes('pdf') ? '.pdf' : '.jpg');
      const uniqueName = `upload_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
      const targetPath = path.join(uploadsDir, uniqueName);

      fs.writeFileSync(targetPath, dataBuffer);

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

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Ensure dist static serves public/uploads as well
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
