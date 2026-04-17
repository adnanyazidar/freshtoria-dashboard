"use server";

import { db } from "@/db";
import { inventoryTable, auditTrailTable, restockTransactionsTable, cashFlowTable } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Assuming we have some way to get current user session in actions
// e.g. using `auth` from better-auth or passing userId

// A basic generic uuid generator if not using crypto.randomUUID
function generateId() {
    return crypto.randomUUID();
}

export async function addInventoryItem(data: {
    namaBarang: string;
    satuan: string;
    hargaSatuan: number;
    stokMasuk: number;
    expiredDate?: Date;
    catatan?: string;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    const { namaBarang, satuan, hargaSatuan, stokMasuk, expiredDate, catatan } = data;

    const skuId = `SKU-${Date.now()}`;
    const totalNilai = stokMasuk * hargaSatuan;
    const status = stokMasuk > 2 ? "Tersedia" : "Hampir Habis";

    const newItem = {
        skuId,
        namaBarang,
        satuan: satuan || "Pcs",
        tanggalMasuk: new Date(),
        stokMasuk,
        stokKeluar: 0,
        stokAkhir: stokMasuk,
        hargaSatuan,
        totalNilai,
        expiredDate: expiredDate ?? null,
        status,
        catatan,
    };

    await db.transaction(async (tx) => {
        // 1. Insert item inventory
        await tx.insert(inventoryTable).values(newItem);

        // 2. Catat pengeluaran di cashFlow (Total Nilai = biaya pembelian bahan)
        await tx.insert(cashFlowTable).values({
            id: `CF-OUT-INV-${Date.now()}`,
            tipeMutasi: "PENGELUARAN",
            kategori: "RESTOCK_BAHAN",
            nominal: totalNilai,
            tanggal: new Date(),
            keterangan: `Pembelian bahan ${namaBarang} (${stokMasuk} ${satuan || 'unit'} × Rp ${hargaSatuan.toLocaleString('id-ID')})`,
            referensiId: `INV-${skuId}`,
            userId: userId,
        });

        // 3. Audit trail
        await tx.insert(auditTrailTable).values({
            id: generateId(),
            userId,
            action: "Create",
            entityType: "Inventory & Finance",
            newData: JSON.stringify(newItem),
            timestamp: new Date(),
        });
    });

    revalidatePath("/inventory");
    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true, skuId };
}

export async function updateInventoryStock(
    skuId: string,
    stokKeluar: number
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    const [item] = await db
        .select()
        .from(inventoryTable)
        .where(eq(inventoryTable.skuId, skuId));

    if (!item) throw new Error("Item not found");

    if (stokKeluar > item.stokAkhir) {
        throw new Error("Stok keluar tidak boleh melebihi stok tersedia.");
    }

    const updatedData = {
        stokKeluar: sql`${inventoryTable.stokKeluar} + ${stokKeluar}`,
        stokAkhir: sql`${inventoryTable.stokAkhir} - ${stokKeluar}`,
        // totalNilai: TIDAK diubah — hanya stok yang berubah
        status: sql`CASE WHEN ${inventoryTable.stokAkhir} - ${stokKeluar} > 2 THEN 'Tersedia' ELSE 'Hampir Habis' END`,
    };

    await db
        .update(inventoryTable)
        .set(updatedData)
        .where(eq(inventoryTable.skuId, skuId));

    await db.insert(auditTrailTable).values({
        id: generateId(),
        userId,
        action: "Update",
        entityType: "Inventory",
        oldData: JSON.stringify(item),
        newData: JSON.stringify({ stokKeluarDiproses: stokKeluar }),
        timestamp: new Date(),
    });

    revalidatePath("/inventory");
    return { success: true };
}

