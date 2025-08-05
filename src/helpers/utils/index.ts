import { z, ZodObject } from 'zod';

export function isPlainObject(val: unknown): val is Record<string, unknown> {
  if (typeof val !== 'object' || val === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}
export const sequelizeOperatorValidators: Record<string, z.ZodTypeAny> = {
  eq: z.union([z.string(), z.number(), z.boolean(), z.null(), z.date()]),
  ne: z.union([z.string(), z.number(), z.boolean(), z.null(), z.date()]),
  gt: z.union([z.number(), z.date(), z.string()]),
  gte: z.union([z.number(), z.date(), z.string()]),
  lt: z.union([z.number(), z.date(), z.string()]),
  lte: z.union([z.number(), z.date(), z.string()]),
  in: z.array(z.any()),
  notIn: z.array(z.any()),
  like: z.string().refine((val) => !val.includes('%'), {
    message: "Value must not contain '%' character",
  }),
  notLike: z.string().refine((val) => !val.includes('%'), {
    message: "Value must not contain '%' character",
  }),
  iLike: z.string().refine((val) => !val.includes('%'), {
    message: "Value must not contain '%' character",
  }),
  notILike: z.string().refine((val) => !val.includes('%'), {
    message: "Value must not contain '%' character",
  }),
  between: z.tuple([z.any(), z.any()]),
  notBetween: z.tuple([z.any(), z.any()]),
  is: z.union([z.null(), z.boolean()]),
  not: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  or: z.array(z.any()),
  and: z.array(z.any()),
  startsWith: z.string(),
  endsWith: z.string(),
  substring: z.string(),
};

export function validateOperatorInput(operator: string, value: unknown) {
  const schema = sequelizeOperatorValidators[operator];
  if (!schema) throw new Error(`Unsupported operator: ${operator}`);
  try {
    schema.parse(value);
  } catch (err) {
    console.error(err.errors.map((e) => e.message).join(', '));
    return [null, err];
  }
  return [true, null];
}

interface ClientFilter {
  [key: string]: unknown;
}

interface FilterMap {
  [key: string]: unknown;
}

export function validateOptions(
  clientFilter: ClientFilter,
  filterMap: FilterMap,
): [true, null] | [null, string | z.ZodError] {
  const nestedFilterMap = nestedToDotObject(filterMap);
  for (const [key, value] of Object.entries(clientFilter)) {
    if (
      !nestedFilterMap.hasOwnProperty(key) &&
      !sequelizeOperatorValidators[key]
    ) {
      return [null, `Invalid key: ${key}`];
    }
    if (sequelizeOperatorValidators[key]) {
      const [_, err] = validateOperatorInput(key, value);
      if (err) return [null, err];
    } else if (Object.keys(value as object).length > 0) {
      Object.keys(value as object).forEach((k) => {
        if (!sequelizeOperatorValidators[k]) {
          return [null, `Invalid key: ${k}`];
        }
      });
    } else if (!nestedFilterMap.hasOwnProperty(key)) {
      return [null, `Invalid key: ${key}`];
    }
  }
  return [true, null];
}

export function nestedToDotObject(
  obj: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    if (
      obj[key] !== null &&
      typeof obj[key] === 'object' &&
      !Array.isArray(obj[key])
    ) {
      Object.keys(obj[key]).forEach((nestedKey) => {
        result[`${key}.${nestedKey}`] = obj[key][nestedKey];
      });
    } else {
      result[key] = obj[key];
    }
  });

  return result;
}

export function dotToNestedObject(
  dotString: string,
  value: unknown = true,
): Record<string, unknown> {
  if (!dotString) return {};
  return dotString
    .split('.')
    .reverse()
    .reduce<Record<string, unknown>>(
      (acc, key) => ({ [key]: acc }),
      value as Record<string, unknown>,
    );
}

export function setNestedKey(obj: any, path: string[], value: true) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  current[path[path.length - 1]] = value;
}

export function getFilterable<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  visited = new WeakSet(),
): Record<string, unknown> {
  if (visited.has(schema)) {
    return {};
  }

  visited.add(schema);

  const filterable: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(schema.shape)) {
    const value = v as any;

    if (!value) continue;

    if (value instanceof z.ZodLazy) {
      try {
        const lazyValue = value._def.getter();
        if (lazyValue instanceof z.ZodObject) {
          if (!visited.has(lazyValue)) {
            const nested = getFilterable(lazyValue, visited);
            if (Object.keys(nested).length) filterable[key] = nested;
          }
          continue;
        } else if (
          lazyValue instanceof z.ZodArray &&
          lazyValue._def.type instanceof z.ZodObject
        ) {
          if (!visited.has(lazyValue._def.type)) {
            const nested = getFilterable(lazyValue._def.type, visited);
            if (Object.keys(nested).length) filterable[key] = nested;
          }
          continue;
        }
      } catch (e) {
        continue;
      }
    }

    if (value instanceof z.ZodObject) {
      if (!visited.has(value)) {
        const nested = getFilterable(value, visited);
        if (Object.keys(nested).length) filterable[key] = nested;
      }
      continue;
    }

    if (value instanceof z.ZodArray && value._def.type instanceof z.ZodObject) {
      if (!visited.has(value._def.type)) {
        const nested = getFilterable(value._def.type, visited);
        if (Object.keys(nested).length) filterable[key] = nested;
      }
      continue;
    }

    if (
      'isFilterable' in value &&
      typeof value.isFilterable === 'function' &&
      value.isFilterable()
    ) {
      setNestedKey(filterable, [key], true);
    }
  }

  return filterable;
}

