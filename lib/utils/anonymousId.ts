/**
 * Anonymous ID Generation Utility
 * 
 * Generates and manages a unique browser fingerprint for anonymous users.
 * Uses localStorage for persistence with fallback to session-based storage.
 * GDPR-friendly: No cookies, no personal data collection.
 */

const STORAGE_KEY = 'teacher_rating_anonymous_id';
const SESSION_KEY = 'teacher_rating_session_id';

/**
 * Generates a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a simple browser fingerprint based on available browser properties
 * This is NOT used for tracking, only for duplicate rating prevention
 */
function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') {
    return generateUUID();
  }

  const navigator = window.navigator;
  const screen = window.screen;

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    navigator.hardwareConcurrency || 'unknown',
  ];

  // Create a simple hash from components
  const fingerprint = components
    .join('###')
    .split('')
    .reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0)
    .toString(16);

  return fingerprint;
}

/**
 * Gets or creates an anonymous ID for the current browser/session
 * Uses localStorage with sessionStorage fallback
 */
export function getAnonymousId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a temporary ID (will be regenerated client-side)
    return 'server-side-' + generateUUID();
  }

  // Try localStorage first
  try {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) {
      return storedId;
    }
  } catch (e) {
    // localStorage might be disabled
    console.warn('localStorage not available, using sessionStorage');
  }

  // Fallback to sessionStorage
  try {
    const sessionId = sessionStorage.getItem(SESSION_KEY);
    if (sessionId) {
      return sessionId;
    }
  } catch (e) {
    console.warn('sessionStorage not available');
  }

  // Generate new ID
  const newId = generateUUID();

  // Store in localStorage if available
  try {
    localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch (e) {
    // localStorage disabled, try sessionStorage
    try {
      sessionStorage.setItem(SESSION_KEY, newId);
    } catch (e) {
      // Both storages unavailable - return ID without persisting
      // User won't be able to rate multiple teachers in the same session
    }
    return newId;
  }
}

/**
 * Clears the anonymous ID from storage
 * Useful for testing or when user wants to reset
 */
export function clearAnonymousId(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Ignore
  }

  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // Ignore
  }
}

/**
 * Checks if an anonymous ID exists in storage
 */
export function hasAnonymousId(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (localStorage.getItem(STORAGE_KEY)) return true;
  } catch (e) {
    // Ignore
  }

  try {
    if (sessionStorage.getItem(SESSION_KEY)) return true;
  } catch (e) {
    // Ignore
  }

  return false;
}

/**
 * Generates a new anonymous ID, replacing any existing one
 */
export function regenerateAnonymousId(): string {
  clearAnonymousId();
  return getAnonymousId();
}
