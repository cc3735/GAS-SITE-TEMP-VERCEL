import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email();

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

export const ssnSchema = z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Invalid SSN format');

export const stateCodeSchema = z.string().length(2).toUpperCase();

export const moneySchema = z.number().min(0).multipleOf(0.01);

export const dateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
});

// Address schema
export const addressSchema = z.object({
  street1: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: stateCodeSchema,
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  country: z.string().default('US'),
});

// Tax-related schemas
export const filingStatusSchema = z.enum([
  'single',
  'married_joint',
  'married_separate',
  'head_of_household',
  'qualifying_widow',
]);

export const taxYearSchema = z.number().int().min(2020).max(new Date().getFullYear());

export const createTaxReturnSchema = z.object({
  taxYear: taxYearSchema,
  filingStatus: filingStatusSchema.optional(),
});

// Subscription schemas
export const subscriptionTierSchema = z.enum(['free', 'basic', 'premium', 'pro']);

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Helper function to validate and parse
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Helper to create validation middleware
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
  };
}
