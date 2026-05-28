import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().min(1).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function getPaginationParams(query: PaginationQuery): {
  page: number;
  limit: number;
  offset: number;
} {
  return {
    page: query.page,
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
  };
}
