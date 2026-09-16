/**
 * Safe initials extractor for avatars
 */
export function getInitials(name) {
  if (!name) return '?';
  const clean = name.trim();
  if (clean.length === 1) return clean.toUpperCase();
  const parts = clean.split(/[\s_-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Deterministic color picker for avatar backgrounds
 */
const AVATAR_COLORS = [
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-purple-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
  'bg-cyan-500 text-white',
  'bg-violet-500 text-white',
];

export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Message validation: Trim whitespace, enforce max 1000 characters, non-empty
 */
export function validateMessage(text) {
  if (!text) {
    return { isValid: false, error: 'Message cannot be empty.' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Message cannot be empty.' };
  }
  if (trimmed.length > 1000) {
    return { isValid: false, error: 'Message exceeds maximum length of 1,000 characters.' };
  }
  return { isValid: true, sanitized: trimmed };
}

/**
 * Username validation: 3-30 chars, alphanumeric + underscores/hyphens
 */
export function validateUsername(username) {
  if (!username) {
    return { isValid: false, error: 'Username is required.' };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters.' };
  }
  if (trimmed.length > 30) {
    return { isValid: false, error: 'Username cannot exceed 30 characters.' };
  }
  const regex = /^[a-zA-Z0-9_.-]+$/;
  if (!regex.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens.' };
  }
  return { isValid: true, username: trimmed };
}
