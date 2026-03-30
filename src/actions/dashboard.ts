"use server";

import { db } from "@/db";
import { inventoryTable, cashFlowTable, restockTransactionsTable, financeTable } from "@/db/schema";
import { count, eq, sql, gt, desc, sum, and, gte, lte, or } from "drizzle-orm";

export async function getDashboardStats() {
    // 1. Total Pendapatan (Kas Masuk)
    const pemasukanResult = await db.select({ total: sum(cashFlowTable.nominal) }).from(cashFlowTable).where(eq(cashFlowTable.tipeMutasi, "PEMASUKAN"));
    const pemasukan = Number(pemasukanResult[0]?.total || 0);

    // 2. Total Pengeluaran (Kas Keluar)
    const pengeluaranResult = await db.select({ total: sum(cashFlowTable.nominal) }).from(cashFlowTable).where(eq(cashFlowTable.tipeMutasi, "PENGELUARAN"));
    const pengeluaran = Number(pengeluaranResult[0]?.total || 0);

    // 2b. Total Biaya Produksi (informasi saja, tidak potong arus kas)
    const biayaProduksiResult = await db.select({ total: sum(financeTable.pengeluaran) }).from(financeTable);
    const biayaProduksi = Number(biayaProduksiResult[0]?.total || 0);

    // Saldo Arus Kas (hanya dari cashFlowTable, biaya produksi TIDAK memotong)
    const saldo = pemasukan - pengeluaran;

    // 3. Nilai Stok Aktif
    const nilaiStokResult = await db.select({
        totalValue: sum(sql`${inventoryTable.stokAkhir} * ${inventoryTable.hargaSatuan}`)
    }).from(inventoryTable).where(gt(inventoryTable.stokAkhir, 0));

    const nilaiStok = Number(nilaiStokResult[0]?.totalValue || 0);

    // 4. Total Kerugian (Minus) dari Produksi Jus
    const kerugianResult = await db.select({
        totalMinus: sum(financeTable.minus)
    }).from(financeTable);

    const totalKerugian = Number(kerugianResult[0]?.totalMinus || 0);



    return {
        pemasukan,
        pengeluaran,
        saldo,
        nilaiStok,
        totalKerugian
    };
}

export async function getLowStockAlerts() {
    // Mengambil barang yang statusnya 'Hampir Habis' atau stok < 10 (jika ada barang kritikal)
    return await db.select({
        skuId: inventoryTable.skuId,
        name: inventoryTable.namaBarang,
        stock: inventoryTable.stokAkhir,
        status: inventoryTable.status
    }).from(inventoryTable)
        .where(or(eq(inventoryTable.status, "Hampir Habis"), lte(inventoryTable.stokAkhir, 10)))
        .orderBy(inventoryTable.stokAkhir)
        .limit(5);
}

export async function getExpiringItemsAlerts() {
    // Mendapatkan tanggal 3 hari dari sekarang
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    return await db.select({
        skuId: inventoryTable.skuId,
        name: inventoryTable.namaBarang,
        expiredDate: inventoryTable.expiredDate,
        stock: inventoryTable.stokAkhir
    }).from(inventoryTable)
        .where(and(lte(inventoryTable.expiredDate, threeDaysFromNow), gt(inventoryTable.expiredDate, new Date(0))))
        .orderBy(inventoryTable.expiredDate)
        .limit(5);
}

export type CashFlowFilter = "1_day" | "5_days" | "1_month" | "6_months" | "ytd" | "1_year" | "5_years" | "max";

