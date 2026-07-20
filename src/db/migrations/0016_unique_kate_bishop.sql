CREATE TABLE IF NOT EXISTS "produksi_stok_item" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"produksi_id" integer NOT NULL,
	"menu_id" integer NOT NULL,
	"nama" varchar(100) NOT NULL,
	"jumlah" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stok_opname_item" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"opname_id" integer NOT NULL,
	"bahan_id" integer NOT NULL,
	"nama" varchar(100) NOT NULL,
	"stok_sistem" numeric(12, 3) NOT NULL,
	"stok_fisik" numeric(12, 3) NOT NULL,
	"selisih" numeric(12, 3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "produksi_stok" DROP CONSTRAINT "produksi_stok_menu_id_menus_menu_id_fk";
--> statement-breakpoint
ALTER TABLE "stok_opname" DROP CONSTRAINT "stok_opname_bahan_id_bahan_baku_bahan_id_fk";
--> statement-breakpoint
ALTER TABLE "produksi_stok" ADD COLUMN "status" "stok_dokumen_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "produksi_stok" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "stok_opname" ADD COLUMN "status" "stok_dokumen_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "stok_opname" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "produksi_stok_item" ADD CONSTRAINT "produksi_stok_item_produksi_id_produksi_stok_produksi_id_fk" FOREIGN KEY ("produksi_id") REFERENCES "public"."produksi_stok"("produksi_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "produksi_stok_item" ADD CONSTRAINT "produksi_stok_item_menu_id_menus_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("menu_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_opname_item" ADD CONSTRAINT "stok_opname_item_opname_id_stok_opname_opname_id_fk" FOREIGN KEY ("opname_id") REFERENCES "public"."stok_opname"("opname_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_opname_item" ADD CONSTRAINT "stok_opname_item_bahan_id_bahan_baku_bahan_id_fk" FOREIGN KEY ("bahan_id") REFERENCES "public"."bahan_baku"("bahan_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "produksi_stok" DROP COLUMN IF EXISTS "menu_id";--> statement-breakpoint
ALTER TABLE "produksi_stok" DROP COLUMN IF EXISTS "jumlah";--> statement-breakpoint
ALTER TABLE "stok_opname" DROP COLUMN IF EXISTS "bahan_id";--> statement-breakpoint
ALTER TABLE "stok_opname" DROP COLUMN IF EXISTS "stok_sistem";--> statement-breakpoint
ALTER TABLE "stok_opname" DROP COLUMN IF EXISTS "stok_fisik";--> statement-breakpoint
ALTER TABLE "stok_opname" DROP COLUMN IF EXISTS "selisih";