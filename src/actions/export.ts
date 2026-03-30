"use server";

import { db } from "@/db";
import { inventoryTable, cashFlowTable, financeTable, auditTrailTable, usersTable } from "@/db/schema";
import { eq, or, like, desc, and } from "drizzle-orm";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

export async function getInventoryExportData({ q, status }: { q?: string; status?: string }) {
    const conditions = [];
    if (q) {
        conditions.push(
            or(
                like(inventoryTable.namaBarang, `%${q}%`),
                like(inventoryTable.skuId, `%${q}%`)
            )
        );
    }
    if (status && status !== "Semua") {
        conditions.push(eq(inventoryTable.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select().from(inventoryTable).where(whereClause);

    return data.map((item) => ({
        skuId: item.skuId,
        batchId: item.batchId || "",
        name: item.namaBarang,
        entryDate: format(item.tanggalMasuk, "dd/MM/yyyy"),
        stockIn: item.stokMasuk,
        stockOut: item.stokKeluar,
        stockFinal: item.stokAkhir,
        unitPrice: item.hargaSatuan,
        totalValue: item.stokAkhir * item.hargaSatuan,
        expiredDate: item.expiredDate ? format(item.expiredDate, "dd/MM/yyyy") : "-",
        status: item.status,
        note: item.catatan || ""
    }));
}

export async function getCashFlowExportData({ q, status }: { q?: string; status?: string }) {
    const conditions = [];
    if (q) {
        conditions.push(
            or(
                like(cashFlowTable.kategori, `%${q}%`),
                like(cashFlowTable.keterangan, `%${q}%`)
            )
        );
    }
    if (status && status !== "Semua") {
        conditions.push(eq(cashFlowTable.tipeMutasi, status as "PEMASUKAN" | "PENGELUARAN"));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
        .select()
        .from(cashFlowTable)
        .where(whereClause)
        .orderBy(desc(cashFlowTable.tanggal));

    return data.map((trx) => ({
        id: trx.id,
        menu: trx.kategori,
        produksi: 0,
        terjual: 0,
        hargaProduk: trx.nominal,
        tanggalMasuk: format(trx.tanggal, "dd/MM/yyyy"),
        expiredDate: "-",
        mitra: trx.tipeMutasi,
        paymentStatus: trx.referensiId ? "Sistem" : "Manual",
        catatan: trx.keterangan || "",
    }));
}

export async function getJuiceProductionExportData({ q }: { q?: string; }) {
    const conditions = [];
    if (q) {
        conditions.push(
            or(
                like(financeTable.menuSmoothies, `%${q}%`),
                like(financeTable.mitra, `%${q}%`)
            )
        );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
        .select()
        .from(financeTable)
        .where(whereClause)
        .orderBy(desc(financeTable.tanggalMasuk));

    return data.map((prod) => ({
        ...prod,
        tanggalMasuk: format(prod.tanggalMasuk, "dd/MM/yyyy"),
        expiredDate: format(prod.expiredDate, "dd/MM/yyyy"),
    }));
}

export async function getAuditLogExportData({ q, module }: { q?: string; module?: string }) {
    const conditions = [];

    // Module filter
    if (module && module !== "Semua") {
        conditions.push(eq(auditTrailTable.entityType, module));
    }

    // We fetch and join, search filtering happens locally since we need user name which is joined
    // For simplicity in export and large queries, we fetch all that matches module and filter by q in memory 
    // or we can build the query with a join. Let's do the joined query:
    const query = db
        .select({
            id: auditTrailTable.id,
            action: auditTrailTable.action,
            module: auditTrailTable.entityType,
            timestamp: auditTrailTable.timestamp,
            userId: auditTrailTable.userId,
            oldData: auditTrailTable.oldData,
            newData: auditTrailTable.newData,
            ip: auditTrailTable.ipAddress,
            userName: usersTable.name
        })
        .from(auditTrailTable)
        .leftJoin(usersTable, eq(auditTrailTable.userId, usersTable.id))
        .orderBy(desc(auditTrailTable.timestamp));

    let results = await query;
    if (module && module !== "Semua") {
        results = results.filter(r => r.module === module);
    }
    if (q) {
        const lowerQ = q.toLowerCase();
        results = results.filter(r =>
            (r.userName && r.userName.toLowerCase().includes(lowerQ)) ||
            r.action.toLowerCase().includes(lowerQ)
        );
    }

    return results.map(log => {
        let details = "-";
        if (log.action === "Create" || log.action === "Delete") {
            details = log.action === "Create" ? `Menambahkan data baru` : `Menghapus data`;
        } else if (log.action.includes("Update")) {
            details = `Memperbarui data`;
        }

        return {
            id: log.id,
            time: format(log.timestamp, "dd/MM/yyyy HH:mm:ss"),
            user: log.userName || log.userId,
            action: log.action,
            module: log.module,
            details: details,
            ip: log.ip || "Unknown"
        };
    });
}