export async function getSalesChartData(filter: CashFlowFilter = "1_month") {
    const endDate = new Date();
    const startDate = new Date();
    let groupBy: "hour" | "day" | "month" | "year" = "day";

    switch (filter) {
        case "1_day":
            startDate.setHours(0, 0, 0, 0);
            groupBy = "hour";
            break;
        case "5_days":
            startDate.setDate(endDate.getDate() - 4);
            startDate.setHours(0, 0, 0, 0);
            groupBy = "day";
            break;
        case "1_month":
            startDate.setDate(endDate.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
            groupBy = "day";
            break;
        case "6_months":
            startDate.setMonth(endDate.getMonth() - 5);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            groupBy = "month";
            break;
        case "ytd":
            startDate.setMonth(0, 1);
            startDate.setHours(0, 0, 0, 0);
            groupBy = "month";
            break;
        case "1_year":
            startDate.setFullYear(endDate.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
            groupBy = "month";
            break;
        case "5_years":
            startDate.setFullYear(endDate.getFullYear() - 4);
            startDate.setMonth(0, 1);
            startDate.setHours(0, 0, 0, 0);
            groupBy = "year";
            break;
        case "max":
            startDate.setFullYear(2000, 0, 1);
            startDate.setHours(0, 0, 0, 0);
            groupBy = "year";
            break;
    }

    const dailyIncome = await db.select({
        tanggal: cashFlowTable.tanggal,
        nominal: cashFlowTable.nominal,
    }).from(cashFlowTable)
        .where(and(eq(cashFlowTable.tipeMutasi, "PEMASUKAN"), gte(cashFlowTable.tanggal, startDate), lte(cashFlowTable.tanggal, endDate)));

    const dailyOutcome = await db.select({
        tanggal: cashFlowTable.tanggal,
        nominal: cashFlowTable.nominal,
    }).from(cashFlowTable)
        .where(and(eq(cashFlowTable.tipeMutasi, "PENGELUARAN"), gte(cashFlowTable.tanggal, startDate), lte(cashFlowTable.tanggal, endDate)));

    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const grouped: Record<string, { in: number; out: number }> = {};

    function getKey(d: Date): string {
        switch (groupBy) {
            case "hour":
                return `${d.getHours().toString().padStart(2, '0')}:00`;
            case "day":
                return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            case "month":
                return `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
            case "year":
                return `${d.getFullYear()}`;
        }
    }

    // Initialize slots
    if (groupBy === "hour") {
        const currentHour = endDate.getHours();
        for (let h = 0; h <= currentHour; h++) {
            grouped[`${h.toString().padStart(2, '0')}:00`] = { in: 0, out: 0 };
        }
    } else if (groupBy === "day") {
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        for (let i = 0; i < diffDays; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            grouped[getKey(d)] = { in: 0, out: 0 };
        }
    } else if (groupBy === "month") {
        const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (cur <= endDate) {
            grouped[getKey(cur)] = { in: 0, out: 0 };
            cur.setMonth(cur.getMonth() + 1);
        }
    } else if (groupBy === "year") {
        for (let y = startDate.getFullYear(); y <= endDate.getFullYear(); y++) {
            grouped[`${y}`] = { in: 0, out: 0 };
        }
    }

    dailyIncome.forEach(inc => {
        const key = getKey(new Date(inc.tanggal));
        if (grouped[key] !== undefined) {
            grouped[key].in += inc.nominal;
        }
    });

    dailyOutcome.forEach(outc => {
        const key = getKey(new Date(outc.tanggal));
        if (grouped[key] !== undefined) {
            grouped[key].out += outc.nominal;
        }
    });

    return Object.keys(grouped).map(key => ({
        label: key,
        pemasukan: grouped[key].in,
        pengeluaran: grouped[key].out,
        saldo: grouped[key].in - grouped[key].out,
    }));
}

export async function getTopProductsChartData(filter: "7_days" | "this_month" | "this_year" = "this_month") {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (filter === "7_days") {
        startDate.setDate(startDate.getDate() - 6);
    } else if (filter === "this_month") {
        startDate.setDate(1);
    } else if (filter === "this_year") {
        startDate.setMonth(0, 1);
    }

    const sales = await db.select({
        product: financeTable.menuSmoothies,
        totalSales: sum(financeTable.terjual)
    }).from(financeTable)
        .where(gte(financeTable.tanggalMasuk, startDate))
        .groupBy(financeTable.menuSmoothies)
        .orderBy(desc(sum(financeTable.terjual)))
        .limit(5);

    return sales.map(s => ({
        product: s.product,
        sales: Number(s.totalSales)
    }));
}

export async function getInventoryStatusChart() {
    // Menghitung jumlah unik jenis barang berdasarkan status
    const statusCounts = await db.select({
        status: inventoryTable.status,
        count: count()
    }).from(inventoryTable).groupBy(inventoryTable.status);

    return statusCounts.map(s => ({
        name: s.status,
        value: s.count
    }));
}
