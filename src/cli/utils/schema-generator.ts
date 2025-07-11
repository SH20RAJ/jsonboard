import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, relative, extname } from 'path';
import * as z from 'zod';

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  schema?: z.ZodType<any>;
}

export interface CentralizedSchemaConfig {
  workingDirectory: string;
  outputFile: string;
  jsonFiles: Array<{
    path: string;
    relativePath: string;
    schemaName: string;
  }>;
}

export class JsonSchemaGenerator {
  /**
   * Generate a Zod schema from JSON data
   */
  static generateSchema(data: any): z.ZodType<any> {
    if (data === null) return z.null();
    if (data === undefined) return z.undefined();

    switch (typeof data) {
      case 'string': return z.string();
      case 'number': return z.number();
      case 'boolean': return z.boolean();
      case 'object':
        if (Array.isArray(data)) {
          if (data.length === 0) return z.array(z.unknown());
          // Infer schema from first few items
          const itemSchemas = data.slice(0, 3).map(item => this.generateSchema(item));
          const unionSchema = itemSchemas.length === 1 
            ? itemSchemas[0] 
            : z.union(itemSchemas as [z.ZodType<any>, z.ZodType<any>, ...z.ZodType<any>[]]);
          return z.array(unionSchema);
        } else {
          const shape: Record<string, z.ZodType<any>> = {};
          for (const [key, value] of Object.entries(data)) {
            shape[key] = this.generateSchema(value);
          }
          return z.object(shape);
        }
      default:
        return z.unknown();
    }
  }

  /**
   * Generate TypeScript schema definition string from Zod schema
   */
  static generateSchemaString(data: any, schemaName: string): string {
    const generateZodString = (data: any, indent = 0): string => {
      const spaces = '  '.repeat(indent);
      
      if (data === null) return 'z.null()';
      if (data === undefined) return 'z.undefined()';

      switch (typeof data) {
        case 'string': return 'z.string()';
        case 'number': return Number.isInteger(data) ? 'z.number().int()' : 'z.number()';
        case 'boolean': return 'z.boolean()';
        case 'object':
          if (Array.isArray(data)) {
            if (data.length === 0) return 'z.array(z.unknown())';
            const itemSchema = generateZodString(data[0], 0);
            return `z.array(${itemSchema})`;
          } else {
            const entries = Object.entries(data).map(([key, value]) => {
              const valueSchema = generateZodString(value, 0);
              return `${spaces}  ${key}: ${valueSchema}`;
            });
            return `z.object({\n${entries.join(',\n')}\n${spaces}})`;
          }
        default:
          return 'z.unknown()';
      }
    };

    return `export const ${schemaName} = ${generateZodString(data)};`;
  }

  /**
   * Generate centralized schema file for all JSON files in directory
   */
  static generateCentralizedSchema(workingDirectory: string): CentralizedSchemaConfig {
    const jsonFiles = this.findJsonFiles(workingDirectory);
    const outputFile = join(workingDirectory, 'jsonboard.schema.ts');
    
    const schemaConfig: CentralizedSchemaConfig = {
      workingDirectory,
      outputFile,
      jsonFiles: jsonFiles.map(filePath => ({
        path: filePath,
        relativePath: relative(workingDirectory, filePath),
        schemaName: this.generateSchemaName(filePath, jsonFiles)
      }))
    };

    this.writeCentralizedSchemaFile(schemaConfig);
    return schemaConfig;
  }

