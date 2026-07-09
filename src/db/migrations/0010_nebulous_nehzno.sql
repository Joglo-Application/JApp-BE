CREATE TABLE IF NOT EXISTS "log_gudang" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"jenis" varchar(40) NOT NULL,
	"logs" text NOT NULL,
	"user_id" integer NOT NULL,
	"waktu" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "absensi" (
	"absensi_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"jam_masuk" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"jam_keluar" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "log_gudang" ADD CONSTRAINT "log_gudang_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "absensi" ADD CONSTRAINT "absensi_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_absensi_user_tanggal" ON "absensi" USING btree ("user_id","tanggal");