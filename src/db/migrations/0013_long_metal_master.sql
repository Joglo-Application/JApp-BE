DO $$ BEGIN
 CREATE TYPE "public"."kategori_jenis" AS ENUM('menu', 'stok', 'stok_gudang');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pengaturan" (
	"grup" varchar(60) PRIMARY KEY NOT NULL,
	"nilai" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "area" (
	"area_id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(60) NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kategori" (
	"kategori_id" serial PRIMARY KEY NOT NULL,
	"jenis" "kategori_jenis" NOT NULL,
	"nama" varchar(60) NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "master_metode_pembayaran" (
	"metode_id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(60) NOT NULL,
	"kode" varchar(30) NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "produksi_stok" (
	"produksi_id" serial PRIMARY KEY NOT NULL,
	"kode" varchar(30) NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"menu_id" integer NOT NULL,
	"jumlah" integer NOT NULL,
	"catatan" text,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stok_opname" (
	"opname_id" serial PRIMARY KEY NOT NULL,
	"kode" varchar(30) NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"bahan_id" integer NOT NULL,
	"stok_sistem" numeric(12, 3) NOT NULL,
	"stok_fisik" numeric(12, 3) NOT NULL,
	"selisih" numeric(12, 3) NOT NULL,
	"catatan" text,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meja" ADD COLUMN "area_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "produksi_stok" ADD CONSTRAINT "produksi_stok_menu_id_menus_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("menu_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "produksi_stok" ADD CONSTRAINT "produksi_stok_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_opname" ADD CONSTRAINT "stok_opname_bahan_id_bahan_baku_bahan_id_fk" FOREIGN KEY ("bahan_id") REFERENCES "public"."bahan_baku"("bahan_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_opname" ADD CONSTRAINT "stok_opname_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_kategori_jenis_nama" ON "kategori" USING btree ("jenis","nama");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meja" ADD CONSTRAINT "meja_area_id_area_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("area_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
