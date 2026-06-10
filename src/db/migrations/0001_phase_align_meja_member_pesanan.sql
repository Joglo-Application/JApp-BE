CREATE TYPE "public"."meja_status" AS ENUM('available', 'occupied', 'reserved');--> statement-breakpoint
CREATE TYPE "public"."poin_tipe" AS ENUM('earn', 'redeem', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."diskon_tipe" AS ENUM('amount', 'percent');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('dine_in', 'take_away', 'gofood', 'grabfood', 'shopeefood');--> statement-breakpoint
ALTER TYPE "public"."metode_pembayaran" ADD VALUE 'qris_netzme';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meja" (
	"meja_id" serial PRIMARY KEY NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"zona" varchar(50),
	"kapasitas" integer DEFAULT 4 NOT NULL,
	"status" "meja_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member" (
	"member_id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"no_telp" varchar(20),
	"email" varchar(100),
	"poin" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_poin_log" (
	"poin_log_id" serial PRIMARY KEY NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"tipe" "poin_tipe" NOT NULL,
	"poin" integer NOT NULL,
	"member_id" integer NOT NULL,
	"pesanan_id" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "detail_pesanan" ALTER COLUMN "menu_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "subtotal" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "service_charge" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "pajak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "diskon" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "diskon_tipe" "diskon_tipe";--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "diskon_nilai" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "promo_nama" varchar(100);--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "order_type" "order_type";--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "customer_nama" varchar(100);--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "catatan" text;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "meja_id" integer;--> statement-breakpoint
ALTER TABLE "pesanan" ADD COLUMN "member_id" integer;--> statement-breakpoint
ALTER TABLE "detail_pesanan" ADD COLUMN "diskon" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "detail_pesanan" ADD COLUMN "catatan" text;--> statement-breakpoint
ALTER TABLE "detail_pesanan" ADD COLUMN "nama_custom" varchar(100);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_poin_log" ADD CONSTRAINT "member_poin_log_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_poin_log" ADD CONSTRAINT "member_poin_log_pesanan_id_pesanan_pesanan_id_fk" FOREIGN KEY ("pesanan_id") REFERENCES "public"."pesanan"("pesanan_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_member_no_telp" ON "member" USING btree ("no_telp");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_meja_id_meja_meja_id_fk" FOREIGN KEY ("meja_id") REFERENCES "public"."meja"("meja_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_member_id_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("member_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
