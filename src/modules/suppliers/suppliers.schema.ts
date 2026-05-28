import { z } from 'zod';

export const createSupplierSchema = z.object({
  namaSupplier: z.string().trim().min(1).max(100),
  noTelp: z.string().trim().min(1).max(20).optional().nullable(),
  alamat: z.string().trim().min(1).optional().nullable(),
  email: z.string().trim().email().max(100).optional().nullable(),
});

export const updateSupplierSchema = z
  .object({
    namaSupplier: z.string().trim().min(1).max(100).optional(),
    noTelp: z.string().trim().min(1).max(20).optional().nullable(),
    alamat: z.string().trim().min(1).optional().nullable(),
    email: z.string().trim().email().max(100).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export const supplierIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
