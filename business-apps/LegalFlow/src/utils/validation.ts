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

// User profile schemas
export const createUserProfileSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: dateSchema.optional(),
  address: addressSchema.optional(),
});

export const updateUserProfileSchema = createUserProfileSchema.partial();

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

// Legal document schemas
export const documentCategorySchema = z.enum([
  'business',
  'estate',
  'trademark',
  'contract',
]);

export const createLegalDocumentSchema = z.object({
  documentType: z.string().min(1),
  documentCategory: documentCategorySchema,
  title: z.string().min(1).max(255),
  templateId: uuidSchema.optional(),
});

// Legal filing schemas
export const filingTypeSchema = z.enum([
  'divorce',
  'child_support_mod',
  'child_support_initial',
  'parenting_time',
  'custody',
  'name_change',
  'bankruptcy_prep',
  'parenting_plan',
  'enforcement',
  'fee_waiver',
]);

export const createLegalFilingSchema = z.object({
  filingType: filingTypeSchema,
  jurisdictionState: stateCodeSchema,
  jurisdictionCounty: z.string().min(1).max(100).optional(),
});

// Child support calculator schemas
export const parentDataSchema = z.object({
  grossMonthlyIncome: moneySchema,
  otherIncome: moneySchema.optional(),
  healthInsuranceCost: moneySchema.optional(),
  childCareCost: moneySchema.optional(),
  otherChildSupport: moneySchema.optional(),
  overnightsPerYear: z.number().int().min(0).max(365),
  deductions: z.array(z.object({
    type: z.string(),
    amount: moneySchema,
  })).optional(),
});

export const childDataSchema = z.object({
  dateOfBirth: dateSchema,
  specialNeeds: z.boolean().optional(),
  healthInsuranceCoveredBy: z.enum(['parent1', 'parent2', 'both', 'none']).optional(),
});

export const childSupportCalculationSchema = z.object({
  stateCode: stateCodeSchema,
  calculationType: z.enum(['initial', 'modification', 'enforcement']),
  parent1Data: parentDataSchema,
  parent2Data: parentDataSchema,
  childrenData: z.array(childDataSchema).min(1),
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

