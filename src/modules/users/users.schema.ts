import { z } from 'zod';

export const userRoleSchema = z.enum([
  'admin',
  'kasir',
  'owner',
  'dapur',
  'supervisor',
  'gudang',
]);

/** PIN persetujuan: 4-8 digit angka. */
const pinSchema = z
  .string()
  .regex(/^\d{4,8}$/, { message: 'PIN harus 4-8 digit angka' });

export const createUserSchema = z.object({
  namaUser: z.string().trim().min(1).max(100),
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username hanya boleh huruf, angka, dan underscore',
  }),
  password: z.string().min(6).max(100),
  email: z.string().trim().email({ message: 'Format email tidak valid' }).max(150).optional(),
  telepon: z.string().trim().max(30).optional(),
  pin: pinSchema.optional(),
  role: userRoleSchema.default('kasir'),
});

export const updateUserSchema = z
  .object({
    namaUser: z.string().trim().min(1).max(100).optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
    password: z.string().min(6).max(100).optional(),
    email: z.string().trim().email({ message: 'Format email tidak valid' }).max(150).optional(),
    telepon: z.string().trim().max(30).optional(),
    pin: pinSchema.optional(),
    role: userRoleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
