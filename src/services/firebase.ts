// Supabase data adapter kept under the legacy filename so the rest of the app remains unchanged.
// Firebase is no longer used by this file.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dvpylfutvykzanxxabko.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_KtItaIZhKU149HjbPkWd2g_ni_cjrHr';
const REST_URL = `${SUPABASE_URL}/rest/v1/app_data`;

export const db = { provider: 'supabase' as const };

type DocRef = { collection: string; id: string };
type Snapshot = { exists: () => boolean; data: () => any; metadata: { hasPendingWrites: boolean } };

const getHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
});

// Resilient fetch wrapper with timeout
const safeFetch = async (url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response | null> => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller?.signal
    });
    if (timeoutId) clearTimeout(timeoutId);
    return res;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    // Return null on network error / abort / offline instead of throwing
    return null;
  }
};

export const doc = (_db: typeof db, collection: string, id: string): DocRef => ({ collection, id });

export const getDoc = async (ref: DocRef): Promise<Snapshot> => {
  // 1. Prefer fast, reliable backend server endpoint
  try {
    const serverRes = await safeFetch(`/api/app-data/${encodeURIComponent(ref.id)}`, {
      headers: { 'Accept': 'application/json' }
    }, 5000);

    if (serverRes && serverRes.ok) {
      const json = await serverRes.json().catch(() => null);
      if (json && json.success && json.data !== undefined) {
        return {
          exists: () => true,
          data: () => ({ data: json.data, updatedAt: json.updatedAt }),
          metadata: { hasPendingWrites: false }
        };
      }
    }
  } catch {
    // Continue to Supabase fallback
  }

  // 2. Fallback to Supabase direct REST if server proxy is unavailable
  try {
    const response = await safeFetch(`${REST_URL}?key=eq.${encodeURIComponent(ref.id)}&select=key,data,updated_at`, {
      headers: getHeaders()
    });

    if (!response || !response.ok) {
      return {
        exists: () => false,
        data: () => undefined,
        metadata: { hasPendingWrites: false }
      };
    }

    const rows = await response.json().catch(() => []);
    const row = rows?.[0];
    return {
      exists: () => !!row,
      data: () => row ? { data: row.data, updatedAt: row.updated_at } : undefined,
      metadata: { hasPendingWrites: false }
    };
  } catch {
    return {
      exists: () => false,
      data: () => undefined,
      metadata: { hasPendingWrites: false }
    };
  }
};

export const setDoc = async (ref: DocRef, value: { data: any; updatedAt?: string }): Promise<void> => {
  const adminToken = typeof sessionStorage !== 'undefined'
    ? (sessionStorage.getItem('wikifizya_admin_jwt_token_v4') || localStorage.getItem('wikifizya_admin_jwt_token_v4') || sessionStorage.getItem('wikifizya_admin_token'))
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
    headers['x-admin-token'] = adminToken;
  }

  let serverErrorDetail = '';
  try {
    const serverSyncRes = await safeFetch('/api/admin/sync-data', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        key: ref.id,
        data: value.data,
        updatedAt: value.updatedAt || new Date().toISOString()
      })
    });

    if (serverSyncRes && serverSyncRes.ok) {
      return;
    }
    if (serverSyncRes) {
      const errJson = await serverSyncRes.json().catch(() => null);
      serverErrorDetail = errJson?.error || `رمز الحالة: ${serverSyncRes.status}`;
    }
  } catch (err: any) {
    serverErrorDetail = err?.message || 'تعذر الوصول إلى الخادم';
  }

  // Fallback to direct REST attempt if server proxy is unavailable
  try {
    const response = await safeFetch(REST_URL, {
      method: 'POST',
      headers: { ...getHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        key: ref.id,
        data: value.data,
        updated_at: value.updatedAt || new Date().toISOString()
      })
    });

    if (response && response.ok) {
      return;
    }
  } catch {
    // Ignore direct REST error
  }

  // Throw error so caller knows sync failed and marks sync status correctly
  throw new Error(`فشل حفظ البيانات على الخادم والسحابة (${serverErrorDetail || 'غير مصرح أو الخادم غير متاح'})`);
};

// Supabase polling synchronization with staggered intervals & visibility awareness
export const onSnapshot = (
  ref: DocRef,
  next: (snapshot: Snapshot) => void,
  error?: (err: unknown) => void
): (() => void) => {
  let stopped = false;
  let previous = '';

  const check = async () => {
    if (stopped) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    try {
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const serialized = JSON.stringify(snapshot.data?.() ?? null);
        if (serialized !== previous) {
          previous = serialized;
          next(snapshot);
        }
      }
    } catch (err) {
      error?.(err);
    }
  };

  // Stagger the initial check by random 100ms - 1000ms to load rapidly on mount
  const initialDelay = Math.floor(Math.random() * 900) + 100;
  const initialTimer = setTimeout(() => {
    void check();
  }, initialDelay);

  // Poll every 6 seconds to keep data fresh across all devices without overloading
  const timer = window.setInterval(check, 6000);

  // When user switches back to this tab or when local write forces a refresh, immediately check
  const onVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible' && !stopped) {
      void check();
    }
  };

  const onForceCheck = () => {
    if (!stopped) {
      void check();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('storage_sync_force', onForceCheck);
  }

  return () => {
    stopped = true;
    clearTimeout(initialTimer);
    window.clearInterval(timer);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage_sync_force', onForceCheck);
    }
  };
};

