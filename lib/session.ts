import { v4 as uuidv4 } from "uuid";

const SESSION_ID_KEY = "fastmeet_session_id";

export function getSessionId(): string {
  // Check if we're in browser environment
  if (typeof window === "undefined") {
    // Server-side: generate a temporary ID (shouldn't be used on server)
    return uuidv4();
  }

  // Check localStorage for existing sessionId
  const existingSessionId = localStorage.getItem(SESSION_ID_KEY);

  if (existingSessionId) {
    return existingSessionId;
  }

  // Generate new UUIDv4 sessionId
  const newSessionId = uuidv4();
  localStorage.setItem(SESSION_ID_KEY, newSessionId);
  return newSessionId;
}

