import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
    image: text("image"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    // custom fields for custom role/status?
    role: text("role").default("Staff").notNull(), // Admin, Staff
    status: integer("status", { mode: "boolean" }).default(true).notNull(), // true=Aktif, false=Non-Aktif
    lastLogin: integer("lastLogin", { mode: "timestamp" }),
});

export const sessionTable = sqliteTable("session", {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
        .notNull()
        .references(() => usersTable.id),
});

export const accountTable = sqliteTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
        .notNull()
        .references(() => usersTable.id),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verificationTable = sqliteTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }),
    updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

export const inventoryTable = sqliteTable("inventory", {
    skuId: text("sku_id").primaryKey(),
    batchId: text("batch_id"),
    namaBarang: text("nama_barang").notNull(),
    satuan: text("satuan").notNull().default("Pcs"),
    tanggalMasuk: integer("tanggal_masuk", { mode: "timestamp" }).notNull(),
    stokMasuk: real("stok_masuk").notNull().default(0),
    stokKeluar: real("stok_keluar").notNull().default(0),
    stokAkhir: real("stok_akhir").notNull().default(0),
    hargaSatuan: real("harga_satuan").notNull().default(0),
    totalNilai: real("total_nilai").notNull().default(0),
    expiredDate: integer("expired_date", { mode: "timestamp" }),
    status: text("status").notNull().default("Tersedia"), // 'Hampir Habis' / 'Tersedia'
    catatan: text("catatan"),
});

export const restockTransactionsTable = sqliteTable("restock_transactions", {
    id: text("id").primaryKey(),
    skuId: text("sku_id").notNull(),
    jumlahBeli: real("jumlah_beli").notNull().default(0),
    hargaTotal: real("harga_total").notNull().default(0),
    tanggal: integer("tanggal", { mode: "timestamp" }).notNull(),
    supplier: text("supplier"),
    keterangan: text("keterangan"),
    userId: text("user_id").notNull(), // Siapa yang merestock
});

export const cashFlowTable = sqliteTable("cash_flow", {
    id: text("id").primaryKey(),
    tipeMutasi: text("tipe_mutasi").notNull(), // 'PEMASUKAN' | 'PENGELUARAN'
    kategori: text("kategori").notNull(), // 'PENJUALAN', 'RESTOCK_BAHAN', 'OPERASIONAL', 'LAINNYA'
    nominal: real("nominal").notNull().default(0),
    keterangan: text("keterangan").notNull(),
    tanggal: integer("tanggal", { mode: "timestamp" }).notNull(),
    referensiId: text("referensi_id"), // NULL untuk general. Atau ID dari restock/penjualan.
    userId: text("user_id").notNull(),
});

export const financeTable = sqliteTable("finance", {
    id: text("id").primaryKey(),
    menuSmoothies: text("menu_smoothies").notNull(),
    produksiBotol: real("produksi_botol").notNull().default(0),
    terjual: real("terjual").notNull().default(0),
    produkSisa: real("produk_sisa").notNull().default(0),
    hargaProduk: real("harga_produk").notNull().default(0),
    tanggalMasuk: integer("tanggal_masuk", { mode: "timestamp" }).notNull(),
    expiredDate: integer("expired_date", { mode: "timestamp" }).notNull(),
    mitra: text("mitra"),
    status: text("status").notNull().default("Tersedia"), // 'Tersedia' | 'Habis' | 'Expired'
    totalPayment: real("total_payment").notNull().default(0),
    minus: real("minus").notNull().default(0),
    pengeluaran: real("pengeluaran").notNull().default(0),
});

export const auditTrailTable = sqliteTable("audit_trail", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    action: text("action").notNull(), // Create, Update, Delete
    entityType: text("entity_type").notNull(), // Inventory, Finance, User Management
    targetUser: text("target_user"), // if changing user
    oldData: text("old_data"), // JSON
    newData: text("new_data"), // JSON
    ipAddress: text("ip_address"),
    actionType: text("action_type"), // LOGIN_SUCCESS, etc.
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});
