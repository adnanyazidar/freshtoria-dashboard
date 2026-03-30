import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, Package, Activity, AlertTriangle, Clock } from "lucide-react";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";
import { getDashboardStats, getSalesChartData, getTopProductsChartData, getLowStockAlerts, getExpiringItemsAlerts } from "@/actions/dashboard";
import { formatRupiah } from "@/lib/utils";
import { SystemAlerts } from "@/components/dashboard/system-alerts";

export default async function Dashboard() {
  const [
    metrics,
    chartDataOverview,
    chartDataTopProducts,
    lowStockAlerts,
    expiringAlerts
  ] = await Promise.all([
    getDashboardStats(),
    getSalesChartData(),
    getTopProductsChartData(),
    getLowStockAlerts(),
    getExpiringItemsAlerts()
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-normal tracking-tight text-zinc-900 dark:text-zinc-100">Dashboard Freshtoria</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Ringkasan performa penjualan dan inventaris sistem.
        </p>
      </div>

      <div className="mb-2">
        <SystemAlerts lowStock={lowStockAlerts} expiring={expiringAlerts} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-zinc-200/60 shadow-sm dark:border-zinc-800/60 bg-white dark:bg-zinc-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <DollarSign className="h-10 w-10" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10 px-4 pt-4 text-xs">
            <CardTitle className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Omset Bersih</CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-4 pb-4">
            <div className="text-base tracking-tighter sm:text-xl md:text-2xl lg:text-lg xl:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1 break-all">{formatRupiah(metrics.pemasukan)}</div>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 flex items-center">
              Net Revenue (Finance)
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200/60 shadow-sm dark:border-zinc-800/60 bg-white dark:bg-zinc-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Activity className="h-10 w-10" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10 px-4 pt-4 text-xs">
            <CardTitle className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Total Pengeluaran</CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <ArrowDownRight className="h-3 w-3" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-4 pb-4">
            <div className="text-base tracking-tighter sm:text-xl md:text-2xl lg:text-lg xl:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1 break-all">{formatRupiah(metrics.pengeluaran)}</div>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 flex items-center">
              Pengeluaran (Finance)
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200/60 shadow-sm dark:border-zinc-800/60 bg-white dark:bg-zinc-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Activity className="h-10 w-10" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10 px-4 pt-4 text-xs">
            <CardTitle className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Total Kerugian</CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <ArrowDownRight className="h-3 w-3" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-4 pb-4">
            <div className="text-base tracking-tighter sm:text-xl md:text-2xl lg:text-lg xl:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1 break-all">{formatRupiah(metrics.totalKerugian)}</div>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 flex items-center">
              Lost Profit (Expired)
            </p>
          </CardContent>
        </Card>


        <Card className="rounded-2xl border-zinc-200/60 shadow-sm dark:border-zinc-800/60 bg-white dark:bg-zinc-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <DollarSign className="h-10 w-10" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10 px-4 pt-4 text-xs">
            <CardTitle className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Net Profit</CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <DollarSign className="h-3 w-3" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-4 pb-4">
            <div className={`text-base tracking-tighter sm:text-xl md:text-2xl lg:text-lg xl:text-2xl font-semibold mt-1 break-all ${metrics.saldo >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}>
              {formatRupiah(metrics.saldo)}
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Estimasi Laba Bersih</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 flex flex-col rounded-2xl border-zinc-200/60 shadow-sm dark:border-zinc-800/60 bg-white dark:bg-zinc-950">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-medium text-zinc-800 dark:text-zinc-200">Cash Flow Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 text-zinc-500 pt-2">
            <OverviewChart chartData={chartDataOverview} />
          </CardContent>
        </Card>
        <Card className="col-span-3 flex flex-col rounded-2xl border-zinc-200/60 shadow-sm dark:border-zinc-800/60 bg-white dark:bg-zinc-950">
          <TopProductsChart chartData={chartDataTopProducts} />
        </Card>
      </div>
    </div>
  );
}
