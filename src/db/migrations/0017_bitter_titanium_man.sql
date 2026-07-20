ALTER TABLE "stok_opname_item" ALTER COLUMN "bahan_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stok_opname_item" ADD COLUMN "sumber" "stok_sumber" DEFAULT 'stok_gudang' NOT NULL;--> statement-breakpoint
ALTER TABLE "stok_opname_item" ADD COLUMN "menu_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stok_opname_item" ADD CONSTRAINT "stok_opname_item_menu_id_menus_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("menu_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
