# Changelog

All notable changes to JsonBoard will be documented in this file.

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

### 🧩 JsonBoard Pro v1.3.0
JsonBoard is now a comprehensive JSON development tool with:

- 📊 **Spreadsheet-like Interface**: Excel-style editing for JSON arrays
- 🔍 **Auto-detection**: Recursively scans and finds JSON files
- 🚀 **Zero Configuration**: Works out of the box with any project
- 📝 **Raw JSON Editor**: Monaco editor with syntax highlighting
- 💾 **Real-time Saving**: Auto-saves changes as you type
- ✅ **Schema Validation**: Zod-powered validation with auto-generated schemas
- 📄 **Single File Mode**: Focus on specific files with `-o` flag
- 🛡️ **Smart Filtering**: Excludes config files automatically
- 🔗 **Developer Friendly**: CLI with beautiful help and examples

### CLI Usage Examples

```bash
# Start JsonBoard in current directory
jsonboard

# Open specific file
jsonboard -o data.json

# Validate all JSON files
jsonboard --validate

# Generate schema files
jsonboard --generate-schema

# Use custom directory and port
jsonboard --dir ./my-data --port 8080
```

### New Validation Features

```bash
# Validate JSON integrity
jsonboard --validate
✅ products.json
⚠️  users.json
    • name: Required field missing

# Generate schemas
jsonboard --generate-schema
✅ products.json → products.schema.json
✅ users.json → users.schema.json
```
