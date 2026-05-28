export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

export function success<T>(data: T, meta?: SuccessResponse<T>['meta']): SuccessResponse<T> {
  return meta !== undefined ? { success: true, data, meta } : { success: true, data };
}

export function paginated<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number },
): SuccessResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  };
}
