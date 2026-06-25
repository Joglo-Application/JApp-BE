ALTER TABLE "menus" ADD COLUMN "royalty_point" integer;--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "is_produk_khusus" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "produk_khusus_mulai" date;--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "produk_khusus_selesai" date;--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "catatan" text;