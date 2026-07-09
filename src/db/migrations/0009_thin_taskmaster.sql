CREATE TYPE "public"."shift_kas_jenis" AS ENUM('setoran', 'penarikan');--> statement-breakpoint
CREATE TYPE "public"."shift_kas_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shift_kas" (
	"shift_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"kas_awal" integer DEFAULT 0 NOT NULL,
	"status" "shift_kas_status" DEFAULT 'open' NOT NULL,
	"waktu_mulai" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"waktu_selesai" timestamp with time zone,
	"kas_akhir" integer,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shift_kas_entry" (
	"entry_id" serial PRIMARY KEY NOT NULL,
	"shift_id" integer NOT NULL,
	"jenis" "shift_kas_jenis" NOT NULL,
	"nama_transaksi" varchar(100) NOT NULL,
	"jumlah" integer NOT NULL,
	"catatan" text,
	"waktu" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shift_kas" ADD CONSTRAINT "shift_kas_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shift_kas_entry" ADD CONSTRAINT "shift_kas_entry_shift_id_shift_kas_shift_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift_kas"("shift_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
