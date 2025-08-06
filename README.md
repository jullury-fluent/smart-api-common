# @jullury-fluent/smart-api-common

Shared utilities, DTOs, and helpers used by both client and server packages. Provides the foundation for the Smart API ecosystem with robust support for nested property filtering and searching.

## Features

- **Data Transfer Objects (DTOs)**: Standardized data structures for communication between client and server
- **Helper Functions**: Utility functions for common operations
- **Type Definitions**: Shared type definitions for consistent data handling
- **Zod Extensions**: Extended functionality for Zod schema validation
- **Dynamic Query Building**: Core components for query building with support for:
  - Nested property filtering with dot notation
  - Case-insensitive string searches
  - Circular reference handling between related entities
  - Comprehensive operator integration

## Installation

```bash
npm install @jullury-fluent/smart-api-common
# or
yarn add @jullury-fluent/smart-api-common
# or
pnpm add @jullury-fluent/smart-api-common
```

## Usage

### DTOs and Types

```typescript
import { Order, FilterOperator, FilterItem, SortItem } from '@jullury-fluent/smart-api-common';

// Use the Order enum for sorting direction
const sortDirection = Order.ASC;

// Create a filter item
const filter: FilterItem = {
  field: 'username',
  operator: FilterOperator.CONTAINS,
  value: 'john',
};

// Create a sort item
const sort: SortItem = {
  order_by: 'createdAt',
  order_type: Order.DESC,
};
```

### Helper Functions

```typescript
import { getPath } from '@jullury-fluent/smart-api-common';
import { z } from 'zod';

// Define a Zod schema
const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }),
});

// Get the path structure from a Zod schema
const paths = getPath(UserSchema);
// Result: ['id', 'username', 'email', 'profile.firstName', 'profile.lastName']
```

## Key Components

### Enums and Constants

- `Order`: Enum for sort direction (ASC, DESC)
- `FilterOperator`: Enum for filter operations (eq, neq, gt, lt, contains, etc.)
- `TimeUnit`: Enum for time units in time series analytics

### Types

- `FilterItem`: Interface for filter conditions
- `SortItem`: Interface for sort conditions
- `PaginationOptions`: Interface for pagination parameters
- `QueryOptions`: Interface combining pagination, filtering, and sorting

### Zod Extensions

The package includes extensions for Zod to support advanced validation and schema introspection:

- Path extraction from Zod schemas
- Nested property access with dot notation
- Schema metadata for improved API documentation

## License

UNLICENSED
