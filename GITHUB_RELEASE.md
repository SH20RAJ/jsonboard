# JsonBoard v1.4.0 - GitHub Release Notes

## 🚀 JsonBoard v1.4.0: Drizzle-Style Schema Management

**Major Feature Release** - This version introduces centralized TypeScript schema generation, bringing the Drizzle ORM developer experience to JSON files.

### 🆕 New Features

#### 🧪 Centralized Schema Generation
- **New Command**: `--init-schema` generates a single TypeScript schema file for all JSON files
- **Drizzle-Inspired API**: Clean, modern developer experience similar to Drizzle ORM
- **Zod Integration**: Runtime validation with comprehensive error handling
- **TypeScript-First**: Auto-generated types for complete type safety

#### 🔧 Generated Schema Features
- ✅ **Zod Schemas** - Runtime validation for every JSON file
- ✅ **TypeScript Types** - Full type safety with `z.infer<>`
- ✅ **Validation Functions** - Pre-built helpers with proper error handling
- ✅ **File Index** - Easy reference map for all schemas
- ✅ **Smart Naming** - Automatic conflict resolution for duplicate schema names

### 📋 Usage

```bash
# Generate centralized schema file
npx jsonboard --init-schema --dir ./data

# Import and use in TypeScript projects
import { usersSchema, productsSchema } from './jsonboard.schema';

const result = usersSchema.safeParse(userData);
if (!result.success) {
  console.error('Validation errors:', result.error.errors);
}
```

### 🎯 Perfect For

- **🔥 Rapid Prototyping** - Type-safe validation in seconds
- **🧪 Testing** - Validate fixtures and API responses
- **📊 Data Migration** - Ensure integrity during transitions
- **🛡️ Runtime Safety** - Catch data mismatches early
- **👥 Team Collaboration** - Share data contracts via generated types
- **📚 Documentation** - Auto-documented data structures

### 🛠️ Technical Improvements

- **Enhanced CLI**: Updated help system with schema generation examples
- **Smart File Detection**: Excludes `.schema.json` files to prevent duplicates
- **TypeScript Configuration**: Proper exclusion of generated files from Next.js compilation
- **Error Handling**: Comprehensive validation with detailed error messages
- **Performance**: Optimized schema generation for large directory structures

### 📦 Installation

```bash
# Install globally
npm install -g jsonboard

# Or use directly
npx jsonboard --init-schema --dir ./data
```

### 🔗 Integration Examples

#### Next.js API Routes
```typescript
import { validateUsersSchema } from '@/jsonboard.schema';

export async function POST(request: Request) {
  const validation = validateUsersSchema(await request.json());
  if (!validation.success) {
    return Response.json({ errors: validation.errors }, { status: 400 });
  }
  // validation.data is fully typed!
}
```

#### React Components
```typescript
import { UsersSchemaType } from '@/jsonboard.schema';

interface Props {
  users: UsersSchemaType; // Fully typed
}
```

### 🆚 Comparison

| Feature | JsonBoard v1.4.0 | Drizzle | Prisma |
|---------|------------------|---------|---------|
| Setup Time | 30 seconds | 30+ minutes | 30+ minutes |
| Database Required | ❌ | ✅ | ✅ |
| Visual Interface | ✅ | ❌ | ✅ |
| Auto-generated | ✅ | ❌ | ❌ |

### 🔄 Breaking Changes

None - this is a purely additive release. All existing functionality remains unchanged.

### 📈 What's Next

- React Hook generation for data loading
- API route generation for CRUD operations
- GraphQL schema export capabilities
- Database migration tools for scaling

### 🤝 Contributors

Special thanks to the community for feedback and feature requests that made this release possible!

### 🐛 Bug Reports

Found an issue? Please [create an issue](https://github.com/SH20RAJ/jsonboard/issues) with details.

---

**Full Changelog**: https://github.com/SH20RAJ/jsonboard/compare/v1.3.0...v1.4.0

**Installation**: `npm install -g jsonboard@1.4.0`
