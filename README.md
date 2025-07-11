# 🧩 JsonBoard

**JsonBoard** is a local-first, zero-setup visual database for your JSON files.

No more manual JSON editing in VS Code or downloading-uploading from online tools.  
Just run `npx jsonboard` and get a full-featured GUI that feels like Google Sheets for your JSON data — perfect for projects that don't use traditional databases like SQL, MySQL, PostgreSQL, or MongoDB.

[![npm version](https://badge.fury.io/js/jsonboard.svg)](https://badge.fury.io/js/jsonboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/jsonboard.svg)](https://www.npmjs.com/package/jsonboard)
[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2FSH20RAJ%2Fjsonboard&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2FSH20RAJ%2Fjsonboard)

---

## ✨ Features

- 📁 **Auto-detect JSON files** - Automatically finds all `.json` files in your project
- 📝 **Spreadsheet-like editing** - Edit arrays of JSON objects like a database table
- 🔀 **Dual view modes** - Toggle between Table View and Raw JSON Editor
- 💾 **Auto-save** - Changes save directly to your `.json` files (no exports needed)
- 🧠 **Smart data handling** - Handles nested objects and different data types
- 🚀 **Zero configuration** - Works with any framework: React, Next.js, Vue, Svelte, etc.
- 🔐 **Local-only** - Your data stays in your codebase, never uploaded anywhere
- 🎯 **Perfect for non-database projects** - Ideal for static sites, prototypes, and simple data management

---

## � Quick Start

### Installation & Usage

```bash
# Run in your project directory
npx jsonboard

# Or specify a custom folder
npx jsonboard --dir=data/content

# Or install globally
npm install -g jsonboard
jsonboard
```

### Example Project Structure

```
your-project/
│
├── data/
│   ├── users.json        # User data
│   ├── posts.json        # Blog posts
│   ├── products.json     # Product catalog
│   └── config.json       # App configuration
│
├── src/
└── package.json
```

JsonBoard automatically scans your `data/` folder (or any folder you specify) and provides a beautiful interface to edit all JSON files.

---

## 🎯 Perfect For

### Projects Without Traditional Databases
- **Static Site Generators** (Gatsby, Next.js, Nuxt, etc.)
- **JAMstack Applications** 
- **Prototypes & MVPs**
- **Content Management** (blogs, documentation sites)
- **Mock Data Management** for development
- **Configuration Management**
- **Small to Medium Data Sets**

### Use Cases
- � **Content Management** - Edit blog posts, pages, or documentation
- � **Product Catalogs** - Manage product data for e-commerce prototypes
- � **User Management** - Handle user profiles and settings
- ⚙️ **Configuration** - Manage app settings and feature flags
- � **Mock Data** - Create and maintain test data for development
- � **Data Analysis** - Quick data entry and manipulation for small datasets

---

## �️ Screenshots & Demo

### Table View - Spreadsheet-like Editing
```
┌─────────────────────────────────────────────────────────────┐
│ 🧩 JsonBoard - users.json                                  │
├─────────────────────────────────────────────────────────────┤
│ #  │ id   │ name        │ email              │ role    │ ⚙️  │
├─────────────────────────────────────────────────────────────┤
│ 1  │ 1    │ John Doe    │ john@example.com   │ admin   │ 🗑️  │
│ 2  │ 2    │ Jane Smith  │ jane@example.com   │ user    │ �️  │
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

---

## 🛠 Roadmap

* [x] CLI with auto-UI server
* [x] JSON Table view + editing
* [x] Raw editor toggle
* [ ] Undo/Redo support
* [ ] Git commit after save
* [ ] JSON Schema validation
* [ ] RESTful API endpoint for data (`/api/[file]`)
* [ ] VS Code extension version

---

## 💡 Inspiration

* phpMyAdmin (but for JSON)
* Google Sheets (for devs)
* Flatfile.io
* Storyblok / Headless CMS
* VS Code’s JSON editor

---

## 🤝 Contributing

Pull requests, issues, and ideas are welcome!
Let’s make JSON editing beautiful and easy.

---

## 📜 License

MIT

---

Made with ❤️ by SH20RAJ
