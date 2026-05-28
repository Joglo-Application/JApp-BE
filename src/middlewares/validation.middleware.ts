import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';
import { ValidationError } from '@/shared/errors';

type Target = 'json' | 'query' | 'param' | 'header' | 'form';

export function validate<T extends ZodSchema>(target: Target, schema: T) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new ValidationError('Validation failed', result.error.flatten());
    }
  });
}
