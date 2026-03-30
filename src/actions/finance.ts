"use server";

import { db } from "@/db";
import { cashFlowTable, auditTrailTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function generateId() {
    return crypto.randomUUID();
}

/**
 * Mencatat Mutasi Kas Baru (Manual Input dari halaman Finance)
 */
export async function addCashFlowRecord(data: {
    tipeMutasi: "PEMASUKAN" | "PENGELUARAN";
    kategori: string;
    nominal: number;
    keterangan: string;
    tanggal: Date;
    referensiId?: string;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;
    const mutasiId = `CF-${data.tipeMutasi === "PEMASUKAN" ? "IN" : "OUT"}-${Date.now()}`;

    const newMutation = {
        id: mutasiId,
        tipeMutasi: data.tipeMutasi,
        kategori: data.kategori,
        nominal: data.nominal,
        keterangan: data.keterangan,
        tanggal: data.tanggal,
        referensiId: data.referensiId || null,
        userId: userId,
    };

    await db.insert(cashFlowTable).values(newMutation);

    await db.insert(auditTrailTable).values({
        id: generateId(),
        userId: userId,
        action: "Create",
        entityType: "Cash Flow",
        newData: JSON.stringify(newMutation),
        timestamp: new Date(),
    });

    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true, mutasiId };
}

/**
 * Update Catatan Transaksi Kas
 */
export async function updateCashFlowRecord(
    id: string,
    data: {
        tipeMutasi: "PEMASUKAN" | "PENGELUARAN";
        kategori: string;
        nominal: number;
        keterangan: string;
        tanggal: Date;
    }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;
    const [record] = await db
        .select()
        .from(cashFlowTable)
        .where(eq(cashFlowTable.id, id));

    if (!record) throw new Error("Catatan kas tidak ditemukan");

    // Tidak boleh update mutasi otomatis yang digenerate oleh Restock / Penjualan sistem
    if (record.referensiId && record.referensiId.startsWith("RST-")) {
        throw new Error("Mutasi kas ini digenerate otomatis oleh pembelian Inventory. Tidak bisa diubah manual lewat Finance.");
    }

    const updatedData = {
        tipeMutasi: data.tipeMutasi,
        kategori: data.kategori,
        nominal: data.nominal,
        keterangan: data.keterangan,
        tanggal: data.tanggal,
    };

    await db
        .update(cashFlowTable)
        .set(updatedData)
        .where(eq(cashFlowTable.id, id));

    await db.insert(auditTrailTable).values({
        id: generateId(),
        userId,
        action: "Update Full",
        entityType: "Cash Flow",
        oldData: JSON.stringify(record),
        newData: JSON.stringify({ ...record, ...updatedData }),
        timestamp: new Date(),
    });

    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true };
}

/**
 * Hapus Catatan Mutasi Kas (termasuk log Sistem)
 */
export async function deleteCashFlowRecord(id: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;
    const [record] = await db
        .select()
        .from(cashFlowTable)
        .where(eq(cashFlowTable.id, id));

    if (!record) throw new Error("Catatan kas tidak ditemukan");

    // Jika ini adalah record restock otomatis (Sistem), lakukan revert inventory
    if (record.referensiId && record.referensiId.startsWith("RST-")) {
        // Import dan gunakan logika revert restock yang sudah ada
        const { revertRestockTransaction } = await import("./inventory");
        await revertRestockTransaction(id);
        return { success: true };
    }

    // Untuk record lainnya (EDIT-*, SALE, manual), langsung hapus
    await db.delete(cashFlowTable).where(eq(cashFlowTable.id, id));

    await db.insert(auditTrailTable).values({
        id: generateId(),
        userId,
        action: "Delete",
        entityType: "Cash Flow",
        oldData: JSON.stringify(record),
        timestamp: new Date(),
    });

    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true };
}