export async function updateInventoryItemData(
    skuId: string,
    data: {
        namaBarang: string;
        satuan: string;
        hargaSatuan: number;
        stokMasuk: number;
        stokKeluar: number;
        expiredDate?: Date | null;
        catatan?: string;
    }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    const [item] = await db
        .select()
        .from(inventoryTable)
        .where(eq(inventoryTable.skuId, skuId));

    if (!item) throw new Error("Item not found");

    // Recalculate if stok masuk/keluar changes since stok akhir depends on stokMasuk - stokKeluar
    const stokAkhir = data.stokMasuk - data.stokKeluar;
    if (stokAkhir < 0) {
        throw new Error("Stok masuk baru lebih kecil dari stok yang sudah keluar.");
    }

    const totalNilai = data.stokMasuk * data.hargaSatuan; // Nilai total selalu berdasarkan STOK MASUK, BUKAN stok akhir
    const status = stokAkhir > 2 ? "Tersedia" : "Hampir Habis";

    const updatedData = {
        namaBarang: data.namaBarang,
        satuan: data.satuan || "Pcs",
        hargaSatuan: data.hargaSatuan,
        stokMasuk: data.stokMasuk,
        stokKeluar: data.stokKeluar,
        stokAkhir,
        totalNilai,
        expiredDate: data.expiredDate,
        catatan: data.catatan,
        status,
    };

    const restockRecords = await db
        .select()
        .from(restockTransactionsTable)
        .where(eq(restockTransactionsTable.skuId, skuId));

    let totalRestockValue = 0;
    for (const rst of restockRecords) {
        totalRestockValue += rst.hargaTotal;
    }

    await db.transaction(async (tx) => {
        // 1. Update inventory item
        await tx.update(inventoryTable)
            .set(updatedData)
            .where(eq(inventoryTable.skuId, skuId))
            ;

        // 2. Reconcile Cash Flow: Hapus SEMUA pengeluaran kas lama untuk item ini (INV & EDIT)
        await tx.delete(cashFlowTable)
            .where(eq(cashFlowTable.referensiId, `INV-${skuId}`))
            ;
        await tx.delete(cashFlowTable)
            .where(eq(cashFlowTable.referensiId, `EDIT-${skuId}`))
            ;

        // 3. Buat SATU record pengeluaran baru yang akurat sesuai totalNilai terkini
        // Ini memastikan finance selalu 100% sinkron dengan stokMasuk * hargaSatuan
        const initialPurchaseValue = totalNilai - totalRestockValue;

        if (initialPurchaseValue > 0) {
            await tx.insert(cashFlowTable).values({
                id: `CF-OUT-INV-${Date.now()}`,
                tipeMutasi: "PENGELUARAN",
                kategori: "RESTOCK_BAHAN",
                nominal: initialPurchaseValue,
                tanggal: new Date(),
                keterangan: `Pembelian awal & penyesuaian bahan ${data.namaBarang} (Base Value)`,
                referensiId: `INV-${skuId}`, // Gunakan INV lagi sebagai source of truth tunggal
                userId: userId,
            });
        } else if (initialPurchaseValue < 0) {
            await tx.insert(cashFlowTable).values({
                id: `CF-IN-ADJ-${Date.now()}`,
                tipeMutasi: "PEMASUKAN",
                kategori: "LAINNYA",
                nominal: Math.abs(initialPurchaseValue),
                tanggal: new Date(),
                keterangan: `Penyesuaian turun harga bahan ${data.namaBarang}`,
                referensiId: `INV-${skuId}`,
                userId: userId,
            });
        }

        // 4. Audit trail
        await tx.insert(auditTrailTable).values({
            id: generateId(),
            userId,
            action: "Update Full",
            entityType: "Inventory & Finance",
            oldData: JSON.stringify(item),
            newData: JSON.stringify({ ...item, ...updatedData }),
            timestamp: new Date(),
        });
    });

    revalidatePath("/inventory");
    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true };
}

