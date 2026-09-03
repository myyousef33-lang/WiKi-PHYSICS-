// Supabase data adapter kept under the legacy filename so the rest of the app remains unchanged.
// Firebase is no longer used by this file.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dvpylfutvykzanxxabko.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_KtItaIZhKU149HjbPkWd2g_ni_cjrHr';
const REST_URL = `${SUPABASE_URL}/rest/v1/app_data`;

export const db = { provider: 'supabase' as const };

type DocRef = { collection: string; id: string };
type Snapshot = { exists: () => boolean; data: () => any; metadata: { hasPendingWrites: boolean } };

const headers = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
});

export const doc = (_db: typeof db, collection: string, id: string): DocRef => ({ collection, id });

export const getDoc = async (ref: DocRef): Promise<Snapshot> => {
  const response = await fetch(`${REST_URL}?key=eq.${encodeURIComponent(ref.id)}&select=key,data,updated_at`, {
    headers: headers()
  });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  const rows = await response.json();
  const row = rows?.[0];
  return {
    exists: () => !!row,
    data: () => row ? { data: row.data, updatedAt: row.updated_at } : undefined,
    metadata: { hasPendingWrites: false }
  };
};

export const setDoc = async (ref: DocRef, value: { data: any; updatedAt?: string }): Promise<void> => {
  const response = await fetch(REST_URL, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      key: ref.id,
      data: value.data,
      updated_at: value.updatedAt || new Date().toISOString()
    })
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Supabase write failed: ${response.status} ${message}`);
  }
};

// Firebase onSnapshot compatibility: Supabase Realtime can be added later; polling keeps the
// existing storage service API intact without requiring a rewrite of the application state layer.
export const onSnapshot = (
  ref: DocRef,
  next: (snapshot: Snapshot) => void,
  error?: (err: unknown) => void
): (() => void) => {
  let stopped = false;
  let previous = '';

  const check = async () => {
    if (stopped) return;
    try {
      const snapshot = await getDoc(ref);
      const serialized = JSON.stringify(snapshot.data?.() ?? null);
      if (serialized !== previous) {
        previous = serialized;
        next(snapshot);
      }
    } catch (err) {
      error?.(err);
    }
  };

  void check();
  const timer = window.setInterval(check, 5000);
  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
};