export function getSortable<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
): Record<string, unknown> {
  const sortable: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema.shape)) {
    if (value instanceof z.ZodObject) {
      const nested = getSortable(value);
      if (Object.keys(nested).length) sortable[key] = nested;
      continue;
    }

    if (
      'isSortable' in value &&
      typeof value.isSortable === 'function' &&
      value.isSortable()
    ) {
      setNestedKey(sortable, [key], true);
    }
  }

  return sortable;
}

export function getQueryable<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
): Record<string, unknown> {
  const queryable: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema.shape)) {
    if (value instanceof z.ZodObject) {
      const nested = getQueryable(value);
      if (Object.keys(nested).length) queryable[key] = nested;
      continue;
    }

    if (
      'isQueryable' in value &&
      typeof value.isQueryable === 'function' &&
      value.isQueryable()
    ) {
      if ('path' in value && typeof value.path === 'function') {
        const path = value._def.description?.path as string[];
        if (path) {
          for (const p of path) {
            setNestedKey(queryable, [p], true);
          }
        } else {
          setNestedKey(queryable, [key], true);
        }
      } else {
        setNestedKey(queryable, [key], true);
      }
    }
  }

  return queryable;
}

export function getPath<T extends ZodObject<any>>(
  schema: T,
  parentKey: string[] = [],
  visited = new WeakSet(),
): Record<string, string> {
  if (visited.has(schema)) {
    return {};
  }

  visited.add(schema);

  const paths: Record<string, string> = {};
  for (const [key, value] of Object.entries(schema.shape)) {
    const fullKeyPath = [...parentKey, key];
    const v = value as any;

    if (!v) continue;

    if (v instanceof z.ZodLazy) {
      try {
        const lazyValue = v._def.getter();
        if (lazyValue instanceof z.ZodObject) {
          if (!visited.has(lazyValue)) {
            const nested = getPath(lazyValue, fullKeyPath, visited);
            Object.entries(nested).forEach(([nestedKey, nestedPath]) => {
              paths[`${key}.${nestedKey.split('.').pop()}`] = nestedPath;
            });
          }
          continue;
        } else if (
          lazyValue instanceof z.ZodArray &&
          lazyValue._def.type instanceof z.ZodObject
        ) {
          if (!visited.has(lazyValue._def.type)) {
            const nested = getPath(lazyValue._def.type, fullKeyPath, visited);
            Object.entries(nested).forEach(([nestedKey, nestedPath]) => {
              paths[`${key}.${nestedKey.split('.').pop()}`] = nestedPath;
              paths[nestedPath] = nestedPath;
            });
          }
          continue;
        }
      } catch (e) {
        continue;
      }
    }

    if (v instanceof z.ZodObject) {
      if (!visited.has(v)) {
        const nested = getPath(v, fullKeyPath, visited);
        Object.entries(nested).forEach(([nestedKey, nestedPath]) => {
          paths[nestedKey] = nestedPath;
          paths[`${key}.${nestedKey.split('.').pop()}`] = nestedPath;
        });
      }
      continue;
    }

    if (v instanceof z.ZodArray && v._def.type instanceof z.ZodObject) {
      if (!visited.has(v._def.type)) {
        const nested = getPath(v._def.type, fullKeyPath, visited);
        Object.entries(nested).forEach(([nestedKey, nestedPath]) => {
          paths[nestedKey] = nestedPath;
          paths[`${key}.${nestedKey.split('.').pop()}`] = nestedPath;
          paths[nestedPath] = nestedPath;
        });
      }
      continue;
    }

    if (typeof v.isPath === 'function' && v.isPath()) {
      const pathValue = v.description?.path;
      if (Array.isArray(pathValue)) {
        const fullKey = fullKeyPath.join('.');
        const fullPath = [...parentKey, ...pathValue].join('.');
        paths[fullKey] = fullPath;
      }
    } else {
      paths[key] = fullKeyPath.join('.');
    }
  }
  return paths;
}