export async function deleteInventoryItem(skuId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    const [item] = await db
        .select()
        .from(inventoryTable)
        .where(eq(inventoryTable.skuId, skuId));

    if (!item) throw new Error("Item not found");

    // Cari semua restock transactions terkait SKU ini
    const restockRecords = await db
        .select()
        .from(restockTransactionsTable)
        .where(eq(restockTransactionsTable.skuId, skuId));

    await db.transaction(async (tx) => {
        // 1. Hapus semua cashFlow EDIT & INV terkait SKU
        await tx.delete(cashFlowTable)
            .where(eq(cashFlowTable.referensiId, `EDIT-${skuId}`))
            ;
        await tx.delete(cashFlowTable)
            .where(eq(cashFlowTable.referensiId, `INV-${skuId}`))
            ;

        // 2. Hapus semua cashFlow restock terkait SKU (via restockTransactionsTable)
        for (const rst of restockRecords) {
            await tx.delete(cashFlowTable)
                .where(eq(cashFlowTable.referensiId, rst.id))
                ;
        }

        // 3. Hapus semua restock transactions
        await tx.delete(restockTransactionsTable)
            .where(eq(restockTransactionsTable.skuId, skuId))
            ;

        // 4. Hapus item inventory
        await tx.delete(inventoryTable)
            .where(eq(inventoryTable.skuId, skuId))
            ;

        // 5. Audit trail
        await tx.insert(auditTrailTable).values({
            id: generateId(),
            userId,
            action: "Delete",
            entityType: "Inventory & Finance",
            oldData: JSON.stringify(item),
            timestamp: new Date(),
        });
    });

    revalidatePath("/inventory");
    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true };
}

export async function processRestock(
    skuId: string,
    jumlahBeli: number,
    hargaTotal: number,
    supplier: string,
    keterangan: string
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    if (jumlahBeli <= 0 || hargaTotal < 0) {
        throw new Error("Jumlah dan Harga Total harus valid (lebih dari 0).");
    }

    // Menggunakan Transaction agar kalau ada error di Restock, Cash Flow juga batal
    await db.transaction(async (tx) => {
        // 1. Ambil data stok barang terkini
        const itemResult = await tx
            .select()
            .from(inventoryTable)
            .where(eq(inventoryTable.skuId, skuId))
            ;

        const item = itemResult[0];

        if (!item) throw new Error("Barang tidak ditemukan di Inventory.");

        // 2. Kalkulasi ulang stok dan nilai inventory
        const stokMskBrtambah = item.stokMasuk + jumlahBeli;
        const stokAkhir = stokMskBrtambah - item.stokKeluar;
        const actualHargaTotal = jumlahBeli * item.hargaSatuan; // Use actual calculated value to match Inventory value
        const totalNilaiBaru = item.totalNilai + actualHargaTotal; 
        const status = stokAkhir > 2 ? "Tersedia" : "Hampir Habis";

        // 3. Update master barang (Inventory)
        await tx.update(inventoryTable)
            .set({
                stokMasuk: stokMskBrtambah,
                stokAkhir,
                totalNilai: totalNilaiBaru,
                status,
            })
            .where(eq(inventoryTable.skuId, skuId))
            ;

        // 4. Catat Riwayat Bukti Pembelian Bahan di Ledger Restock
        const restockId = `RST-${Date.now()}`;
        await tx.insert(restockTransactionsTable).values({
            id: restockId,
            skuId,
            jumlahBeli,
            hargaTotal: actualHargaTotal, // Use calculated to ensure consistency
            tanggal: new Date(),
            supplier: supplier || "N/A",
            keterangan: keterangan || "Restock bahan baku rutin",
            userId,
        });

        // 5. Catat Mutasi Keluar di Buku Besar Kas (Cash Flow)
        const mutasiId = `CF-OUT-${Date.now()}`;
        await tx.insert(cashFlowTable).values({
            id: mutasiId,
            tipeMutasi: "PENGELUARAN",
            kategori: "RESTOCK_BAHAN",
            nominal: actualHargaTotal, // Uang yang dibelanjakan kasir, strict match dengan Inventory
            tanggal: new Date(),
            keterangan: `Pembelian stok bahan ${item.namaBarang} (${jumlahBeli} unit)`,
            referensiId: restockId,
            userId,
        });

        // 6. Audit Logging (Standar)
        await tx.insert(auditTrailTable).values({
            id: generateId(),
            userId,
            action: "Restock Process",
            entityType: "Inventory & Finance",
            newData: JSON.stringify({ skuId, jumlahBeli, hargaTotal, mutasiId }),
            timestamp: new Date(),
        });
    });

    revalidatePath("/inventory");
    revalidatePath("/finance");
    revalidatePath("/"); // Update metrik dashboard
    return { success: true };
}

