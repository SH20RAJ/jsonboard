/**
 * JsonBoard Auto-Generated Schema File
 * Generated on: 2025-07-11T09:12:35.427Z
 * 
 * This file contains Zod schemas for all JSON files in your project.
 * You can import and use these schemas for validation:
 * 
 * import { usersSchema, productsSchema } from './jsonboard.schema';
 * 
 * // Validate data
 * const result = usersSchema.safeParse(userData);
 * if (!result.success) {
 *   console.error('Validation errors:', result.error.errors);
 * }
 */

import { z } from 'zod';

// Type definitions for better TypeScript support
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: Array<{
    path: (string | number)[];
    message: string;
  }>;
};


// Schema for: config.json
export const configSchema = z.object({
  app: z.object({
  name: z.string(),
  version: z.string(),
  description: z.string()
}),
  test: z.string()
});

// Schema for: posts.json
export const postsSchema = z.array(z.object({
  id: z.number().int(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  author: z.string(),
  published: z.boolean(),
  created_at: z.string(),
  tags: z.array(z.string()),
  metadata: z.object({
  views: z.number().int(),
  likes: z.number().int(),
  featured: z.boolean()
})
}));

// Schema for: products.json
export const productsSchema = z.array(z.object({
  id: z.number().int(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  brand: z.string(),
  inStock: z.boolean(),
  specs: z.object({
  cpu: z.string(),
  ram: z.string(),
  storage: z.string(),
  graphics: z.string()
})
}));

// Schema for: sample.json
export const sampleSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  contributors: z.array(z.string()),
  license: z.string(),
  dependencies: z.object({
  express: z.string(),
  lodash: z.string()
}),
  scripts: z.object({
  start: z.string(),
  test: z.string()
})
});

// Schema for: users.json
export const usersSchema = z.array(z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  active: z.boolean(),
  created_at: z.string(),
  profile: z.object({
  age: z.number().int(),
  department: z.string()
})
}));

export function validateConfigSchema(data: unknown): ValidationResult<z.infer<typeof configSchema>> {
  const result = configSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      path: err.path,
      message: err.message
    }))
  };
}

export function validatePostsSchema(data: unknown): ValidationResult<z.infer<typeof postsSchema>> {
  const result = postsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      path: err.path,
      message: err.message
    }))
  };
}

export function validateProductsSchema(data: unknown): ValidationResult<z.infer<typeof productsSchema>> {
  const result = productsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      path: err.path,
      message: err.message
    }))
  };
}

export function validateSampleSchema(data: unknown): ValidationResult<z.infer<typeof sampleSchema>> {
  const result = sampleSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      path: err.path,
      message: err.message
    }))
  };
}

export function validateUsersSchema(data: unknown): ValidationResult<z.infer<typeof usersSchema>> {
  const result = usersSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      path: err.path,
      message: err.message
    }))
  };
}

// File Index - for easy reference
export const JsonBoardFiles = {
  'config.json': configSchema,
  'posts.json': postsSchema,
  'products.json': productsSchema,
  'sample.json': sampleSchema,
  'users.json': usersSchema
} as const;

// Utility function to validate any file by path
export function validateFile(filePath: string, data: unknown): ValidationResult<any> {
  const schema = JsonBoardFiles[filePath as keyof typeof JsonBoardFiles];
  if (!schema) {
    return { success: false, errors: [{ path: [], message: `No schema found for file: ${filePath}` }] };
  }
  return (schema as z.ZodType).safeParse(data) as any;
}


// Export all schemas for convenient importing
export {
  configSchema,
  postsSchema,
  productsSchema,
  sampleSchema,
  usersSchema
};

// Type exports for TypeScript users
export type ConfigSchemaType = z.infer<typeof configSchema>;
export type PostsSchemaType = z.infer<typeof postsSchema>;
export type ProductsSchemaType = z.infer<typeof productsSchema>;
export type SampleSchemaType = z.infer<typeof sampleSchema>;
export type UsersSchemaType = z.infer<typeof usersSchema>;
