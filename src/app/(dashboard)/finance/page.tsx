import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { AddTransactionDialog } from "@/components/finance/add-transaction-dialog";
import { TransactionTable } from "@/components/finance/transaction-table";
import { AddJuiceProductionDialog } from "@/components/finance/add-juice-production-dialog";
import { JuiceProductionTable } from "@/components/finance/juice-production-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { cashFlowTable, financeTable } from "@/db/schema";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { desc, sql, like, eq, and, or, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PeriodFilter } from "@/components/finance/period-filter";

export const dynamic = "force-dynamic";

export default async function FinancePage(props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session?.user?.role !== "Admin") {
        redirect("/");
    }

    const searchParams = await props.searchParams;

    // Params for Cash Flow
    const pageCf = Number(searchParams?.page_cf) || 1;
    const qCf = searchParams?.q_cf as string || "";
    const tipeCf = searchParams?.tipe_cf as string || "Semua";
    const itemsPerPage = 5;

    // Params for Juice Production
    const pageJp = Number(searchParams?.page_jp) || 1;
    const qJp = searchParams?.q_jp as string || "";

    const tab = searchParams?.tab as string || "cash-flow";

    // Params for Period Filter
    const period = searchParams?.period as string || "this-month";

    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;

    const now = new Date();
    if (period === "this-month") {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    } else if (period === "last-month") {
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(now); // Let's simplify and make period filter logic accurate for month isolation
    }
    // "all-time" means startDate & endDate remain undefined

    // For last-month, endDate should be end of last month
    if (period === "last-month") {
        endDate = endOfMonth(subMonths(now, 1));
    }

    // Prepare Date conditions
    const cfDateConditions = [];
    const jpDateConditions = [];
    if (startDate && endDate) {
        cfDateConditions.push(gte(cashFlowTable.tanggal, startDate));
        cfDateConditions.push(lte(cashFlowTable.tanggal, endDate));

        jpDateConditions.push(gte(financeTable.tanggalMasuk, startDate));
        jpDateConditions.push(lte(financeTable.tanggalMasuk, endDate));
    }

    // 1. Total In & Out Aggregation
    const inConditions = [eq(cashFlowTable.tipeMutasi, "PEMASUKAN"), ...cfDateConditions];
    const outConditions = [eq(cashFlowTable.tipeMutasi, "PENGELUARAN"), ...cfDateConditions];

    const totalInResult = await db.select({ total: sql<number>`sum(nominal)` })
        .from(cashFlowTable)
        .where(and(...inConditions));

    const totalOutResult = await db.select({ total: sql<number>`sum(nominal)` })
        .from(cashFlowTable)
        .where(and(...outConditions));

    // Calculate sum of Biaya Produksi (Out) from financeTable
    const biayaProduksiResult = await db.select({ total: sql<number>`sum(pengeluaran)` })
        .from(financeTable)
        .where(and(...jpDateConditions));

    const totalIn = totalInResult[0].total || 0;
    const totalOut = totalOutResult[0].total || 0;
    const totalBiayaProduksi = biayaProduksiResult[0].total || 0;

    // 2. Paginate Cash Flow
    const cfConditions: any[] = [...cfDateConditions];
    if (qCf) {
        const searchCondition = or(
            like(cashFlowTable.kategori, `%${qCf}%`),
            like(cashFlowTable.keterangan, `%${qCf}%`)
        );
        if (searchCondition) cfConditions.push(searchCondition);
    }
    if (tipeCf !== "Semua") {
        cfConditions.push(eq(cashFlowTable.tipeMutasi, tipeCf as "PEMASUKAN" | "PENGELUARAN"));
    }
    const cfWhereClause = cfConditions.length > 0 ? and(...cfConditions) : undefined;

    const cfTotalCountResult = await db.select({ count: sql<number>`count(*)` }).from(cashFlowTable).where(cfWhereClause);
    const cfTotalCount = cfTotalCountResult[0].count;

    const cashFlowData = await db
        .select()
        .from(cashFlowTable)
        .where(cfWhereClause)
        .orderBy(desc(cashFlowTable.tanggal))
        .limit(itemsPerPage)
        .offset((pageCf - 1) * itemsPerPage);

    // 3. Paginate Juice Production
    const jpConditions: any[] = [...jpDateConditions];
    if (qJp) {
        const searchCondition = or(
            like(financeTable.menuSmoothies, `%${qJp}%`),
            like(financeTable.mitra, `%${qJp}%`)
        );
        if (searchCondition) jpConditions.push(searchCondition);
    }
    const jpWhereClause = jpConditions.length > 0 ? and(...jpConditions) : undefined;

    const jpTotalCountResult = await db.select({ count: sql<number>`count(*)` }).from(financeTable).where(jpWhereClause);
    const jpTotalCount = jpTotalCountResult[0].count;

    const juiceProductionData = await db
        .select()
        .from(financeTable)
        .where(jpWhereClause)
        .orderBy(desc(financeTable.tanggalMasuk))
        .limit(itemsPerPage)
        .offset((pageJp - 1) * itemsPerPage);
    const mappedTransactions = cashFlowData.map((trx) => {
        return {
            id: trx.id,
            menu: trx.kategori, // Reusing 'menu' prop name for backward compat table
            produksi: 0,
            terjual: 0,
            hargaProduk: trx.nominal,
            tanggalMasuk: format(trx.tanggal, "dd/MM/yyyy"),
            expiredDate: "-",
            mitra: trx.tipeMutasi, // Using string "PEMASUKAN"/"PENGELUARAN"
            paymentStatus: trx.referensiId ? "Sistem" : "Manual", // We use this as origin flag
            catatan: trx.keterangan,
        };
    });

    const mappedProduction = juiceProductionData.map((prod) => ({
        ...prod,
        tanggalMasuk: format(prod.tanggalMasuk, "dd/MM/yyyy"),
        expiredDate: format(prod.expiredDate, "dd/MM/yyyy"),
    }));

    const saldo = totalIn - totalOut;

    const periodLabel = period === "this-month" ? "Bulan Ini" : period === "last-month" ? "Bulan Lalu" : "Semua Waktu";

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance (Keuangan)</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Pencatatan rekapitulasi arus kas dan produksi harian bisnis.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <PeriodFilter initialPeriod={period} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Saldo Aktual / Arus Kas</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-base sm:text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400 break-all">Rp {saldo.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-blue-600 mt-1 dark:text-blue-500">
                            Pemasukan dikurangi pengeluaran ({periodLabel})
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{periodLabel} (In)</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-base sm:text-xl md:text-2xl font-bold text-green-600 break-all">Rp {totalIn.toLocaleString('id-ID')}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{periodLabel} (Out)</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-base sm:text-xl md:text-2xl font-bold text-red-600 break-all">Rp {totalOut.toLocaleString('id-ID')}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Biaya Produksi (Out)</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-base sm:text-xl md:text-2xl font-bold text-orange-600 break-all">Rp {totalBiayaProduksi.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Catatan Biaya Produksi
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="cash-flow" value={tab} className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="cash-flow" asChild>
                            <a href="?tab=cash-flow">Buku Kas (Arus Kas)</a>
                        </TabsTrigger>
                        <TabsTrigger value="juice-production" asChild>
                            <a href="?tab=juice-production">Produksi Jus Per Batch</a>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center space-x-2">
                        {/* Dynamic actions based on tab will be rendered by components themselves or we place them side-by-side */}
                        <AddTransactionDialog />
                        <AddJuiceProductionDialog />
                    </div>
                </div>

                <TabsContent value="cash-flow" className="mt-0">
                    <TransactionTable
                        transactions={mappedTransactions}
                        totalCount={cfTotalCount}
                        currentPage={pageCf}
                        itemsPerPage={itemsPerPage}
                        currentQ={qCf}
                        currentStatus={tipeCf}
                        userRole={session?.user?.role || "Staff"}
                    />
                </TabsContent>

                <TabsContent value="juice-production" className="mt-0">
                    <JuiceProductionTable
                        data={mappedProduction}
                        totalCount={jpTotalCount}
                        currentPage={pageJp}
                        itemsPerPage={itemsPerPage}
                        currentQ={qJp}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
