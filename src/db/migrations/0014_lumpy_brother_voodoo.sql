DO $$ BEGIN
 CREATE TYPE "public"."stok_dokumen_status" AS ENUM('draft', 'posted', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."stok_sumber" AS ENUM('inventori', 'stok_gudang');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stok_keluar" (
	"stok_keluar_id" serial PRIMARY KEY NOT NULL,
	"kode" varchar(30) NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"catatan" text,
	"status" "stok_dokumen_status" DEFAULT 'draft' NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stok_keluar_item" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"stok_keluar_id" integer NOT NULL,
	"sumber" "stok_sumber" NOT NULL,
	"menu_id" integer,
	"bahan_id" integer,
	"nama" varchar(100) NOT NULL,
	"harga" integer DEFAULT 0 NOT NULL,
	"jumlah" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stok_masuk" (
	"stok_masuk_id" serial PRIMARY KEY NOT NULL,
	"kode" varchar(30) NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"supplier" varchar(100),
	"catatan" text,
	"status" "stok_dokumen_status" DEFAULT 'draft' NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stok_masuk_item" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"stok_masuk_id" integer NOT NULL,
	"sumber" "stok_sumber" NOT NULL,
	"menu_id" integer,
	"bahan_id" integer,
	"nama" varchar(100) NOT NULL,
	"jumlah" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "kategori_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_keluar" ADD CONSTRAINT "stok_keluar_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_keluar_item" ADD CONSTRAINT "stok_keluar_item_stok_keluar_id_stok_keluar_stok_keluar_id_fk" FOREIGN KEY ("stok_keluar_id") REFERENCES "public"."stok_keluar"("stok_keluar_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_keluar_item" ADD CONSTRAINT "stok_keluar_item_menu_id_menus_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("menu_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_keluar_item" ADD CONSTRAINT "stok_keluar_item_bahan_id_bahan_baku_bahan_id_fk" FOREIGN KEY ("bahan_id") REFERENCES "public"."bahan_baku"("bahan_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_masuk" ADD CONSTRAINT "stok_masuk_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_masuk_item" ADD CONSTRAINT "stok_masuk_item_stok_masuk_id_stok_masuk_stok_masuk_id_fk" FOREIGN KEY ("stok_masuk_id") REFERENCES "public"."stok_masuk"("stok_masuk_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_masuk_item" ADD CONSTRAINT "stok_masuk_item_menu_id_menus_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("menu_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_masuk_item" ADD CONSTRAINT "stok_masuk_item_bahan_id_bahan_baku_bahan_id_fk" FOREIGN KEY ("bahan_id") REFERENCES "public"."bahan_baku"("bahan_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "menus" ADD CONSTRAINT "menus_kategori_id_kategori_kategori_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."kategori"("kategori_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Backfill kategori menu: daftarkan nama kategori yang sudah dipakai ke tabel
-- master, lalu hubungkan tiap menu ke barisnya. Tanpa ini, menu lama baru
-- terhubung saat disimpan ulang satu per satu.
INSERT INTO "kategori" ("jenis", "nama")
SELECT DISTINCT 'menu'::"kategori_jenis", "kategori"
FROM "menus"
WHERE "kategori" IS NOT NULL AND "kategori" <> ''
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "menus" AS m
SET "kategori_id" = k."kategori_id"
FROM "kategori" AS k
WHERE k."jenis" = 'menu' AND k."nama" = m."kategori" AND m."kategori_id" IS NULL;
