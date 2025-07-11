# JsonBoard - Development Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/sh20raj/jsonboard.git
cd jsonboard

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build:cli        # Build CLI tools
npm run build:ui         # Build UI components
npm run build            # Build everything

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Check code quality
npm run lint:fix         # Fix linting issues

# Other
npm run clean            # Clean build artifacts
npm run type-check       # Check TypeScript types
```

### Project Structure

```
jsonboard/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── Header.tsx      # App header
│   │   ├── FileList.tsx    # File sidebar
│   │   ├── JsonEditor.tsx  # Main editor
│   │   ├── TableView.tsx   # Table view component
│   │   └── RawJsonView.tsx # Raw JSON editor
│   └── cli/                # CLI tools
│       ├── index.ts        # CLI entry point
│       ├── server.ts       # Express server
│       └── utils/          # CLI utilities
├── examples/               # Example JSON files
├── dist/                   # Built files
└── docs/                   # Documentation
```

## 🧪 Testing

### Test Files
Create test files alongside components:
```
src/components/
├── FileList.tsx
├── FileList.test.tsx
├── JsonEditor.tsx
└── JsonEditor.test.tsx
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test FileList.test.tsx
```

## 📦 Building for Production

```bash
# Build everything
npm run build

# The built files will be in:
# - dist/          # CLI tools
# - .next/         # Next.js app
```

## 🐛 Debugging

### CLI Issues
```bash
# Enable debug mode
DEBUG=jsonboard* npx jsonboard

# Check for file permissions
ls -la data/

# Test with verbose output
npx jsonboard --dir=examples --verbose
```

### UI Issues
- Open browser dev tools
- Check console for errors
- Verify API endpoints are responding

## 💡 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Run linting and tests
6. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Add JSDoc comments for functions

### Commit Messages
Use conventional commits:
```
feat: add table sorting functionality
fix: resolve file path resolution on Windows
docs: update installation instructions
```
