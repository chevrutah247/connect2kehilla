// In-memory session state for multi-step SMS conversations (e.g., specials store selection)

export interface Session {
  intent: string;
  data: Record<string, any>;
  expiresAt: number;
}

const SESSION_TTL = 10 * 60 * 1000; // 10 minutes
const sessions = new Map<string, Session>();

function cleanup() {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (session.expiresAt < now) {
      sessions.delete(key);
    }
  }
}

export function getSession(phoneHash: string): Session | null {
  cleanup();
  const session = sessions.get(phoneHash);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(phoneHash);
    return null;
  }
  return session;
}

export function setSession(phoneHash: string, intent: string, data: Record<string, any> = {}): void {
  cleanup();
  sessions.set(phoneHash, {
    intent,
    data,
    expiresAt: Date.now() + SESSION_TTL,
  });
}

export function clearSession(phoneHash: string): void {
  sessions.delete(phoneHash);
}