  /**
   * Write the centralized schema TypeScript file
   */
  static writeCentralizedSchemaFile(config: CentralizedSchemaConfig): void {
    const header = `/**
 * JsonBoard Auto-Generated Schema File
 * Generated on: ${new Date().toISOString()}
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

`;

    const schemas: string[] = [];
    const exports: string[] = [];
    const validationFunctions: string[] = [];

    for (const file of config.jsonFiles) {
      try {
        if (!existsSync(file.path)) continue;
        
        const content = readFileSync(file.path, 'utf-8');
        const data = JSON.parse(content);
        
        // Generate schema
        const schemaString = this.generateSchemaString(data, file.schemaName);
        schemas.push(`// Schema for: ${file.relativePath}`);
        schemas.push(schemaString);
        schemas.push('');

        // Add to exports
        exports.push(file.schemaName);

        // Generate validation function
        const funcName = `validate${file.schemaName.charAt(0).toUpperCase() + file.schemaName.slice(1)}`;
        validationFunctions.push(`export function ${funcName}(data: unknown): ValidationResult<z.infer<typeof ${file.schemaName}>> {
  const result = ${file.schemaName}.safeParse(data);
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
}`);

      } catch (error) {
        schemas.push(`// Error parsing ${file.relativePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        schemas.push(`export const ${file.schemaName} = z.unknown(); // Fallback schema`);
        schemas.push('');
      }
    }

    // Create file index for easy imports
    const fileIndex = `
// File Index - for easy reference
export const JsonBoardFiles = {
${config.jsonFiles.map(file => `  '${file.relativePath}': ${file.schemaName}`).join(',\n')}
} as const;

// Utility function to validate any file by path
export function validateFile(filePath: string, data: unknown): ValidationResult<any> {
  const schema = JsonBoardFiles[filePath as keyof typeof JsonBoardFiles];
  if (!schema) {
    return { success: false, errors: [{ path: [], message: \`No schema found for file: \${filePath}\` }] };
  }
  return (schema as z.ZodType).safeParse(data) as any;
}
`;

    const footer = `
// Export all schemas for convenient importing
export {
  ${exports.join(',\n  ')}
};

// Type exports for TypeScript users
${exports.map(name => `export type ${name.charAt(0).toUpperCase() + name.slice(1)}Type = z.infer<typeof ${name}>;`).join('\n')}
`;

    const fullContent = [
      header,
      schemas.join('\n'),
      validationFunctions.join('\n\n'),
      fileIndex,
      footer
    ].join('\n');

    writeFileSync(config.outputFile, fullContent, 'utf-8');
  }

  /**
   * Find all JSON files in directory (excluding config files)
   */
  static findJsonFiles(directory: string): string[] {
    const files: string[] = [];
    
    const configFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'jsconfig.json',
      'tailwind.config.json',
      'next.config.json',
      'vite.config.json',
      'webpack.config.json',
      'babel.config.json',
      'eslint.config.json',
      '.eslintrc.json',
      'prettier.config.json',
      '.prettierrc.json',
      'jest.config.json',
      'cypress.config.json',
      'vercel.json',
      'netlify.json'
    ];

    const scanDirectory = (dir: string, depth = 0) => {
      if (depth > 3) return; // Limit recursion depth
      
      try {
        const items = readdirSync(dir);
        
        for (const item of items) {
          if (item.startsWith('.') || item === 'node_modules') continue;
          
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);
          
          if (stat.isFile() && extname(item) === '.json') {
            // Skip config files only in root directory
            if (dir === directory && configFiles.includes(item)) continue;
            
            // Skip .schema.json files to avoid duplicates
            if (item.includes('.schema.')) continue;
            
            if (this.validateJsonFile(fullPath)) {
              files.push(fullPath);
            }
          } else if (stat.isDirectory()) {
            scanDirectory(fullPath, depth + 1);
          }
        }
      } catch (error) {
        // Ignore directories we can't read
      }
    };

