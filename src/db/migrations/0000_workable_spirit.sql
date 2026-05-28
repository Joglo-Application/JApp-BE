CREATE TYPE "public"."user_role" AS ENUM('admin', 'kasir', 'owner');--> statement-breakpoint
CREATE TYPE "public"."pesanan_status" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."pesanan_bahan_status" AS ENUM('pending', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tipe_keluar" AS ENUM('sale', 'waste', 'damaged', 'expired', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."metode_pembayaran" AS ENUM('cash', 'qris', 'debit', 'transfer');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"nama_user" varchar(100) NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'kasir' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bahan_baku" (
	"bahan_id" serial PRIMARY KEY NOT NULL,
	"nama_bahan" varchar(100) NOT NULL,
	"satuan" varchar(20) NOT NULL,
	"stok" numeric(12, 3) DEFAULT '0' NOT NULL,
	"stok_minimum" numeric(12, 3) DEFAULT '0' NOT NULL,
	"harga_satuan" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"supplier_id" serial PRIMARY KEY NOT NULL,
	"nama_supplier" varchar(100) NOT NULL,
	"no_telp" varchar(20),
	"alamat" text,
	"email" varchar(100),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menus" (
	"menu_id" serial PRIMARY KEY NOT NULL,
	"nama_menu" varchar(100) NOT NULL,
	"kategori" varchar(50) NOT NULL,
	"harga" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resep_menu" (
	"resep_id" serial PRIMARY KEY NOT NULL,
	"menu_id" integer NOT NULL,
	"bahan_id" integer NOT NULL,
	"jumlah_pakai" numeric(12, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pesanan" (
	"pesanan_id" serial PRIMARY KEY NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"status" "pesanan_status" DEFAULT 'pending' NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "detail_pesanan" (
	"detail_id" serial PRIMARY KEY NOT NULL,
	"jumlah" integer NOT NULL,
	"harga_satuan" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"pesanan_id" integer NOT NULL,
	"menu_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pesanan_bahan" (
	"pesanan_bahan_id" serial PRIMARY KEY NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"jumlah" numeric(12, 3) NOT NULL,
	"status" "pesanan_bahan_status" DEFAULT 'pending' NOT NULL,
	"bahan_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaksi_bahan_masuk" (
	"transaksi_masuk_id" serial PRIMARY KEY NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"jumlah" numeric(12, 3) NOT NULL,
	"harga_satuan" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"pesanan_bahan_id" integer,
	"bahan_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaksi_bahan_keluar" (
	"transaksi_keluar_id" serial PRIMARY KEY NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"jumlah" numeric(12, 3) NOT NULL,
	"tipe_keluar" "tipe_keluar" NOT NULL,
	"keterangan" text,
	"bahan_id" integer NOT NULL,
	"pesanan_id" integer,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pembayaran" (
	"pembayaran_id" serial PRIMARY KEY NOT NULL,
	"tanggal" date DEFAULT CURRENT_DATE NOT NULL,
	"metode" "metode_pembayaran" NOT NULL,
	"jumlah_bayar" integer NOT NULL,
	"kembalian" integer DEFAULT 0 NOT NULL,
	"pesanan_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "pembayaran_pesanan_id_unique" UNIQUE("pesanan_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resep_menu" ADD CONSTRAINT "resep_menu_menu_id_menus_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("menu_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resep_menu" ADD CONSTRAINT "resep_menu_bahan_id_bahan_baku_bahan_id_fk" FOREIGN KEY ("bahan_id") REFERENCES "public"."bahan_baku"("bahan_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "detail_pesanan" ADD CONSTRAINT "detail_pesanan_pesanan_id_pesanan_pesanan_id_fk" FOREIGN KEY ("pesanan_id") REFERENCES "public"."pesanan"("pesanan_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "detail_pesanan" ADD CONSTRAINT "detail_pesanan_menu_id_menus_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("menu_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pesanan_bahan" ADD CONSTRAINT "pesanan_bahan_bahan_id_bahan_baku_bahan_id_fk" FOREIGN KEY ("bahan_id") REFERENCES "public"."bahan_baku"("bahan_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pesanan_bahan" ADD CONSTRAINT "pesanan_bahan_supplier_id_suppliers_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("supplier_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pesanan_bahan" ADD CONSTRAINT "pesanan_bahan_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaksi_bahan_masuk" ADD CONSTRAINT "transaksi_bahan_masuk_pesanan_bahan_id_pesanan_bahan_pesanan_bahan_id_fk" FOREIGN KEY ("pesanan_bahan_id") REFERENCES "public"."pesanan_bahan"("pesanan_bahan_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaksi_bahan_masuk" ADD CONSTRAINT "transaksi_bahan_masuk_bahan_id_bahan_baku_bahan_id_fk" FOREIGN KEY ("bahan_id") REFERENCES "public"."bahan_baku"("bahan_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaksi_bahan_masuk" ADD CONSTRAINT "transaksi_bahan_masuk_supplier_id_suppliers_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("supplier_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaksi_bahan_masuk" ADD CONSTRAINT "transaksi_bahan_masuk_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaksi_bahan_keluar" ADD CONSTRAINT "transaksi_bahan_keluar_bahan_id_bahan_baku_bahan_id_fk" FOREIGN KEY ("bahan_id") REFERENCES "public"."bahan_baku"("bahan_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaksi_bahan_keluar" ADD CONSTRAINT "transaksi_bahan_keluar_pesanan_id_pesanan_pesanan_id_fk" FOREIGN KEY ("pesanan_id") REFERENCES "public"."pesanan"("pesanan_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaksi_bahan_keluar" ADD CONSTRAINT "transaksi_bahan_keluar_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_pesanan_id_pesanan_pesanan_id_fk" FOREIGN KEY ("pesanan_id") REFERENCES "public"."pesanan"("pesanan_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_menu_bahan" ON "resep_menu" USING btree ("menu_id","bahan_id");