CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_trail` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`target_user` text,
	`old_data` text,
	`new_data` text,
	`ip_address` text,
	`action_type` text,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cash_flow` (
	`id` text PRIMARY KEY NOT NULL,
	`tipe_mutasi` text NOT NULL,
	`kategori` text NOT NULL,
	`nominal` real DEFAULT 0 NOT NULL,
	`keterangan` text NOT NULL,
	`tanggal` integer NOT NULL,
	`referensi_id` text,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`sku_id` text PRIMARY KEY NOT NULL,
	`batch_id` text,
	`nama_barang` text NOT NULL,
	`tanggal_masuk` integer NOT NULL,
	`stok_masuk` real DEFAULT 0 NOT NULL,
	`stok_keluar` real DEFAULT 0 NOT NULL,
	`stok_akhir` real DEFAULT 0 NOT NULL,
	`harga_satuan` real DEFAULT 0 NOT NULL,
	`total_nilai` real DEFAULT 0 NOT NULL,
	`expired_date` integer,
	`status` text DEFAULT 'Tersedia' NOT NULL,
	`catatan` text
);
--> statement-breakpoint
CREATE TABLE `restock_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`sku_id` text NOT NULL,
	`jumlah_beli` real DEFAULT 0 NOT NULL,
	`harga_total` real DEFAULT 0 NOT NULL,
	`tanggal` integer NOT NULL,
	`supplier` text,
	`keterangan` text,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`role` text DEFAULT 'Staff' NOT NULL,
	`status` integer DEFAULT true NOT NULL,
	`lastLogin` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
