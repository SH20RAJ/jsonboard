# 🧩 JsonBoard - Quick Start Guide

## What is JsonBoard?

JsonBoard transforms JSON file editing into a beautiful, spreadsheet-like experience. Perfect for developers working on projects without traditional databases.

## ⚡ Quick Start

```bash
# Option 1: Run directly (recommended)
npx jsonboard

# Option 2: Install globally
npm install -g jsonboard
jsonboard

# Option 3: Specify custom directory
npx jsonboard --dir=content
```

## 🎯 Who is this for?

✅ **Perfect for:**
- Static site generators (Gatsby, Next.js, Nuxt)
- JAMstack applications
- Prototypes and MVPs
- Content management
- Mock data for development
- Configuration files
- Small to medium datasets

❌ **Not suitable for:**
- Large databases (1000+ records)
- High-frequency updates
- Multi-user concurrent editing
- Complex relationships and queries

## 📁 Supported JSON Structures

### Arrays of Objects (Best Experience)
```json
[
  { "id": 1, "name": "John", "email": "john@example.com" },
  { "id": 2, "name": "Jane", "email": "jane@example.com" }
]
```

### Configuration Objects
```json
{
  "apiUrl": "https://api.example.com",
  "features": { "auth": true, "payments": false }
}
```

## 🚀 Features Comparison

| Feature | JsonBoard | Manual Editing | Online Tools |
|---------|-----------|----------------|--------------|
| Local files | ✅ | ✅ | ❌ |
| Visual editing | ✅ | ❌ | ✅ |
| Auto-save | ✅ | Manual | Manual |
| No uploads | ✅ | ✅ | ❌ |
| Spreadsheet view | ✅ | ❌ | Some |
| Zero config | ✅ | ✅ | ❌ |

## 🛠️ Development Workflow

1. **Development**: Run `npx jsonboard` to edit data visually
2. **Version Control**: Commit JSON changes like any code
3. **Production**: JSON files are served as static assets
4. **Collaboration**: Share via Git, edit via JsonBoard

## 💡 Tips & Best Practices

- Keep JSON files under 100MB for best performance
- Use consistent field names across array objects
- Backup important data before bulk edits
- Use the Raw JSON view for complex nested structures
- Combine with your existing build tools seamlessly

## 🔧 CLI Options

```bash
jsonboard [options]

-d, --dir <directory>    Directory to scan (default: "data")
-p, --port <port>        Server port (default: 3000)
--no-open               Don't open browser automatically
-h, --help              Show help
-V, --version           Show version
```

## 📞 Need Help?

- 📖 **Documentation**: See README.md
- 🐛 **Bug Reports**: Open a GitHub issue
- 💬 **Questions**: Start a GitHub discussion
- 🤝 **Contributing**: Check DEVELOPMENT.md

---

**Ready to make JSON editing effortless?**
```bash
npx jsonboard
```
