import { z } from 'zod';

const META_KEYS = {
  FILTERABLE: 'filterable',
  SORTABLE: 'sortable',
  QUERYABLE: 'queryable',
  path: 'path',
};

export type ZodTypeWithQueryable<T extends z.ZodTypeAny> = T & {
  filterable(value?: boolean): ZodTypeWithQueryable<T>;
  sortable(value?: boolean): ZodTypeWithQueryable<T>;
  queryable(value?: boolean): ZodTypeWithQueryable<T>;
  path(value?: string[]): ZodTypeWithQueryable<T>;
  isFilterable(): boolean;
  isSortable(): boolean;
  isQueryable(): boolean;
  isPath(): boolean;
};

function extendZodType<T extends z.ZodType>(
  schema: T,
): ZodTypeWithQueryable<T> {
  const extendedSchema = schema as ZodTypeWithQueryable<T>;

  extendedSchema.filterable = function (value = true) {
    const description = this.description || {};
    return extendZodType(
      this.describe({
        ...description,
        [META_KEYS.FILTERABLE]: value,
      }),
    );
  };

  extendedSchema.sortable = function (value = true) {
    const description = this.description || {};
    return extendZodType(
      this.describe({
        ...description,
        [META_KEYS.SORTABLE]: value,
      }),
    );
  };

  extendedSchema.queryable = function (value = true) {
    const description = this.description || {};
    return extendZodType(
      this.describe({
        ...description,
        [META_KEYS.QUERYABLE]: value,
      }),
    );
  };

  extendedSchema.path = function (value: string[] = []) {
    const description = this.description || {};
    return extendZodType(
      this.describe({
        ...description,
        [META_KEYS.path]: value,
      }),
    );
  };

  extendedSchema.isFilterable = function () {
    return !!this.description?.[META_KEYS.FILTERABLE];
  };

  extendedSchema.isSortable = function () {
    return !!this.description?.[META_KEYS.SORTABLE];
  };

  extendedSchema.isQueryable = function () {
    return !!this.description?.[META_KEYS.QUERYABLE];
  };

  extendedSchema.isPath = function () {
    return !!this.description?.[META_KEYS.path];
  };

  return extendedSchema;
}

type ExtendedZodTypes = {
  email(): ZodTypeWithQueryable<z.ZodString>;
  string(): ZodTypeWithQueryable<z.ZodString>;
  number(): ZodTypeWithQueryable<z.ZodNumber>;
  boolean(): ZodTypeWithQueryable<z.ZodBoolean>;
  date(): ZodTypeWithQueryable<z.ZodDate>;
  object<T extends z.ZodRawShape>(
    shape: T,
  ): ZodTypeWithQueryable<z.ZodObject<T>>;
  array<T extends z.ZodTypeAny>(schema: T): ZodTypeWithQueryable<z.ZodArray<T>>;
  enum<T extends [string, ...string[]]>(
    values: T,
  ): ZodTypeWithQueryable<z.ZodEnum<T>>;
  extend<T extends z.ZodType>(schema: T): ZodTypeWithQueryable<T>;
} & Omit<
  typeof z,
  'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'enum'
>;

const extendedZ = {
  ...z,
  email: () => extendZodType(z.string().email()),
  string: () => extendZodType(z.string()),
  number: () => extendZodType(z.number()),
  boolean: () => extendZodType(z.boolean()),
  date: () => extendZodType(z.date()),
  object: <T extends z.ZodRawShape>(shape: T) => extendZodType(z.object(shape)),
  array: <T extends z.ZodTypeAny>(schema: T) => extendZodType(z.array(schema)),
  enum: <T extends [string, ...string[]]>(values: T) =>
    extendZodType(z.enum(values)),
  extend: extendZodType,
} as ExtendedZodTypes & typeof z;

export { extendedZ as z };
