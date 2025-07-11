import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import * as z from 'zod';

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  schema?: z.ZodType<any>;
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
   * Save generated schema to a .schema.json file
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
    // This is a simplified schema description generator
    // In practice, you might want to use a library like zod-to-json-schema
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
   * Auto-generate and save schema for a JSON file
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
      suggestions.push('Run JsonBoard with --fix-schema to auto-repair common issues');
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

  private static getMaxDepth(obj: any, depth = 0): number {
    if (obj === null || typeof obj !== 'object') return depth;
    
    if (Array.isArray(obj)) {
      return Math.max(...obj.map(item => this.getMaxDepth(item, depth + 1)));
    }
    
    const depths = Object.values(obj).map(value => this.getMaxDepth(value, depth + 1));
    return depths.length > 0 ? Math.max(...depths) : depth;
  }
}
