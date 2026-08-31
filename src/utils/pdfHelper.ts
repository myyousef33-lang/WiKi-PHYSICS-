import { MediaStore } from '../services/mediaStore';

/**
 * Universal PDF Resolver & Helper for Wiki Physics LMS
 * Handles:
 * 1. local-media: IndexedDB stored media
 * 2. base64 data:application/pdf (converts to safe Object URL to prevent iframe blocking)
 * 3. Google Drive links (converts to iframe preview and direct download links)
 * 4. Regular HTTP/HTTPS URLs
 */

// Memory cache for created Blob URLs so we don't leak or regenerate unnecessarily
const blobUrlCache = new Map<string, string>();

/**
 * Convert Base64 data URI to a Blob
 */
function base64ToBlob(base64Data: string, contentType = 'application/pdf'): Blob {
  const parts = base64Data.split(';base64,');
  const raw = window.atob(parts[1] || parts[0]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Parse Google Drive ID from various URL formats
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url || !url.includes('drive.google.com')) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Resolves any PDF URL into a browser-renderable URL for <iframe /> or <embed />
 */
export async function resolvePdfUrl(rawUrl?: string): Promise<string> {
  if (!rawUrl || !rawUrl.trim()) {
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
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

  // 3. Check for Data URI (convert to Blob URL so browsers don't block in iframe/object)
  if (url.startsWith('data:') && (url.includes('pdf') || url.includes('octet-stream'))) {
    try {
      const blob = base64ToBlob(url, 'application/pdf');
      const blobUrl = URL.createObjectURL(blob);
      blobUrlCache.set(url, blobUrl);
      return blobUrl;
    } catch (e) {
      console.warn('Failed to convert base64 PDF to blob URL:', e);
      return url;
    }
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
