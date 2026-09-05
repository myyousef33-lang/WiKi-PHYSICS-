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

    if (!response || !response.ok) {
      // Offline or transient network issue - local storage is the source of truth
      return;
    }
  } catch {
    // Graceful offline fallback
  }
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

  // Stagger the initial check by random 200ms - 2000ms to avoid hammering network simultaneously
  const initialDelay = Math.floor(Math.random() * 1800) + 200;
  const initialTimer = setTimeout(() => {
    void check();
  }, initialDelay);

  // Poll every 25 seconds instead of 5 seconds to reduce background load
  const timer = window.setInterval(check, 25000);

  return () => {
    stopped = true;
    clearTimeout(initialTimer);
    window.clearInterval(timer);
  };
};

