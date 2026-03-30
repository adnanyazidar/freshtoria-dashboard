"use server";

import { db } from "@/db";
import { financeTable, auditTrailTable, cashFlowTable } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function generateId() {
    return crypto.randomUUID();
}

/**
 * Mencatat Data Produksi Jus Baru (Running Total Logic)
 */
export async function addJuiceProduction(data: {
    menuSmoothies: string;
    produksiBotol: number;
    hargaProduk: number;
    tanggalMasuk: Date;
    expiredDate: Date;
    mitra: string;
    pengeluaran: number;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;
    const productionId = `JPROD-${Date.now()}`;

    // Auto-calculated fields for new batch
    const terjual = 0;
    const produkSisa = data.produksiBotol;
    const totalPayment = 0;
    const minus = data.produksiBotol * data.hargaProduk; // Assumed potential loss until sold
    const status = "Not Payment"; // Default status payment

    const newProduction = {
        id: productionId,
        menuSmoothies: data.menuSmoothies,
        produksiBotol: data.produksiBotol,
        terjual,
        produkSisa,
        hargaProduk: data.hargaProduk,
        tanggalMasuk: data.tanggalMasuk,
        expiredDate: data.expiredDate,
        mitra: data.mitra,
        status,
        totalPayment,
        minus,
        pengeluaran: data.pengeluaran,
    };

    await db.transaction((tx) => {
        // 1. Catat di tabel produksi jus
        tx.insert(financeTable).values(newProduction).run();

        // 2. (REMOVED) Sesuai feedback, pengeluaran produksi tidak lagi dimasukkan ke cashFlowTable (OUT).
        // Pengeluaran di buku kas hanya untuk menu Inventory (Restock).

        // 3. Catat ke Audit Trail
        tx.insert(auditTrailTable).values({
            id: generateId(),
            userId: userId,
            action: "Create",
            entityType: "Juice Production",
            newData: JSON.stringify(newProduction),
            timestamp: new Date(),
        }).run();
    });

    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true, productionId };
}

/**
 * Hapus Data Produksi Jus
 */
export async function deleteJuiceProduction(id: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    const recordResult = db.select().from(financeTable).where(eq(financeTable.id, id)).all();
    const record = recordResult[0];

    if (!record) throw new Error("Data Produksi Jus tidak ditemukan");

    db.transaction((tx) => {
        tx.delete(financeTable).where(eq(financeTable.id, id)).run();

        // Catatan kas tidak lagi dihapus di sini karena produksi sudah tidak masuk kas.
        // Penjualan (SALE) masuk kas, tapi secara aturan akuntansi sistem ini, jika sudah terjual tidak bisa dihapus produksinya.

        tx.insert(auditTrailTable).values({
            id: generateId(),
            userId,
            action: "Delete",
            entityType: "Juice Production",
            oldData: JSON.stringify(record),
            timestamp: new Date(),
        }).run();
    });

    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true };
}

/**
 * Update Data Produksi Jus (Menjaga Running Total yg sudah ada)
 */
export async function updateJuiceProduction(
    id: string,
    data: {
        menuSmoothies: string;
        produksiBotol: number;
        hargaProduk: number;
        tanggalMasuk: Date;
        expiredDate: Date;
        mitra: string;
        pengeluaran: number;
        status: string;
    }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;
    const recordResult = db.select().from(financeTable).where(eq(financeTable.id, id)).all();
    const record = recordResult[0];

    if (!record) throw new Error("Data Produksi Jus tidak ditemukan");

    // Recalculate based on existing terjual (running total)
    const newProdukSisa = data.produksiBotol - record.terjual;
    if (newProdukSisa < 0) {
        throw new Error("Jumlah produksi tidak boleh lebih kecil dari jumlah yang sudah terjual.");
    }
    const newMinus = newProdukSisa * data.hargaProduk;
    const newTotalPayment = record.terjual * data.hargaProduk; // Adjustment in case hargaProduk changed

    const newStatus = data.status || record.status;

    const updatedData = {
        menuSmoothies: data.menuSmoothies,
        produksiBotol: data.produksiBotol,
        terjual: record.terjual, // keep running total
        produkSisa: newProdukSisa,
        hargaProduk: data.hargaProduk,
        tanggalMasuk: data.tanggalMasuk,
        expiredDate: data.expiredDate,
        mitra: data.mitra,
        status: newStatus,
        totalPayment: newTotalPayment,
        minus: newMinus,
        pengeluaran: data.pengeluaran,
    };

    await db.transaction((tx) => {
        tx.update(financeTable).set(updatedData).where(eq(financeTable.id, id)).run();

        // Rekonsiliasi Cash Flow:
        // Cash Flow IN / OUT untuk record produksi sudah dihilangkan.
    });

    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true };
}

/**
 * Mencatat Transaksi Penjualan (Jual)
 */
export async function sellJuiceProduction(id: string, qtySold: number) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    const recordResult = db.select().from(financeTable).where(eq(financeTable.id, id)).all();
    const record = recordResult[0];

    if (!record) throw new Error("Data Produksi Jus tidak ditemukan");
    if (qtySold <= 0) throw new Error("Jumlah terjual harus lebih dari 0");
    if (qtySold > record.produkSisa) throw new Error(`Jumlah terjual (${qtySold}) melebihi sisa stok (${record.produkSisa})`);

    const incomeFromSale = qtySold * record.hargaProduk;

    await db.transaction((tx) => {
        tx.update(financeTable).set({
            terjual: sql`${financeTable.terjual} + ${qtySold}`,
            produkSisa: sql`${financeTable.produkSisa} - ${qtySold}`,
            totalPayment: sql`${financeTable.totalPayment} + ${incomeFromSale}`,
            minus: sql`${financeTable.minus} - ${incomeFromSale}`,
            status: "Success Payment"
        }).where(eq(financeTable.id, id)).run();

        // Catat Pemasukan Buku Kas (Pendapatan kotor dimasukkan ke kas)
        tx.insert(cashFlowTable).values({
            id: `CF-IN-${Date.now()}-SALE`,
            tipeMutasi: "PEMASUKAN",
            kategori: "PENJUALAN",
            nominal: incomeFromSale,
            tanggal: new Date(),
            keterangan: `Penjualan ${qtySold} botol ${record.menuSmoothies}`,
            referensiId: id,
            userId: userId,
        }).run();

        tx.insert(auditTrailTable).values({
            id: generateId(),
            userId: userId,
            action: "Sell",
            entityType: "Juice Production",
            oldData: JSON.stringify(record),
            newData: JSON.stringify({ qtySold, incomeFromSale }),
            timestamp: new Date(),
        }).run();
    });

    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true };
}
