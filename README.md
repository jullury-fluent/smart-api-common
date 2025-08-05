# @smart-api/common

Shared utilities, DTOs, and helpers used by both client and server packages. Provides the foundation for the Smart Endpoint ecosystem with robust support for nested property filtering and searching.

## Features

- **Data Transfer Objects (DTOs)**: Standardized data structures for communication between client and server
- **Helper Functions**: Utility functions for common operations
- **ORM Utilities**: Tools for working with Sequelize ORM
- **Dynamic Query Building**: Server-side implementation of the query builder with support for:
  - Nested property filtering with dot notation
  - Case-insensitive string searches
  - Circular reference handling between related entities
  - Comprehensive Sequelize operator integration

## Installation

```bash
npm install @smart-api/common
# or
yarn add @smart-api/common
# or
pnpm add @smart-api/common
```

## Usage

### DTOs

```typescript
import { PaginationDto, FilterDto, SortDto } from '@smart-api/common';

// Create a pagination DTO
const pagination = new PaginationDto();
pagination.page = 1;
pagination.pageSize = 25;

// Create a filter DTO
const filter = new FilterDto();
filter.search = 'john';
filter.filters = { status: 'active', 'user.role': 'admin' };

// Create a sort DTO
const sort = new SortDto();
sort.field = 'createdAt';
sort.direction = 'DESC';
```

### Helper Functions

```typescript
import { buildWhereClause, searchableFields } from '@smart-api/common';

// Build a Sequelize where clause from a filter object
const whereClause = buildWhereClause({
  model: UserModel,
  clientFilter: { status: 'active', 'user.role': 'admin' },
  search: 'john',
});

// Get searchable fields from a Sequelize model
const fields = searchableFields(UserModel);
```

### ORM Utilities

```typescript
import { createSequelizeInclude } from '@smart-api/common';

// Create a Sequelize include object for nested relations
const include = createSequelizeInclude(UserModel, ['company', 'profile']);
```

## Key Components

### Dynamic Query Building

The common package provides server-side implementations for building dynamic queries with Sequelize:

- `buildWhereClause`: Constructs Sequelize WHERE conditions from client filters and search terms
- `buildAdditionalFilters`: Transforms client filter values to use appropriate Sequelize operators
- `buildSearchQuery`: Creates full-text search conditions across multiple fields
- `searchNestedFields`: Handles searching across related entities with proper handling for circular references

### Nested Property Support

The package includes robust support for working with nested properties in filters and searches:

- Dot notation for accessing nested properties (e.g., `user.profile.role`)
- Proper handling of circular references between related entities
- Support for various relationship types (1:1, 1:Many, Many:Many)

## Testing

```bash
npm test
# or
yarn test
# or
pnpm test
```

## License

UNLICENSED
