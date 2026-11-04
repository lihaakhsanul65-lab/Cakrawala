/**
 * Safe localStorage wrapper that handles QuotaExceededError and private browsing restrictions.
 * Automatically catches and recovers from quota issues without crashing React.
 */

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Failed to read ${key}:`, err);
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.warn(`[SafeStorage] Quota exceeded or error saving ${key}:`, error?.message || error);

    // If quota exceeded or general DOMException, attempt intelligent mitigation
    try {
      // 1. If it's a JSON string, prune base64 data URLs from attachments
      let pruned = value;
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((item: any) => {
            if (item && typeof item === 'object') {
              const copy = { ...item };
              // Prune large answers / attachments
              if (Array.isArray(copy.answers)) {
                copy.answers = copy.answers.map((ans: any) => {
                  const ansCopy = { ...ans };
                  if (typeof ansCopy.attachmentUrl === 'string' && ansCopy.attachmentUrl.length > 500) {
                    ansCopy.attachmentUrl = '[Lampiran Tersimpan di Server / Cloud]';
                  }
                  if (typeof ansCopy.studentAnswer === 'string' && ansCopy.studentAnswer.length > 10000) {
                    ansCopy.studentAnswer = ansCopy.studentAnswer.slice(0, 10000) + '... [jawaban panjang]';
                  }
                  return ansCopy;
                });
              }
              // Prune large materials / files
              if (Array.isArray(copy.materials)) {
                copy.materials = copy.materials.map((m: any) => {
                  const mCopy = { ...m };
                  if (typeof mCopy.fileUrl === 'string' && mCopy.fileUrl.startsWith('data:')) {
                    mCopy.fileUrl = '[Data File]';
                  }
                  return mCopy;
                });
              }
              return copy;
            }
            return item;
          });
          pruned = JSON.stringify(sanitized);
        }
      } catch {
        // Not JSON
      }

      // Try saving the pruned version
      localStorage.setItem(key, pruned);
      return true;
    } catch (pruneErr) {
      // 2. Free up non-critical cache keys to make room for current key
      try {
        const nonEssentialKeys = [
          'cakrawala_calendar_events',
          'cakrawala_ai_position',
          'cakrawala_audit_logs',
          'cakrawala_media_ajar',
          'cakrawala_forums'
        ];
        for (const k of nonEssentialKeys) {
          if (k !== key) {
            localStorage.removeItem(k);
          }
        }
        localStorage.setItem(key, value);
        return true;
      } catch (freeErr) {
        // 3. Fallback: Gracefully do not crash; state stays in React memory and server API
        console.warn(`[SafeStorage] Persisting ${key} to localStorage skipped (memory-only fallback active)`);
        return false;
      }
    }
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Failed to remove ${key}:`, err);
  }
}
