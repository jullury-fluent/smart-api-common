import { z } from '../src/zod/extensions';
import { getQueryable } from '../src/helpers/utils';

describe('getQueryable', () => {
  describe('with simple schema', () => {
    it('should return empty object when no fields are queryable', () => {
      // Arrange
      const schema = z.object({
        id: z.string(),
        name: z.string(),
        age: z.number(),
        email: z.string().optional(),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({});
    });

    it('should return object with queryable fields', () => {
      // Arrange
      const schema = z.object({
        id: z.string(),
        name: z.string().queryable(),
        age: z.number().queryable(),
        isActive: z.boolean(),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({
        name: true,
        age: true,
      });
    });

    it('should handle mixed queryable and non-queryable fields', () => {
      // Arrange
      const schema = z.object({
        id: z.string().queryable(),
        name: z.string(),
        age: z.number().queryable(),
        isActive: z.boolean(),
        createdAt: z.date().queryable(),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({
        id: true,
        age: true,
        createdAt: true,
      });
    });
  });

  describe('with nested schema', () => {
    it('should handle nested objects with queryable fields', () => {
      // Arrange
      const schema = z.object({
        id: z.string(),
        name: z.string().queryable(),
        profile: z.object({
          bio: z.string().queryable(),
          website: z.string(),
          age: z.number().queryable(),
        }),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({
        name: true,
        profile: {
          bio: true,
          age: true,
        },
      });
    });

    it('should handle deeply nested objects', () => {
      // Arrange
      const schema = z.object({
        id: z.string(),
        user: z.object({
          name: z.string().queryable(),
          contact: z.object({
            email: z.string().queryable(),
            phone: z.string(),
            address: z.object({
              street: z.string().queryable(),
              city: z.string(),
              country: z.string().queryable(),
            }),
          }),
        }),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({
        user: {
          name: true,
          contact: {
            email: true,
            address: {
              street: true,
              country: true,
            },
          },
        },
      });
    });

    it('should not include empty nested objects', () => {
      // Arrange
      const schema = z.object({
        id: z.string(),
        name: z.string().queryable(),
        profile: z.object({
          // No queryable fields here
          bio: z.string(),
          website: z.string(),
          age: z.number(),
        }),
        settings: z.object({
          theme: z.string().queryable(),
          notifications: z.boolean(),
        }),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({
        name: true,
        settings: {
          theme: true,
        },
      });
      // Ensure profile is not included since it has no queryable fields
      expect(result).not.toHaveProperty('profile');
    });
  });

  describe('with complex schema structures', () => {
    it('should handle schemas with arrays', () => {
      // Arrange
      // Note: The getQueryable function doesn't process array items directly
      // This test verifies the current behavior
      const schema = z.object({
        id: z.string(),
        name: z.string().queryable(),
        tags: z.array(z.string()),
        items: z.array(
          z.object({
            id: z.string(),
            name: z.string().queryable(),
          }),
        ),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      // Currently, getQueryable doesn't process array items
      expect(result).toEqual({
        name: true,
      });
    });

    it('should handle schemas with enums', () => {
      // Arrange
      const schema = z.object({
        id: z.string(),
        name: z.string().queryable(),
        status: z.enum(['active', 'inactive', 'pending']).queryable(),
        role: z.enum(['admin', 'user', 'guest']),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({
        name: true,
        status: true,
      });
    });
  });

  describe('path mapping', () => {
    it('should handle path mapping', () => {
      // Arrange
      const schema = z.object({
        id: z.string(),
        name: z.string().queryable(),
        mail: z.string().queryable().path(['email']),
        profile: z.object({
          bio: z.string().queryable(),
          website: z.string(),
          age: z.number().queryable(),
        }),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({
        name: true,
        profile: {
          bio: true,
          age: true,
        },
        email: true,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty schema', () => {
      // Arrange
      const schema = z.object({});

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({});
    });

    it('should handle schema with only nested objects', () => {
      // Arrange
      const schema = z.object({
        profile: z.object({
          details: z.object({
            info: z.object({
              data: z.string().queryable(),
            }),
          }),
        }),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({
        profile: {
          details: {
            info: {
              data: true,
            },
          },
        },
      });
    });

    it('should handle schema with mixed field types', () => {
      // Arrange
      const schema = z.object({
        id: z.string(),
        name: z.string().queryable(),
        age: z.number().queryable(),
        isActive: z.boolean().queryable(),
        createdAt: z.date().queryable(),
        tags: z.array(z.string()),
        status: z.enum(['active', 'inactive']).queryable(),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      expect(result).toEqual({
        name: true,
        age: true,
        isActive: true,
        createdAt: true,
        status: true,
      });
    });

    it('should handle schema with ZodLazy fields that are not ZodObjects', () => {
      // Arrange
      const schema = z.object({
        id: z.string(),
        name: z.string().queryable(),
        // A lazy field that resolves to a string, not an object
        lazyString: z.lazy(() => z.string().queryable()),
        // A lazy field that resolves to a number, not an object
        lazyNumber: z.lazy(() => z.number()),
      });

      // Act
      const result = getQueryable(schema);

      // Assert
      // The getQueryable function only processes ZodObject instances in lazy fields
      // so the lazy fields should not be included in the result
      expect(result).toEqual({
        name: true,
      });
    });
  });
});