/**
 * Membatalkan proses restock berdasarkan ID Cash Flow nya.
 */
export async function revertRestockTransaction(cashFlowId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    // 1. Dapatkan referensi mutasi kasnya
    const [cashflowRecord] = await db
        .select()
        .from(cashFlowTable)
        .where(eq(cashFlowTable.id, cashFlowId));

    if (!cashflowRecord || !cashflowRecord.referensiId) {
        throw new Error("Data mutasi kas restock tidak ditemukan atau tidak memiliki referensi restock valid.");
    }

    const restockId = cashflowRecord.referensiId;

    // 2. Dapatkan data histori restock-nya
    const [restockRecord] = await db
        .select()
        .from(restockTransactionsTable)
        .where(eq(restockTransactionsTable.id, restockId));

    if (!restockRecord) {
        throw new Error("Histori transaksi restock terkait tidak ditemukan.");
    }

    const { skuId, jumlahBeli, hargaTotal } = restockRecord;

    // 3. Dapatkan data inventory aslinya
    const [inventoryRecord] = await db
        .select()
        .from(inventoryTable)
        .where(eq(inventoryTable.skuId, skuId));

    if (!inventoryRecord) {
        throw new Error("Data produk di inventory sudah tidak ada / terhapus secara asinkron.");
    }

    // 4. Validasi keamanan stok
    const newStokAkhir = inventoryRecord.stokAkhir - jumlahBeli;
    if (newStokAkhir < 0) {
        throw new Error(
            `Gagal membatalkan: Stok barang ini sudah terpakai/terjual. Sisa stok saat ini (${inventoryRecord.stokAkhir}) lebih sedikit dari jumlah restock yang ingin dibatalkan (${jumlahBeli}).`
        );
    }

    // 5. Hitung kalkulasi balik stoknya
    const newStokMasuk = inventoryRecord.stokMasuk - jumlahBeli;
    const newTotalNilai = newStokMasuk * inventoryRecord.hargaSatuan;
    const status = newStokAkhir > 2 ? "Tersedia" : "Hampir Habis";

    // 6. Eksekusi Atomik Database
    await db.transaction(async (tx) => {
        // Balikkan stok di master barang
        await tx.update(inventoryTable)
            .set({
                stokMasuk: newStokMasuk,
                stokAkhir: newStokAkhir,
                totalNilai: newTotalNilai,
                status,
            })
            .where(eq(inventoryTable.skuId, skuId))
            ;

        // Hapus history restocknya
        await tx.delete(restockTransactionsTable).where(eq(restockTransactionsTable.id, restockId));

        // Hapus mutasi pengeluarannya (Buku Kas otomatis menyesuaikan Saldo karena row-nya hilang)
        await tx.delete(cashFlowTable).where(eq(cashFlowTable.id, cashFlowId));

        // Catat di Audit Trail
        await tx.insert(auditTrailTable).values({
            id: generateId(),
            userId,
            action: "Revert Restock",
            entityType: "Inventory & Finance",
            oldData: JSON.stringify(restockRecord),
            newData: JSON.stringify({ reason: "Pembatalan User", mutasiDihapus: cashFlowId }),
            timestamp: new Date(),
        });
    });

    revalidatePath("/inventory");
    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true };
}
