import { IMAGE_BASE_URL } from '../../../config/api';

export function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;

  const trimmed = avatarUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const path = trimmed.replace(/\\/g, '/');
  return `${IMAGE_BASE_URL}/${path}`;
}

export function truncateText(text: string, maxLength = 80): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function formatTestimonialDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
