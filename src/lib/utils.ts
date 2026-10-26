import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount?: number | null, compact = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString?: string | null, pattern = 'MMM d, yyyy'): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return format(date, pattern);
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString?: string | null): string {
  return formatDate(dateString, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return String(dateString);
  }
}

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U';
}

const AVATAR_COLORS = [
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-violet-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
  'bg-cyan-500 text-white',
];

export function getAvatarColor(identifier?: string | null): string {
  if (!identifier) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
