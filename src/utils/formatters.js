/**
 * Format ISO timestamp to local 12-hour or 24-hour time (e.g. "12:35 PM")
 */
export function formatMessageTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format message date for day dividers (e.g., "Today", "Yesterday", "Sep 14, 2026")
 */
export function formatDayDivider(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculates remaining time until message expiration (1-hour lifespan)
 * Returns formatted string like "Expires in 42m" or "Expiring soon"
 */
export function formatTimeRemaining(expiresAt, currentNow = Date.now()) {
  if (!expiresAt) return '';
  const expiry = new Date(expiresAt).getTime();
  const diffMs = expiry - currentNow;

  if (diffMs <= 0) return 'Expired';

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes >= 1) {
    const displayMinutes = Math.ceil(diffMs / 60000);
    return `Expires in ${displayMinutes}m`;
  }
  const diffSeconds = Math.ceil(diffMs / 1000);
  return `Expires in ${Math.max(1, diffSeconds)}s`;
}

/**
 * Relative time for "last seen" status
 */
export function formatLastSeen(lastSeenDate) {
  if (!lastSeenDate) return 'Offline';
  const lastSeen = new Date(lastSeenDate).getTime();
  const now = Date.now();
  const diffSeconds = Math.floor((now - lastSeen) / 1000);

  if (diffSeconds < 60) return 'Active just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Active ${diffDays}d ago`;
}
