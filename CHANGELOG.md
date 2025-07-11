# Changelog

All notable changes to JsonBoard will be documented in this file.

## [1.4.0] - 2025-07-11

### 🚀 Major Features - Drizzle-Style Schema Management
- **Centralized Schema Generation**: New `--init-schema` command creates a single `jsonboard.schema.ts` file
- **TypeScript-First Approach**: Generated schemas are fully typed with Zod and TypeScript support
- **Drizzle-Like Experience**: Import schemas like `import { usersSchema, productsSchema } from './jsonboard.schema'`
- **Validation Helpers**: Auto-generated validation functions for each schema
- **Type Exports**: Full TypeScript type support with `UsersSchemaType`, `ProductsSchemaType`, etc.
- **File Index**: Easy reference system for schema-to-file mapping

### ✨ Schema Management Features
- **Single File Approach**: All schemas in one `jsonboard.schema.ts` file (no folder pollution)
- **Smart Schema Naming**: Converts file paths to valid TypeScript identifiers
- **Validation Functions**: Pre-built validation helpers for each JSON file
- **Type Safety**: Full TypeScript support with inferred types
- **Import/Export Ready**: Clean ES6 imports and exports

### 🔧 Developer Experience
- **Clean Documentation**: Auto-generated JSDoc comments with usage examples
- **Error Handling**: Comprehensive error messages with path information
- **Legacy Support**: `--generate-schema` still available for individual files
- **Zero Configuration**: Works out of the box with any JSON project structure

### 🏗️ Technical Improvements
- Enhanced schema generator with TypeScript code generation
- Improved file scanning with better config file exclusion
- Better error handling and validation reporting
- Optimized schema generation performance

### 📖 Usage Examples

```bash
# Generate centralized schema file
jsonboard --init-schema

# This creates jsonboard.schema.ts with:
import { usersSchema, productsSchema } from './jsonboard.schema';

// Validate data in your code
const result = usersSchema.safeParse(userData);
if (!result.success) {
  console.error('Validation errors:', result.error.issues);
}

// Type-safe data
const users: UsersSchemaType = result.data;
```

## [1.3.0] - 2025-07-11

### 🚀 Major Features
- **Zod Schema Validation**: Added comprehensive JSON schema validation using Zod library
- **Single File Mode**: New `-o` flag to open specific JSON files directly
- **Schema Generation**: Auto-generate `.schema.json` files with `--generate-schema`
- **Smart Config Filtering**: Automatically excludes package.json, tsconfig.json, and other config files
- **Enhanced CLI**: Beautiful help system with examples and GitHub integration

### 🐛 Bug Fixes
- **Fixed Table Editing**: Resolved critical issue where cell editing created nested `record` fields instead of updating data directly
- **Port Conflict Resolution**: Improved auto-port detection to handle EADDRINUSE errors
- **JSON Corruption Prevention**: Fixed recursive nesting issues in products.json and posts.json
- **Index-based Updates**: Added support for updating records in arrays without consistent ID fields

### ✨ Enhancements
- **Improved File Detection**: Enhanced gitignore-aware scanning with recursive directory support
- **Better Error Handling**: Comprehensive error messages and validation feedback
- **Health Checks**: JSON file health monitoring with issue detection and suggestions
- **API Improvements**: New endpoint for index-based record updates

### 🔧 Technical Improvements
- **TypeScript Support**: Enhanced type safety throughout the codebase
- **Build Optimization**: Improved build process with proper Next.js integration
- **Documentation**: Enhanced CLI help with detailed examples and feature descriptions

### 📦 Dependencies
- Added `zod` for runtime schema validation
- Updated core dependencies for better performance and security

### 🏗️ Breaking Changes
- None - all changes are backward compatible

## [1.2.5] - Previous Release
- Basic table view functionality
- JSON editing capabilities
- File scanning and detection

---

## Features Overview

### 🧩 JsonBoard Pro v1.4.0
JsonBoard is now a comprehensive JSON development tool with Drizzle-style schema management:

- 📊 **Spreadsheet-like Interface**: Excel-style editing for JSON arrays
- 🔍 **Auto-detection**: Recursively scans and finds JSON files
- 🚀 **Zero Configuration**: Works out of the box with any project
- 📝 **Raw JSON Editor**: Monaco editor with syntax highlighting
- 💾 **Real-time Saving**: Auto-saves changes as you type
- ✅ **Centralized Schema Management**: Drizzle-like schema generation with TypeScript support
- 📄 **Single File Mode**: Focus on specific files with `-o` flag
- 🛡️ **Smart Filtering**: Excludes config files automatically
- 🔗 **Developer Friendly**: CLI with beautiful help and examples
- 🎯 **TypeScript-First**: Full type safety and IntelliSense support

### Schema Management (New in v1.4.0)

```typescript
// Generate centralized schema
jsonboard --init-schema

// Import and use schemas
import { usersSchema, productsSchema, validateUsersSchema } from './jsonboard.schema';
import type { UsersSchemaType, ProductsSchemaType } from './jsonboard.schema';

// Type-safe validation
const result = usersSchema.safeParse(userData);
if (result.success) {
  const users: UsersSchemaType = result.data; // Fully typed!
}

// Validation helpers
const validation = validateUsersSchema(userData);
if (validation.success) {
  console.log('✅ Data is valid');
} else {
  console.error('❌ Validation failed:', validation.errors);
}
```
