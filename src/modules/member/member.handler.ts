import type { Handler } from 'hono';
import { paginated, success } from '@/shared/response';
import * as service from './member.service';
import type { AdjustPoinInput, CreateMemberInput, UpdateMemberInput } from './member.schema';
import type { AppBindings } from '@/types/hono';

export const listTransaksiMemberHandler: Handler<AppBindings> = async (c) => {
  const data = await service.listTransaksiMember(Number(c.req.param('id')));
  return c.json(success(data));
};

export const listMemberHandler: Handler<AppBindings> = async (c) => {
  const q = c.req.query();
  const result = await service.listMember({
    page: Number(q.page ?? 1),
    limit: Number(q.limit ?? 10),
    q: q.q,
  });
  return c.json(paginated(result.data, result.pagination));
};

export const getMemberHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  return c.json(success(await service.getMemberById(id)));
};

export const createMemberHandler: Handler<AppBindings> = async (c) => {
  const input = (await c.req.json()) as CreateMemberInput;
  return c.json(success(await service.createMember(input)), 201);
};

export const updateMemberHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as UpdateMemberInput;
  return c.json(success(await service.updateMember(id, input)));
};

export const deleteMemberHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  await service.deleteMember(id);
  return c.json(success({ deleted: true }));
};

export const adjustPoinHandler: Handler<AppBindings> = async (c) => {
  const id = Number(c.req.param('id'));
  const input = (await c.req.json()) as AdjustPoinInput;
  return c.json(success(await service.adjustPoin(id, input)));
};
