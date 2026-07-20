import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { success } from '@/shared/response';
import { BadRequestError } from '@/shared/errors';
import type { AppBindings } from '@/types/hono';

/** Direktori penyimpanan gambar, relatif terhadap root proses. */
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

const TIPE_DIIZINKAN: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAKS_BYTE = 5 * 1024 * 1024; // 5 MB

export const uploadRoutes = new Hono<AppBindings>();

uploadRoutes.use('*', authMiddleware);

/**
 * POST /upload — unggah satu gambar (field `file`), kembalikan URL publiknya.
 * Dipakai foto produk/menu; sebelumnya foto yang dipilih di FE tidak pernah
 * tersimpan karena belum ada endpoint ini.
 */
uploadRoutes.post('/', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || typeof file === 'string' || Array.isArray(file)) {
    throw new BadRequestError('Field "file" wajib diisi dengan sebuah berkas');
  }
  const ext = TIPE_DIIZINKAN[file.type];
  if (!ext) {
    throw new BadRequestError('Format gambar harus JPEG, PNG, atau WebP');
  }
  if (file.size > MAKS_BYTE) {
    throw new BadRequestError('Ukuran gambar maksimal 5 MB');
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const namaFile = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
  await writeFile(
    path.join(UPLOAD_DIR, namaFile),
    Buffer.from(await file.arrayBuffer()),
  );

  return c.json(success({ url: `/uploads/${namaFile}`, namaFile, ukuran: file.size }), 201);
});
