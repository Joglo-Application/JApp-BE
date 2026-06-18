ALTER TABLE "bahan_baku" ADD COLUMN "kategori" varchar(50);--> statement-breakpoint
ALTER TABLE "bahan_baku" ADD COLUMN "image_url" varchar(255);--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "stok" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "stok_minimum" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "image_url" varchar(255);