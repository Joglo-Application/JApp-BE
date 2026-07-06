CREATE TABLE IF NOT EXISTS "log_transaksi" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"tipe" varchar(40) NOT NULL,
	"kode_transaksi" varchar(50) NOT NULL,
	"deskripsi" text NOT NULL,
	"waktu" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "log_transaksi" ADD CONSTRAINT "log_transaksi_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
