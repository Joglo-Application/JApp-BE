import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import * as userService from './users.service';
import type { CreateUserInput, UpdateUserInput } from './users.schema';
import type { PaginationQuery } from '@/shared/pagination';
import type { AppBindings } from '@/types/hono';

export const listUsersHandler: Handler<AppBindings> = async (c) => {
  const query = c.req.query() as unknown as PaginationQuery;
  const result = await userService.listUsers({
    page: Number(query.page ?? 1),
    limit: Number(query.limit ?? 10),
    q: query.q,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getUserHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const user = await userService.getUserById(id);
  return c.json(success(user));
};

export const createUserHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateUserInput;
  const user = await userService.createUser(input, c.get('user')?.role);
  return c.json(success(user), 201);
};

export const updateUserHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as UpdateUserInput;
  const user = await userService.updateUser(id, input, c.get('user')?.role);
  return c.json(success(user));
};

export const deleteUserHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  await userService.deleteUser(id, c.get('user')?.role);
  return c.json(success({ deleted: true }));
};
