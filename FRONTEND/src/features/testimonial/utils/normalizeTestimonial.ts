import type { Testimonial } from '../../../types/Testimonial';

export function normalizeTestimonial(raw: any): Testimonial | null {
  if (!raw) return null;

  const id = raw.id?.toString?.() ?? raw._id?.toString?.() ?? '';
  if (!id) return null;

  return {
    id,
    name: raw.name ?? '',
    designation: raw.designation ?? '',
    message: raw.message ?? '',
    avatarUrl: raw.avatarUrl ?? '',
    rating: Number(raw.rating) || 0,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
