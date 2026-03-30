CREATE TABLE `finance` (
	`id` text PRIMARY KEY NOT NULL,
	`menu_smoothies` text NOT NULL,
	`produksi_botol` real DEFAULT 0 NOT NULL,
	`terjual` real DEFAULT 0 NOT NULL,
	`produk_sisa` real DEFAULT 0 NOT NULL,
	`harga_produk` real DEFAULT 0 NOT NULL,
	`tanggal_masuk` integer NOT NULL,
	`expired_date` integer NOT NULL,
	`mitra` text,
	`status` text DEFAULT 'Tersedia' NOT NULL,
	`total_payment` real DEFAULT 0 NOT NULL,
	`minus` real DEFAULT 0 NOT NULL,
	`pengeluaran` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `inventory` ADD `satuan` text DEFAULT 'Pcs' NOT NULL;