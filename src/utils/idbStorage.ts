/**
 * IndexedDB high-capacity client storage helper for Cakrawala LMS.
 * Unlike localStorage (limited to 5MB), IndexedDB can store hundreds of MBs
 * or several GBs (up to available disk quota) of files, photos, and large submissions.
 */

const DB_NAME = 'cakrawala_lms_db';
const DB_VERSION = 1;
const STORE_NAME = 'keyval_store';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save large data (objects, arrays, base64 strings) into IndexedDB without 5MB limits.
 */
export async function idbSet<T = any>(key: string, value: T): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn(`[IndexedDB] Error writing key ${key}:`, req.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Could not open database to save ${key}:`, err);
    return false;
  }
}

/**
 * Retrieve data from IndexedDB.
 */
export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => {
        console.warn(`[IndexedDB] Error reading key ${key}:`, req.error);
        resolve(null);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Could not open database to read ${key}:`, err);
    return null;
  }
}

/**
 * Remove an item from IndexedDB.
 */
export async function idbRemove(key: string): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Query current storage estimate (usage and quota) in MB.
 */
export async function getStorageEstimate(): Promise<{ usedMB: number; quotaMB: number; percent: number }> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedMB = Math.round((estimate.usage || 0) / (1024 * 1024));
      const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
      const percent = quotaMB > 0 ? Math.round((usedMB / quotaMB) * 100) : 0;
      return { usedMB, quotaMB, percent };
    } catch {
      // fallback
    }
  }
  return { usedMB: 0, quotaMB: 1024, percent: 0 };
}
