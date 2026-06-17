import { z } from 'zod';

export const venueCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  formId: z.string().min(1, 'Form is required'),
});

export type VenueCategorySchemaType = z.infer<typeof venueCategorySchema>;
