import { db, doc, getDoc, setDoc, onSnapshot } from './firebase';
import { StorageService } from './storage';

const PRESENCE_STORAGE_KEY = 'wikifizya_db_presence_v4';
const HEARTBEAT_INTERVAL_MS = 30000; // Send heartbeat every 30 seconds
const ACTIVE_THRESHOLD_MS = 120000;  // Considered active if seen within 2 minutes (120s)
const CLEANUP_THRESHOLD_MS = 300000; // Drop entries older than 5 minutes

interface SessionEntry {
  lastSeen: number;
  studentId?: string;
  studentName?: string;
}

interface PresenceData {
  sessions: Record<string, SessionEntry>;
}

// Generate a unique session ID for this browser tab session
const getSessionId = (): string => {
  let id = sessionStorage.getItem('wikifizya_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    sessionStorage.setItem('wikifizya_session_id', id);
  }
  return id;
};

// Helper to get local presence state
const getLocalPresence = (): PresenceData => {
  try {
    const raw = localStorage.getItem(PRESENCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.sessions === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse presence from localStorage', e);
  }
  return { sessions: {} };
};

// Helper to save local presence state
const saveLocalPresence = (data: PresenceData) => {
  try {
    localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save presence to localStorage', e);
  }
};

let activeCountListeners: ((count: number) => void)[] = [];
let currentActiveCount = 0;
let heartbeatTimer: any = null;
let syncCheckTimer: any = null;

// Clean stale sessions & calculate count
const calculateActiveCount = (data: PresenceData): number => {
  const now = Date.now();
  let count = 0;
  if (!data.sessions) return 0;

  Object.values(data.sessions).forEach((sess) => {
    if (sess && typeof sess.lastSeen === 'number') {
      if (now - sess.lastSeen <= ACTIVE_THRESHOLD_MS) {
        count++;
      }
    }
  });
  return count;
};

const notifyCountListeners = (count: number) => {
  currentActiveCount = count;
  activeCountListeners.forEach((cb) => {
    try {
      cb(count);
    } catch (e) {
      console.error('Presence count listener error:', e);
    }
  });
};

export const PresenceService = {
  // Send active heartbeat to storage & Firestore
  async sendHeartbeat(): Promise<void> {
    const sessionId = getSessionId();
    const currentStudent = StorageService.getCurrentStudent();
    const now = Date.now();

    const data = getLocalPresence();
    const updatedSessions: Record<string, SessionEntry> = {};

    // Filter out very old entries (>5 mins) to prevent bloat
    Object.entries(data.sessions || {}).forEach(([id, sess]) => {
      if (sess && typeof sess.lastSeen === 'number' && now - sess.lastSeen < CLEANUP_THRESHOLD_MS) {
        updatedSessions[id] = sess;
      }
    });

    // Update current session
    updatedSessions[sessionId] = {
      lastSeen: now,
      studentId: currentStudent?.id,
      studentName: currentStudent?.name
    };

    const newData: PresenceData = { sessions: updatedSessions };
    saveLocalPresence(newData);

    // Sync to Firestore app_data
    try {
      const docRef = doc(db, 'app_data', PRESENCE_STORAGE_KEY);
      await setDoc(docRef, { data: newData, updatedAt: new Date().toISOString() });
    } catch (e) {
      // Offline or network error - gracefully fall back to local state
    }

    const count = calculateActiveCount(newData);
    notifyCountListeners(count);
  },

  // Get current calculated active count
  getActiveCount(): number {
    const data = getLocalPresence();
    return calculateActiveCount(data);
  },

  // Subscribe to real-time changes in active students count
  subscribeActiveCount(callback: (count: number) => void): () => void {
    activeCountListeners.push(callback);
    callback(this.getActiveCount());

    return () => {
      const idx = activeCountListeners.indexOf(callback);
      if (idx !== -1) {
        activeCountListeners.splice(idx, 1);
      }
    };
  },

  // Initialize presence system (starts heartbeat interval & Firestore listener)
  initPresence(): void {
    if (heartbeatTimer) return; // Already initialized

    // 1. Defer initial Heartbeat by 2.5s so initial render and paint happen without Firestore network competition
    setTimeout(() => {
      this.sendHeartbeat();
    }, 2500);

    // 2. Periodic Heartbeat every 30s only when document is visible
    heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL_MS);

    // 3. Periodic recalculation every 20s to drop inactive users after 120s
    syncCheckTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const data = getLocalPresence();
        const count = calculateActiveCount(data);
        if (count !== currentActiveCount) {
          notifyCountListeners(count);
        }
      }
    }, 20000);

    // 4. Listen to Firestore presence updates in real time
    try {
      const docRef = doc(db, 'app_data', PRESENCE_STORAGE_KEY);
      onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const remoteData = snap.data()?.data as PresenceData;
            if (remoteData && remoteData.sessions) {
              const localData = getLocalPresence();
              // Merge local & remote sessions
              const merged: Record<string, SessionEntry> = { ...remoteData.sessions, ...localData.sessions };
              const updated: PresenceData = { sessions: merged };
              saveLocalPresence(updated);
              const count = calculateActiveCount(updated);
              notifyCountListeners(count);
            }
          }
        },
        (err) => {
          console.warn('Firestore presence onSnapshot warning:', err);
        }
      );
    } catch (e) {
      console.warn('Could not initialize Firestore presence snapshot:', e);
    }

    // 5. Heartbeat on user activity or tab visibility restore
    window.addEventListener('focus', () => {
      this.sendHeartbeat();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.sendHeartbeat();
      }
    });
  }
};
