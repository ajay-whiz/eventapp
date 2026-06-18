import type { ContentPolicy } from '../../../types/ContentPolicy';

export function normalizeContentPolicy(raw: any): ContentPolicy | null {
  if (!raw) return null;

  const id = raw.id?.toString?.() ?? raw._id?.toString?.() ?? '';
  if (!id) return null;

  return {
    id,
    title: raw.title ?? '',
    content: raw.content ?? '',
    version: raw.version ?? '',
    isActive: raw.isActive ?? true,
    effectiveDate: raw.effectiveDate ?? '',
    category: raw.category ?? '',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
