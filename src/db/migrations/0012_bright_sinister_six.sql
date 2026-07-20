CREATE TYPE "public"."loyalty_tipe" AS ENUM('diskon', 'produk_gratis');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_reward" (
	"reward_id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"tipe" "loyalty_tipe" NOT NULL,
	"poin" integer NOT NULL,
	"diskon_tipe" "diskon_tipe",
	"diskon_nilai" numeric(12, 2),
	"menu_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reservasi" (
	"reservasi_id" serial PRIMARY KEY NOT NULL,
	"meja_id" integer NOT NULL,
	"nama_pemesan" varchar(100) NOT NULL,
	"no_telp" varchar(20),
	"waktu_reservasi" timestamp with time zone NOT NULL,
	"jumlah_tamu" integer DEFAULT 1 NOT NULL,
	"catatan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "jumlah_tamu" integer;--> statement-breakpoint
ALTER TABLE "detail_pesanan" ADD COLUMN "selesai" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loyalty_reward" ADD CONSTRAINT "loyalty_reward_menu_id_menus_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("menu_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_meja_id_meja_meja_id_fk" FOREIGN KEY ("meja_id") REFERENCES "public"."meja"("meja_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
