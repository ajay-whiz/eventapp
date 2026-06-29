import { z } from 'zod';

export const testimonialSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  designation: z.string().trim().min(1, 'Designation is required'),
  message: z.string().trim().min(1, 'Message is required'),
  avatarUrl: z.string().optional(),
  rating: z
    .number({ invalid_type_error: 'Rating is required' })
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
});

export type TestimonialSchemaType = z.infer<typeof testimonialSchema>;