    scanDirectory(directory);
    return files;
  }

  /**
   * Generate schema name from file path (handles duplicates)
   */
  static generateSchemaName(filePath: string, allFiles: string[]): string {
    const name = basename(filePath, '.json');
    const dir = dirname(filePath);
    
    // Convert to camelCase and make it a valid identifier
    let schemaName = name.replace(/[^a-zA-Z0-9]/g, '_')
                        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                        .replace(/^[0-9]/, '_$&') + 'Schema';
    
    // Check for duplicates and add directory prefix if needed
    const duplicates = allFiles.filter(f => {
      const otherName = basename(f, '.json').replace(/[^a-zA-Z0-9]/g, '_')
                                           .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                                           .replace(/^[0-9]/, '_$&') + 'Schema';
      return otherName === schemaName && f !== filePath;
    });
    
    if (duplicates.length > 0) {
      // Add directory prefix to make unique
      const dirName = basename(dir);
      schemaName = dirName.replace(/[^a-zA-Z0-9]/g, '_')
                         .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                         .replace(/^[0-9]/, '_$&') + 
                   name.replace(/[^a-zA-Z0-9]/g, '_')
                       .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                       .replace(/^[0-9]/, '_$&') + 'Schema';
    }
    
    return schemaName;
  }

  /**
   * Save generated schema to a .schema.json file (legacy support)
   */
  static saveSchemaFile(jsonFilePath: string, schema: z.ZodType<any>): string {
    const dir = dirname(jsonFilePath);
    const name = basename(jsonFilePath, '.json');
    const schemaPath = join(dir, `${name}.schema.json`);

    const schemaDescription = this.generateSchemaDescription(schema);
    
    writeFileSync(schemaPath, JSON.stringify(schemaDescription, null, 2));
    return schemaPath;
  }

  /**
   * Generate a JSON Schema description from a Zod schema
   */
  static generateSchemaDescription(schema: z.ZodType<any>): any {
    return {
      type: "object",
      description: "Auto-generated schema for JSON validation",
      generatedBy: "JsonBoard Schema Generator",
      timestamp: new Date().toISOString(),
      zodSchema: "See companion .zod.ts file for runtime validation"
    };
  }

  /**
   * Validate JSON data against an auto-generated schema
   */
  static validateJson(jsonFilePath: string): SchemaValidationResult {
    try {
      const jsonContent = readFileSync(jsonFilePath, 'utf-8');
      const data = JSON.parse(jsonContent);
      
      // Generate schema from the data itself
      const schema = this.generateSchema(data);
      
      // Validate the data against its own schema
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          isValid: true,
          errors: [],
          schema
        };
      } else {
        return {
          isValid: false,
          errors: result.error.issues.map((err: any) => 
            `${err.path.join('.')}: ${err.message}`
          ),
          schema
        };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Auto-generate and save schema for a JSON file (legacy)
   */
  static generateAndSaveSchema(jsonFilePath: string): { schemaPath: string; validation: SchemaValidationResult } {
    const validation = this.validateJson(jsonFilePath);
    
    if (validation.schema) {
      const schemaPath = this.saveSchemaFile(jsonFilePath, validation.schema);
      return { schemaPath, validation };
    }
    
    throw new Error('Could not generate schema for invalid JSON');
  }

  /**
   * Check if a JSON file has schema validation issues
   */
  static checkJsonHealth(jsonFilePath: string): {
    hasIssues: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const validation = this.validateJson(jsonFilePath);
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!validation.isValid) {
      issues.push(...validation.errors);
      suggestions.push('Run JsonBoard with --generate-schema to create a centralized schema file');
    }

    // Check for common JSON issues
    try {
      const content = readFileSync(jsonFilePath, 'utf-8');
      const data = JSON.parse(content);

      // Check for deeply nested structures
      const maxDepth = this.getMaxDepth(data);
      if (maxDepth > 10) {
        issues.push('JSON structure is very deeply nested (>10 levels)');
        suggestions.push('Consider flattening the structure for better performance');
      }

      // Check for large arrays
      if (Array.isArray(data) && data.length > 1000) {
        issues.push('Large array detected (>1000 items)');
        suggestions.push('Consider paginating or splitting into multiple files');
      }

    } catch (error) {
      issues.push('Invalid JSON syntax');
      suggestions.push('Use JsonBoard to fix JSON syntax errors');
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      suggestions
    };
  }

  static validateJsonFile(filePath: string): boolean {
    try {
      const content = readFileSync(filePath, 'utf-8');
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  private static getMaxDepth(obj: any, depth = 0): number {
    if (obj === null || typeof obj !== 'object') return depth;
    
    if (Array.isArray(obj)) {
      return Math.max(...obj.map(item => this.getMaxDepth(item, depth + 1)));
    }
    
    const depths = Object.values(obj).map(value => this.getMaxDepth(value, depth + 1));
    return depths.length > 0 ? Math.max(...depths) : depth;
  }
}
