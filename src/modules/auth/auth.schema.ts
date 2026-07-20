import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50),
  password: z.string().min(6, 'Password minimal 6 karakter').max(100),
});

export const verifyPinSchema = z.object({
  pin: z.string().regex(/^\d{4,8}$/, 'PIN harus 4-8 digit angka'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyPinInput = z.infer<typeof verifyPinSchema>;
