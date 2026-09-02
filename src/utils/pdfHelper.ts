import { MediaStore } from '../services/mediaStore';

/**
 * Universal PDF Resolver & Helper for Wiki Physics LMS
 */

// Memory cache for created Blob URLs so we don't leak or regenerate unnecessarily
const blobUrlCache = new Map<string, string>();

/**
 * Convert Base64 data URI to a Blob
 */
function base64ToBlob(base64Data: string, contentType = 'application/pdf'): Blob {
  try {
    const parts = base64Data.split(';base64,');
    const raw = window.atob(parts[1] || parts[0]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  } catch (e) {
    console.error('base64ToBlob error:', e);
    return new Blob([], { type: contentType });
  }
}

/**
 * Parse Google Drive / Docs ID from various URL formats
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Creates a high-quality SVG Data URL representing a Physics Worksheet Document.
 * Used as an instant fallback whenever a PDF file URL is missing, broken, or unreachable.
 */
export function generateSamplePhysicsWorksheetDataUrl(title = 'شيت أسئلة وتمارين الفيزياء'): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&amp;display=swap');
      text { font-family: 'Cairo', system-ui, sans-serif; direction: rtl; }
      .header-bg { fill: #0D1B3E; }
      .gold-accent { fill: #F5B301; }
      .card { fill: #FFFFFF; stroke: #E2E8F0; stroke-width: 2; rx: 16; }
      .title { font-size: 24px; font-weight: 900; fill: #FFFFFF; text-anchor: middle; }
      .subtitle { font-size: 14px; font-weight: 700; fill: #F5B301; text-anchor: middle; }
      .q-num { font-size: 16px; font-weight: 900; fill: #1E4FD8; }
      .q-text { font-size: 15px; font-weight: 700; fill: #1E293B; }
      .formula { font-size: 15px; font-weight: 700; fill: #0F172A; font-family: monospace; }
      .answer-box { fill: #F8FAFC; stroke: #94A3B8; stroke-dasharray: 6 4; stroke-width: 1.5; rx: 10; }
    </style>
  </defs>

  <!-- Page Background -->
  <rect width="800" height="1130" fill="#F1F5F9" />

  <!-- Page Container Sheet -->
  <rect x="20" y="20" width="760" height="1090" fill="#FFFFFF" rx="20" stroke="#CBD5E1" stroke-width="2" />

  <!-- Header Section -->
  <path d="M 20 40 Q 20 20 40 20 L 760 20 Q 780 20 780 40 L 780 130 L 20 130 Z" class="header-bg" />
  <rect x="20" y="125" width="760" height="6" class="gold-accent" />

  <text x="400" y="65" class="title">${title}</text>
  <text x="400" y="95" class="subtitle">منصة ويكيفزياء التعليمية • مستر الفيزياء • الصف الثالث الثانوي</text>
  <text x="740" y="110" font-size="12" fill="#94A3B8" text-anchor="end">تاريخ الإصدار: 2026</text>

  <!-- Instructions Banner -->
  <rect x="40" y="145" width="720" height="40" fill="#EFF6FF" rx="10" stroke="#BFDBFE" />
  <text x="740" y="170" font-size="13" font-weight="700" fill="#1E4FD8" text-anchor="end">📌 تعليمات الواجب: يمكنك الكتابة والرسم مباشرة بالقلم فوق هذا المستند للحل والتسليم.</text>

  <!-- Question 1 -->
  <g transform="translate(40, 200)">
    <rect x="0" y="0" width="720" height="260" class="card" />
    <text x="700" y="35" class="q-num" text-anchor="end">السؤال الأول (4 درجات):</text>
    <text x="700" y="65" class="q-text" text-anchor="end">في الدائرة الكهربية الموضحة، إذا كانت المقاومة الداخلية للمصدر r = 1 Ω، والمقاومات R1 = 6 Ω،</text>
    <text x="700" y="90" class="q-text" text-anchor="end">R2 = 3 Ω متصلتان على التوازي. احسب القوة الدفعية الكهربية (V_B) للمصدر إذا كانت قراءة الفولتميتر V = 12 V.</text>

    <!-- Formula / Diagram Box -->
    <rect x="30" y="105" width="660" height="70" fill="#F8FAFC" rx="10" stroke="#E2E8F0" />
    <text x="670" y="132" class="formula" text-anchor="end">R_eq = (R1 × R2) / (R1 + R2) = (6 × 3) / (6 + 3) = 2 Ω</text>
    <text x="670" y="158" class="formula" text-anchor="end">I = V / R_eq = 12 / 2 = 6 A  ⇒  V_B = I × (R_eq + r) = 6 × (2 + 1) = 18 V</text>

    <!-- Answer Box -->
    <rect x="30" y="185" width="660" height="60" class="answer-box" />
    <text x="670" y="220" font-size="13" fill="#94A3B8" text-anchor="end">✍️ مساحة كتابة الخطوات والناتج النهائي بالـ Volts هنا...</text>
  </g>

  <!-- Question 2 -->
  <g transform="translate(40, 480)">
    <rect x="0" y="0" width="720" height="260" class="card" />
    <text x="700" y="35" class="q-num" text-anchor="end">السؤال الثاني (4 درجات):</text>
    <text x="700" y="65" class="q-text" text-anchor="end">سلك مستقيم طوله L = 0.5 m يمر به تيار شدته I = 4 A وموضوع في مجال مغناطيسي منتظم B = 0.8 T.</text>
    <text x="700" y="90" class="q-text" text-anchor="end">احسب القوة المغناطيسية المؤثرة على السلك عندما يصنع زاوية θ = 30° مع اتجاه المجال المغناطيسي.</text>

    <!-- Formula Box -->
    <rect x="30" y="105" width="660" height="70" fill="#F8FAFC" rx="10" stroke="#E2E8F0" />
    <text x="670" y="132" class="formula" text-anchor="end">F = B × I × L × sin(θ)</text>
    <text x="670" y="158" class="formula" text-anchor="end">F = 0.8 × 4 × 0.5 × sin(30°) = 0.8 N</text>

    <!-- Answer Box -->
    <rect x="30" y="185" width="660" height="60" class="answer-box" />
    <text x="670" y="220" font-size="13" fill="#94A3B8" text-anchor="end">✍️ اكتب قيمة القوة المغناطيسية بوحدة النيوتن (Newton)...</text>
  </g>

  <!-- Question 3 -->
  <g transform="translate(40, 760)">
    <rect x="0" y="0" width="720" height="240" class="card" />
    <text x="700" y="35" class="q-num" text-anchor="end">السؤال الثالث (4 درجات):</text>
    <text x="700" y="65" class="q-text" text-anchor="end">استنتج العلاقة بين الطول الموجي المصاحب للجسيم (طول دي برولي λ) وكمية التحرك p_m،</text>
    <text x="700" y="90" class="q-text" text-anchor="end">واذكر تطبيقاً تكنولوجياً يعتمد على الطبيعة الموجية للإلكترون.</text>

    <rect x="30" y="110" width="660" height="110" class="answer-box" />
    <text x="670" y="145" font-size="13" fill="#94A3B8" text-anchor="end">✍️ اكتب استنتاج معادلة دي برولي وتطبيق الميكروسكوب الإلكتروني هنا...</text>
  </g>

  <!-- Footer -->
  <text x="400" y="1080" font-size="13" font-weight="700" fill="#64748B" text-anchor="middle">منصة ويكيفزياء LMS • بالتوفيق لجميع الأبطال</text>
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves any PDF URL into a browser-renderable URL for <iframe /> or <embed />
 */
export async function resolvePdfUrl(rawUrl?: string): Promise<string> {
  if (!rawUrl || !rawUrl.trim() || rawUrl.includes('dummy.pdf')) {
    return generateSamplePhysicsWorksheetDataUrl();
  }

  const url = rawUrl.trim();

  // 1. Check in-memory cache
  if (blobUrlCache.has(url)) {
    return blobUrlCache.get(url)!;
  }

  // 2. Check for IndexedDB local-media
  if (url.startsWith('local-media:')) {
    try {
      const blobUrl = await MediaStore.getMediaUrl(url);
      if (blobUrl) {
        blobUrlCache.set(url, blobUrl);
        return blobUrl;
      }
    } catch (e) {
      console.warn('Error resolving local-media PDF:', e);
    }
  }

  // 3. Check for Data URI
  if (url.startsWith('data:')) {
    if (url.includes('pdf') || url.includes('octet-stream')) {
      try {
        const blob = base64ToBlob(url, 'application/pdf');
        const blobUrl = URL.createObjectURL(blob);
        blobUrlCache.set(url, blobUrl);
        return blobUrl;
      } catch (e) {
        return url;
      }
    }
    return url;
  }

  // 4. Check for Google Drive URL
  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  // 5. Standard remote or local server URL (/uploads/...)
  return url;
}

/**
 * Generates clean iframe / embed source for displaying the PDF
 */
export function getEmbedPdfSource(resolvedUrl: string, hideToolbar = false): string {
  if (!resolvedUrl) return generateSamplePhysicsWorksheetDataUrl();

  // If Google Drive link, return preview link without any query/hash mutation
  if (resolvedUrl.includes('drive.google.com')) {
    return resolvedUrl;
  }

  // If Data URI (SVG worksheet fallback or PDF base64)
  if (resolvedUrl.startsWith('data:')) {
    return resolvedUrl;
  }

  // If external HTTP/HTTPS URL, use Google Docs Viewer for reliable cross-origin iframe embed
  if (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) {
    if (!resolvedUrl.includes('localhost') && !resolvedUrl.includes('127.0.0.1') && !resolvedUrl.includes('drive.google.com')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(resolvedUrl)}&embedded=true`;
    }
  }

  // If blob URL or relative uploads URL
  if (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('/')) {
    if (hideToolbar) {
      return `${resolvedUrl}#toolbar=0&navpanes=0&scrollbar=1`;
    }
    return `${resolvedUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
  }

  return resolvedUrl;
}

/**
 * Generates the best download URL and triggers browser download
 */
export async function downloadPdfFile(rawUrl: string, fileName = 'مذكرة_فيزياء.pdf'): Promise<void> {
  if (!rawUrl) return;

  const driveId = extractGoogleDriveId(rawUrl);
  if (driveId) {
    window.open(`https://drive.google.com/uc?export=download&id=${driveId}`, '_blank');
    return;
  }

  const resolvedUrl = await resolvePdfUrl(rawUrl);

  const cleanName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const link = document.createElement('a');
  link.href = resolvedUrl;
  link.download = cleanName;
  link.target = '_blank';
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
