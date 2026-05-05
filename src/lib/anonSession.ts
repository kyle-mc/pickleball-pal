// Anonymous session ID with expiration & rotation.
// Stored as { id, expires } in localStorage. Auto-rotates after expiration.
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getAnonSessionId(key: string, ttlMs: number = DEFAULT_TTL_MS): string {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; expires?: number };
      if (parsed?.id && typeof parsed.expires === "number" && Date.now() < parsed.expires) {
        return parsed.id;
      }
    }
  } catch {
    // fall through to regenerate
  }
  const id = crypto.randomUUID();
  const expires = Date.now() + ttlMs;
  try {
    localStorage.setItem(key, JSON.stringify({ id, expires }));
  } catch {
    // ignore storage errors
  }
  return id;
}

export function clearAnonSession(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
