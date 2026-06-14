// ──────────────────────────────────────────────
//  TicketMandu Format Utilities
// ──────────────────────────────────────────────

/**
 * Format a numeric price as a currency string.
 * formatPrice(250) → '$250.00'
 * formatPrice('99.9') → '$99.90'
 */
export function formatPrice(price) {
  const num = parseFloat(price);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Format an ISO date string or Date object to a readable date.
 * formatDate('2026-12-15') → 'Dec 15, 2026'
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return String(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date + optional time string into a combined readable string.
 * formatDateTime('2026-12-15', '19:00') → 'Dec 15, 2026 at 7:00 PM'
 */
export function formatDateTime(dateString, timeString) {
  if (!dateString) return '';
  const formattedDate = formatDate(dateString);
  if (!timeString) return formattedDate;

  // Parse HH:MM or HH:MM:SS
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const mm = String(minutes).padStart(2, '0');
  return `${formattedDate} at ${h12}:${mm} ${period}`;
}

/**
 * Truncate a string to a maximum length, appending '...' if cut.
 * truncate('Some very long text', 10) → 'Some very...'
 */
export function truncate(str, length = 80) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '...';
}

/**
 * Extract initials from a full name (up to 2 characters).
 * getInitials('Alice Johnson') → 'AJ'
 * getInitials('Bob') → 'B'
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Return a time-of-day greeting with an emoji.
 * 5–11  → 'Good Morning ☀️'
 * 12–17 → 'Good Afternoon 🌤️'
 * 18+   → 'Good Evening 🔥'
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning ☀️';
  if (hour >= 12 && hour < 18) return 'Good Afternoon 🌤️';
  return 'Good Evening 🔥';
}

/**
 * Returns a relative time string, e.g. '2 days ago', 'in 3 hours'.
 */
export function fromNow(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = date - now; // ms
  const abs = Math.abs(diff);
  const isFuture = diff > 0;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;

  let label;
  if (abs < minute) label = 'just now';
  else if (abs < hour) label = `${Math.round(abs / minute)} min`;
  else if (abs < day) label = `${Math.round(abs / hour)}h`;
  else if (abs < week) label = `${Math.round(abs / day)}d`;
  else if (abs < month) label = `${Math.round(abs / week)}w`;
  else label = formatDate(dateString);

  if (label === 'just now') return label;
  return isFuture ? `in ${label}` : `${label} ago`;
}
