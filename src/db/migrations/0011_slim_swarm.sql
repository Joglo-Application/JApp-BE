CREATE TABLE IF NOT EXISTS "promo" (
	"promo_id" serial PRIMARY KEY NOT NULL,
	"kode" varchar(30) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"tipe" "diskon_tipe" NOT NULL,
	"nilai" numeric(12, 2) NOT NULL,
	"min_belanja" integer DEFAULT 0 NOT NULL,
	"max_diskon" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"mulai" date,
	"berakhir" date,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "promo_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(150);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telepon" varchar(30);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin" varchar(255);--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "track_stok" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "retur_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "retur_alasan" text;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "retur_user_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_retur_user_id_users_user_id_fk" FOREIGN KEY ("retur_user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
