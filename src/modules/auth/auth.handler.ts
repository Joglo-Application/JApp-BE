import type { Handler } from 'hono';
import { success } from '@/shared/response';
import { UnauthorizedError } from '@/shared/errors';
import * as authService from './auth.service';
import type { AppBindings } from '@/types/hono';
import type { LoginInput, VerifyPinInput } from './auth.schema';

export const loginHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as LoginInput;
  const result = await authService.login(input);
  return c.json(success(result));
};

export const verifyPinHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as VerifyPinInput;
  const approver = await authService.verifyPin(input);
  return c.json(success({ valid: true, approver }));
};

export const meHandler: Handler<AppBindings> = async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    throw new UnauthorizedError();
  }
  const user = await authService.getCurrentUser(authUser.userId);
  return c.json(success(user));
};
