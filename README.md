# 🧩 JsonBoard Pro

<img width="2245" height="1587" alt="JsonBoard Visual JSON Database" src="https://github.com/user-attachments/assets/93e83ef0-760f-486a-8fb9-9cf84781a4f7" />

**JsonBoard** is a local-first, zero-setup visual database for your JSON files. Get a spreadsheet-like GUI to edit JSON data without leaving your project.

[![npm version](https://badge.fury.io/js/jsonboard.svg)](https://badge.fury.io/js/jsonboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/jsonboard.svg)](https://www.npmjs.com/package/jsonboard)
[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2FSH20RAJ%2Fjsonboard&countColor=%23263759&style=plastic)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2FSH20RAJ%2Fjsonboard)

**Skip the complexity of Drizzle, Prisma, or SQLite for small projects.** No more manual JSON editing in VS Code or downloading-uploading from online tools. Just run `npx jsonboard` and get a full-featured GUI that feels like Google Sheets meets phpMyAdmin.

## 🆕 NEW in v1.4.0: Drizzle-Style Schema Management

Generate TypeScript schemas for all your JSON files with a single command! Get the benefits of Drizzle ORM's developer experience without the database complexity.

```bash
# Generate centralized schema file
npx jsonboard --init-schema --dir ./data

# Import and use in your TypeScript projects
import { usersSchema, productsSchema } from './jsonboard.schema';

const result = usersSchema.safeParse(userData);
if (!result.success) {
  console.error('Validation errors:', result.error.errors);
}
```

**[🧪 Try Schema Generation](#-schema-generation-new) | [📋 Read Full FAQ & Use Cases](FAQ.md) | [🚀 Quick Start](#-quick-start) | [💡 Real-World Examples](#-real-world-examples)**

---

## ⚡ Quick Start

### One Command Setup
```bash
# Run in any project directory  
npx jsonboard

# Specify custom directory
npx jsonboard --dir ./my-data

# Use custom port (auto-detects conflicts)
npx jsonboard --port 8080

# Don't open browser automatically
npx jsonboard --no-open

# Install globally
npm install -g jsonboard
```

### Command Line Options
```bash
jsonboard --help

# 🧩 JsonBoard Pro
# A local-first visual database for your JSON files
# Get a spreadsheet-like GUI to edit JSON data without leaving your project.

# 🔗 Documentation: https://github.com/sh20raj/jsonboard

# Usage: jsonboard [options]

# Options:
#   -V, --version              display version number
#   -d, --dir <directory>      Directory to scan for JSON files (default: current directory)
#   -p, --port <port>          Port to run the server on (default: 3000, auto-detects conflicts)
#   --no-open                  Don't automatically open the browser
#   --init-schema              Generate centralized TypeScript schema file
#   -h, --help                 Display help information

# Examples:
#   # Start JsonBoard in current directory
#   jsonboard
  
#   # Specify a custom directory
#   jsonboard --dir ./my-data
  
#   # Use a specific port
#   jsonboard --port 8080
  
#   # Don't open browser automatically
#   jsonboard --no-open
  
#   # Generate TypeScript schemas (NEW!)
#   jsonboard --init-schema --dir ./data
```

---

## 🧪 Schema Generation (NEW)

### 🎯 Drizzle-Style TypeScript Schemas

JsonBoard v1.4.0 introduces centralized schema generation inspired by Drizzle ORM. Generate a single `jsonboard.schema.ts` file containing Zod schemas for all your JSON files.

```bash
# Generate schemas for all JSON files in a directory
npx jsonboard --init-schema --dir ./data

# Or use the global installation
jsonboard --init-schema --dir ./src/data
```

### 📁 What Gets Generated

The `--init-schema` command creates a comprehensive TypeScript file with:

- **🔧 Zod Schemas** - Runtime validation for each JSON file
- **📝 TypeScript Types** - Full type safety for your data
- **🛡️ Validation Functions** - Pre-built helpers with error handling
- **📊 File Index** - Easy reference map for all schemas
- **🏷️ Smart Naming** - Automatic conflict resolution for duplicate names

### 💻 Example Generated Schema

```typescript
// Auto-generated jsonboard.schema.ts
import { z } from 'zod';

// Schema for: users.json
export const usersSchema = z.array(z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  active: z.boolean(),
  profile: z.object({
    age: z.number().int(),
    department: z.string()
  })
}));

// Validation function
export function validateUsersSchema(data: unknown): ValidationResult<UsersSchemaType> {
  const result = usersSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.errors };
}

// TypeScript type
export type UsersSchemaType = z.infer<typeof usersSchema>;
```

### 🚀 Usage in Your Projects

```typescript
import { usersSchema, productsSchema, validateUsersSchema } from './jsonboard.schema';

// Runtime validation
const userData = await fetch('/api/users').then(r => r.json());
const validation = validateUsersSchema(userData);

if (validation.success) {
  // TypeScript knows the exact shape of validation.data
  console.log(`Found ${validation.data.length} users`);
  validation.data.forEach(user => {
    console.log(`${user.name} (${user.email})`); // Fully typed!
  });
} else {
  console.error('Validation failed:', validation.errors);
}

// Direct schema usage
const result = productsSchema.safeParse(productsData);
```

### 🎯 Perfect For

- **🔥 Rapid Prototyping** - Get type-safe data validation in seconds
- **🧪 Testing** - Validate test fixtures and API responses
- **📊 Data Migration** - Ensure data integrity during migrations
- **🛡️ Runtime Safety** - Catch data structure mismatches early
- **👥 Team Collaboration** - Share data contracts via generated types
- **📚 Documentation** - Auto-documented data structures

### 🔄 Integration with Popular Tools

```bash
# Next.js projects
jsonboard --init-schema --dir ./src/data

# Nuxt projects  
jsonboard --init-schema --dir ./assets/data

# Vite/React projects
jsonboard --init-schema --dir ./public/data

# Any TypeScript project
jsonboard --init-schema --dir ./data
```

---

## ✨ Features

### 🧪 NEW: Schema Generation & Type Safety
- **🔧 Drizzle-Style Schemas** - Generate centralized TypeScript schemas with Zod
- **📝 Auto-Generated Types** - Full TypeScript support for all JSON structures
- **🛡️ Runtime Validation** - Catch data errors before they break your app
- **📊 Smart Conflict Resolution** - Automatic handling of duplicate schema names
- **🎯 Single Command Setup** - `--init-schema` generates everything you need

### 🚀 Smart JSON Detection
- **🔍 Auto-scan current directory** - No more looking for `/data` folder
- **📁 Recursive file detection** - Finds JSON files in subdirectories  
- **🚫 Gitignore-aware** - Automatically excludes `node_modules`, `.next`, `.git`, etc.
- **⚡ Instant validation** - Only shows valid JSON files
- **🔧 Smart port handling** - Auto-detects port conflicts (3000 → 3001 → 3002...)

### 🎯 Developer-Focused Interface
- **📊 Spreadsheet-like editing** - Edit JSON arrays like database tables
- **🔀 Dual view modes** - Toggle between Table View and Raw JSON Editor
- **📁 File metadata display** - See file sizes, record counts, modification dates
- **📍 Relative path display** - Clear file organization and hierarchy
- **💾 Real-time auto-save** - Changes save directly to your files
- **🎨 Modern responsive UI** - Works on desktop, tablet, and mobile

### 🛠️ Professional Features
- **➕ Full CRUD operations** - Create, read, update, delete records
- **🔍 Search and filtering** - Find data quickly across all files
- **🆔 Auto-ID generation** - Smart ID assignment for new records
- **🧠 Smart data handling** - Handles nested objects, arrays, and different types
- **🔐 100% local** - Your data never leaves your machine
- **🚀 Zero configuration** - Works with any framework or project structure

---

## 🎯 Perfect For Developers

### 🚀 Rapid Development Scenarios
- **🔥 MVP Development** - Get proof-of-concept running in minutes
- **🧩 Data Modeling** - Quickly design and iterate on data structures
- **📊 Analytics Dashboards** - Prototype dashboards with JSON data sources
- **🗂️ Content Management** - Manage blog posts, docs, or product catalogs visually
- **🔄 API Mocking** - Instantly create and edit mock API responses
- **🧑‍💻 Team Collaboration** - Share JSON data files with teammates using Git
- **🛠️ Configuration Management** - Edit app settings, feature flags, environment configs
- **🧪 Testing Data** - Create and update test fixtures for automated tests

### 👨‍💻 Developer Types Who Love JsonBoard
- **Frontend Developers** who want to avoid backend complexity
- **Full-Stack Developers** who need quick data management  
- **Junior Developers** learning without SQL complexity
- **Indie Developers** building solo projects efficiently
- **Agency Developers** creating client prototypes quickly
- **Open Source Contributors** managing project data simply

### 🏗️ Project Types & Frameworks
- **Static Site Generators** (Gatsby, Next.js, Nuxt, Hugo, Jekyll)
- **JAMstack Applications** (React, Vue, Svelte, Angular)
- **Prototypes & MVPs** (Any framework, any stack)
- **Content-Heavy Sites** (Blogs, portfolios, documentation)
- **Small Business Apps** (Inventory, CRM, project management)
- **Educational Projects** (Tutorials, courses, examples)

---

## � Why JsonBoard vs. Alternatives?

| **JsonBoard** | vs. Traditional DB | vs. Headless CMS | vs. Spreadsheets |
|-----------|-------------------|------------------|------------------|
| ✅ 0-minute setup | ❌ Hours of config | ❌ Account setup | ❌ Poor dev integration |
| ✅ Git-friendly | ❌ Migration complexity | ❌ External dependency | ❌ No version control |
| ✅ Visual + Code | ❌ Query language | ❌ Limited customization | ❌ Not developer-focused |
| ✅ Free forever | ❌ Server costs | ❌ Monthly fees | ❌ Feature limitations |
| ✅ Offline-first | ❌ Network dependency | ❌ Internet required | ❌ Cloud dependency |

### 🚫 No More Database Complexity
- ❌ **No Drizzle setup** - Skip ORM configuration and schema management  
- ❌ **No Prisma migrations** - Avoid complex database migrations and client generation
- ❌ **No SQLite files** - No binary database files in your repo
- ❌ **No connection strings** - No database servers, ports, or authentication
- ❌ **No SQL knowledge required** - Visual interface for everyone

---

## 🌟 Real-World Examples

### 🎨 Portfolio Website
Manage your projects, skills, and experience visually:
```bash
portfolio/
├── data/
│   ├── projects.json     # Add/remove projects instantly
│   ├── skills.json       # Update your tech stack
│   ├── experience.json   # Manage work history
│   └── testimonials.json # Client feedback
```
**Perfect for**: Freelancers, developers showcasing work, agencies updating portfolios

### 📝 Blog & Content Sites  
Content management without the CMS complexity:
```bash
blog/
├── data/
│   ├── posts.json        # Blog post metadata & content
│   ├── authors.json      # Writer profiles
│   ├── categories.json   # Content organization
│   └── featured.json     # Homepage highlights
```
**Perfect for**: Personal blogs, company blogs, documentation sites, news sites

### 🛍️ E-commerce Prototypes
Build product catalogs quickly:
```bash
store/
├── data/
│   ├── products.json     # Product listings with details
│   ├── categories.json   # Product organization
│   ├── inventory.json    # Stock tracking
│   └── promotions.json   # Sales and discounts
```
**Perfect for**: MVP development, client demos, prototype testing, small businesses

### 🎮 Indie Game Development
Manage game data without databases:
```bash
game/
├── data/
│   ├── levels.json       # Level design and progression
│   ├── characters.json   # Player and NPC stats
│   ├── items.json        # Weapons, armor, collectibles
│   └── leaderboard.json  # High scores and achievements
```
**Perfect for**: Indie developers, game jams, prototype testing, balance tweaking

### 📊 Small Business Tools
Quick business applications:
```bash
business/
├── data/
│   ├── customers.json    # Customer database
│   ├── invoices.json     # Billing and payments
│   ├── inventory.json    # Stock management
│   └── employees.json    # Staff information
```
**Perfect for**: Small businesses, freelancers, local services, consultants

---

## 🖥️ Screenshots & Demo

### Table View - Spreadsheet-like Editing
```
┌─────────────────────────────────────────────────────────────┐
│ 🧩 JsonBoard Pro - users.json (4 records, 2.1 KB)         │
├─────────────────────────────────────────────────────────────┤
│ #  │ id   │ name        │ email              │ role    │ ⚙️  │
├─────────────────────────────────────────────────────────────┤
│ 1  │ 1    │ John Doe    │ john@example.com   │ admin   │ 🗑️  │
│ 2  │ 2    │ Jane Smith  │ jane@example.com   │ user    │ 🗑️  │
│ 3  │ 3    │ Bob Wilson  │ bob@example.com    │ editor  │ 🗑️  │
└─────────────────────────────────────────────────────────────┘
│ ➕ Add Row                                                  │
```

### Raw JSON View - Full JSON Editor
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### File List View - Project Overview
```
📁 /your-project (5 JSON files found)

📄 posts.json          4 records    3.2 KB    Blog posts
📄 users.json          12 records   1.8 KB    User accounts  
📄 products.json       89 records   15.4 KB   Product catalog
📄 config.json         1 record     0.5 KB    App settings
📄 testimonials.json   6 records    2.1 KB    Client feedback
```

---

## 🛠 Roadmap

### ✅ Completed (v1.2.4)
- [x] **Smart file detection** - Auto-scan current directory instead of requiring `/data` folder
- [x] **Gitignore awareness** - Automatically excludes `node_modules`, `.next`, `.git`, etc.
- [x] **Automatic port conflict resolution** - Smart port detection (3000 → 3001 → 3002...)
- [x] **Enhanced CLI with help** - Beautiful `--help` command with examples and GitHub link
- [x] **Custom port support** - `--port` flag for specific port assignment
- [x] **Improved error handling** - Better error messages and troubleshooting guidance
- [x] **CLI Table view + Raw JSON editor toggle**
- [x] **Full CRUD operations** (Create, Read, Update, Delete)
- [x] **File metadata display** (size, record count, timestamps)
- [x] **Relative path display** and file organization
- [x] **Modern responsive UI** with search and filtering
- [x] **RESTful API endpoints** (`/api/files`, `/api/files/:filename`)

### 🔄 In Development
- [ ] **Undo/Redo support** with history tracking
- [ ] **Git commit integration** after save  
- [ ] **JSON Schema validation** and type checking
- [ ] **Import/Export features** (CSV, Excel, SQL)
- [ ] **Advanced search** with column filtering
- [ ] **Data relationships** and foreign key support

### 🎯 Planned Features
- [ ] **VS Code extension** for inline editing
- [ ] **Real-time collaboration** (local network)
- [ ] **Database migration tools** (JSON ↔ SQL)
- [ ] **Custom themes** and UI customization
- [ ] **Plugin system** for custom data types
- [ ] **Command palette** for power users
- [ ] **API documentation generator**
- [ ] **Backup and restore** functionality

### 🚀 Community Requests
- [ ] **YAML and XML support**
- [ ] **Custom field types** (date picker, file upload)
- [ ] **Bulk operations** and batch editing
- [ ] **Data visualization** and charts
- [ ] **Multi-language support**
- [ ] **Dark mode theme**

---

## 🌟 Why Open Source?

JsonBoard is **100% open source** because we believe developers should have:

### 🔓 **Freedom & Control**
- **No vendor lock-in** - Your tools should never hold your data hostage
- **Full customization** - Modify JsonBoard to fit your exact workflow
- **Transparency** - See exactly how your data is handled and stored
- **Privacy** - No telemetry, no tracking, no data collection

### 🤝 **Community-Driven Development**
- **Built by developers, for developers** - Features that actually matter
- **Real-world use cases** - Solutions based on actual developer needs  
- **Rapid iteration** - Community feedback drives feature development
- **Shared ownership** - Everyone can contribute and improve the tool

### 💪 **Developer Benefits**
- **Learn from the code** - Study modern React, TypeScript, and Node.js patterns
- **Contribute features** - Add functionality you need for your projects
- **Fix bugs quickly** - Don't wait for vendor support cycles
- **Career growth** - Open source contributions showcase your skills

### 🚀 **Reliability & Longevity**
- **Can't be discontinued** - Community can always fork and continue
- **No surprise pricing** - Always free, forever
- **No service dependencies** - Runs completely offline
- **Future-proof** - Adapts to new technologies and frameworks

---

## 🤝 Contributing

We welcome all types of contributions! Here's how you can help make JsonBoard better:

### 🐛 **Found a Bug?**
- [Open an issue](https://github.com/SH20RAJ/jsonboard/issues) with reproduction steps
- Include your environment details and JSON file examples
- Screenshots help us understand UI issues

### 💡 **Have a Feature Idea?**
- [Start a discussion](https://github.com/SH20RAJ/jsonboard/discussions) to get community feedback
- Check the [roadmap](#-roadmap) to see if it's already planned
- Describe your use case and how it would help other developers

### 🔧 **Want to Code?**
- Check [open issues](https://github.com/SH20RAJ/jsonboard/issues) for good first contributions
- Fork the repo and create a feature branch
- Follow the existing code style and add tests
- Submit a PR with clear description of changes

### 📚 **Improve Documentation?**
- Fix typos or unclear explanations
- Add more use case examples
- Translate to other languages
- Create video tutorials or blog posts

### 🎨 **Design & UX?**
- Suggest UI improvements
- Create mockups for new features  
- Improve accessibility and responsive design
- Test on different devices and browsers

**Every contribution matters!** From typo fixes to major features, we appreciate all help in making JsonBoard the best tool for JSON data management.

---

## 💡 Inspiration

JsonBoard draws inspiration from the best developer tools:

- **phpMyAdmin** (but for JSON) - Database management interface
- **Google Sheets** (for devs) - Spreadsheet-like data editing
- **Prisma Studio** - Visual database browser
- **Flatfile.io** - Data onboarding platform
- **Storyblok** - Headless CMS interface
- **VS Code** - Developer-focused experience

---

## 📜 License

MIT License - feel free to use in personal and commercial projects.

---

## 🔗 Links

- **📦 npm Package**: https://www.npmjs.com/package/jsonboard
- **🐙 GitHub Repository**: https://github.com/SH20RAJ/jsonboard
- **📋 Full FAQ & Use Cases**: [FAQ.md](FAQ.md)
- **🐛 Bug Reports**: [Issues](https://github.com/SH20RAJ/jsonboard/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/SH20RAJ/jsonboard/discussions)

---

Made with ❤️ by [SH20RAJ](https://github.com/SH20RAJ/) and the open source community.
