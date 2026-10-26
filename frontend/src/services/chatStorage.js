/**
 * PropGPT Chat Storage Service
 * Manages conversation sessions, history persistence, search, and user preferences
 */

const SESSIONS_KEY = 'propgpt_sessions_v1';
const CURRENT_SESSION_KEY = 'propgpt_current_session_id';
const PREFERENCES_KEY = 'propgpt_user_preferences';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I am PropGPT, your intelligent real estate pricing copilot for Hyderabad. Tell me what property you are looking to buy or rent (e.g. 'I want to buy a 3 BHK flat in Kokapet around 1800 sq ft'), and I'll extract the details, cross-examine micro-market datasets, and calculate an accurate ML valuation without hallucinations.",
  suggestions: [
    "3 BHK Flat in Kokapet 1800 sqft",
    "2 BHK Flat in Kukatpally Resale 1200 sqft",
    "4 BHK Independent Villa in Jubilee Hills 3200 sqft",
    "2 BHK Rental in Gachibowli Furnished 1350 sqft"
  ],
  timestamp: 'Just now'
};

export const DEFAULT_PREFERENCES = {
  backendUrl: 'http://127.0.0.1:8000',
  currencyDisplay: 'inr_crores_lakhs', // 'inr_crores_lakhs' | 'standard'
  measurementUnit: 'sqft', // 'sqft' | 'sqyard'
  speechLang: 'en-IN',
  enableInterimSpeech: true,
  modelTemperature: 0.2
};

export function getPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('propgpt-preferences-changed'));
  } catch (e) {
    console.warn("Could not save preferences to localStorage", e);
  }
}

// Read persisted history without creating sessions. Creation must not call
// getSessions(), which seeds a session when history is empty.
function readSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw);
    return Array.isArray(sessions) ? sessions.filter(session =>
      session && typeof session.id === 'string' && Array.isArray(session.messages)
    ) : [];
  } catch (e) {
    console.warn("Failed to load sessions from localStorage:", e);
    return [];
  }
}

export function getSessions() {
  const sessions = readSessions();
  return sessions.length > 0 ? sessions : [createNewSession("Hyderabad Property Valuation")];
}

export function saveSessions(sessions) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn("Failed to save sessions to localStorage:", e);
  }
}

export function getCurrentSessionId() {
  try {
    const id = localStorage.getItem(CURRENT_SESSION_KEY);
    if (id) return id;
    const sessions = getSessions();
    if (sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
      return sessions[0].id;
    }
  } catch (e) {}
  return 'session_' + Math.random().toString(36).substring(2, 9);
}

export function setCurrentSessionId(id) {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, id);
  } catch (e) {}
}

export function createNewSession(customTitle = "New Property Valuation") {
  const newId = 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  const newSession = {
    id: newId,
    title: customTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    propertyType: 'Flat / Purchase',
    messages: [
      {
        ...DEFAULT_WELCOME_MESSAGE,
        id: 'welcome_' + Date.now()
      }
    ]
  };

  const sessions = readSessions();
  const updated = [newSession, ...sessions.filter(s => s.id !== newId)];
  saveSessions(updated);
  setCurrentSessionId(newId);
  return newSession;
}

export function updateSessionMessages(sessionId, messages, backendSessionId) {
  const sessions = getSessions();
  let found = false;

  const updated = sessions.map(session => {
    if (session.id === sessionId) {
      found = true;
      let title = session.title;
      // Derive a meaningful title from first user message if still default
      if (title === "New Property Valuation" || title === "Hyderabad Property Valuation") {
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg && firstUserMsg.content) {
          title = firstUserMsg.content.slice(0, 32).trim() + (firstUserMsg.content.length > 32 ? '...' : '');
        }
      }

      // Check if any message contains property details for tags
      let propertyType = session.propertyType;
      const latestPrediction = [...messages].reverse().find(m => m.prediction);
      if (latestPrediction) {
        const type = latestPrediction.prediction?.prediction_type;
        if (type?.includes('rent')) propertyType = 'Rental Valuation';
        else if (type?.includes('house')) propertyType = 'Villa Valuation';
        else propertyType = 'Flat Purchase';
      }

      return {
        ...session,
        ...(backendSessionId ? { backendSessionId } : {}),
        title,
        propertyType,
        updatedAt: Date.now(),
        messages
      };
    }
    return session;
  });

  // A request completing after its chat was deleted must not resurrect it.
  if (!found) return;

  saveSessions(updated);
}

export function renameSession(sessionId, newTitle) {
  if (!newTitle || !newTitle.trim()) return;
  const sessions = getSessions().map(s => {
    if (s.id === sessionId) {
      return { ...s, title: newTitle.trim(), updatedAt: Date.now() };
    }
    return s;
  });
  saveSessions(sessions);
}

export function deleteSession(sessionId) {
  const sessions = getSessions().filter(s => s.id !== sessionId);
  saveSessions(sessions);
  if (sessions.length === 0) {
    const fresh = createNewSession();
    return [fresh];
  }
  const currentId = getCurrentSessionId();
  if (currentId === sessionId) {
    setCurrentSessionId(sessions[0].id);
  }
  return sessions;
}

export function clearAllSessions() {
  try {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(CURRENT_SESSION_KEY);
  } catch (e) {}
  return createNewSession();
}
