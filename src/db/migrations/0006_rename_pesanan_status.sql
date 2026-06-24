-- Rename status pesanan (in-place, data lama otomatis ikut):
--   pending -> in_progress  (pesanan yang sedang diproses dapur)
--   held    -> pending      (draft yang diparkir)
-- Urutan penting agar tidak bentrok dengan nilai 'pending' yang sudah ada.
ALTER TYPE "public"."pesanan_status" RENAME VALUE 'pending' TO 'in_progress';--> statement-breakpoint
ALTER TYPE "public"."pesanan_status" RENAME VALUE 'held' TO 'pending';
