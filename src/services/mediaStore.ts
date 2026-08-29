// IndexedDB Persistent Store for Large Media (Videos, Audio, PDFs, Images)
// Enables uploading direct files (up to hundreds of MBs) without server memory exhaustion.

const DB_NAME = 'WikiPhysicsMediaStoreDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

interface StoredMediaRecord {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  size: number;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const MediaStore = {
  async saveMedia(id: string, file: File | Blob, originalName?: string): Promise<string> {
    const db = await openDB();
    const record: StoredMediaRecord = {
      id,
      name: originalName || (file instanceof File ? file.name : 'media_file'),
      type: file.type || 'video/mp4',
      blob: file,
      size: file.size,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => {
        resolve(`local-media:${id}`);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getMediaUrl(mediaIdOrUri: string): Promise<string | null> {
    const id = mediaIdOrUri.startsWith('local-media:')
      ? mediaIdOrUri.replace('local-media:', '')
      : mediaIdOrUri;

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          const record = req.result as StoredMediaRecord | undefined;
          if (record && record.blob) {
            const url = URL.createObjectURL(record.blob);
            resolve(url);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not read from MediaStore:', e);
      return null;
    }
  },

  async deleteMedia(id: string): Promise<void> {
    try {
      const cleanId = id.startsWith('local-media:') ? id.replace('local-media:', '') : id;
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(cleanId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Error deleting from MediaStore:', e);
    }
  }
};
