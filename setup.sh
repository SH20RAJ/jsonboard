#!/bin/bash

echo "🧩 JsonBoard - Project Setup"
echo "============================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
mkdir -p dist
mkdir -p data

# Create example data files in data directory
echo "📄 Creating example data files..."
cp examples/* data/ 2>/dev/null || echo "No example files to copy"

# Build CLI
echo "🔨 Building CLI..."
npm run build:cli || echo "Build CLI skipped (dependencies not installed yet)"

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. npm install           # Install dependencies"
echo "2. npm run build         # Build the project"
echo "3. npx jsonboard         # Run JsonBoard"
echo ""
echo "For development:"
echo "1. npm run dev           # Start development server"
echo "2. npm test              # Run tests"
echo ""
