"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { getSalesChartData, type CashFlowFilter } from "@/actions/dashboard";

import {
    ChartConfig,
    ChartContainer,
} from "@/components/ui/chart";

const chartConfig = {
    saldo: {
        label: "Saldo Bersih",
        color: "#10b981",
    },
} satisfies ChartConfig;

const FILTERS: { key: CashFlowFilter; label: string }[] = [
    { key: "1_day", label: "1 HR" },
    { key: "5_days", label: "5 HR" },
    { key: "1_month", label: "1 BLN" },
    { key: "6_months", label: "6 BLN" },
    { key: "ytd", label: "YTD" },
    { key: "1_year", label: "1 THN" },
    { key: "5_years", label: "5 THN" },
    { key: "max", label: "MAKS" },
];

function formatRupiahShort(val: number): string {
    const abs = Math.abs(val);
    if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
    if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}Jt`;
    if (abs >= 1_000) return `${(val / 1_000).toFixed(0)}Rb`;
    return val.toLocaleString("id-ID");
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    const saldo = data.saldo;
    const isPositive = saldo >= 0;

    return (
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</p>
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-green-600">Pemasukan</span>
                    <span className="text-xs font-semibold text-green-600">Rp {data.pemasukan.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-red-500">Pengeluaran</span>
                    <span className="text-xs font-semibold text-red-500">Rp {data.pengeluaran.toLocaleString("id-ID")}</span>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-zinc-700 dark:text-zinc-300">Saldo</span>
                        <span className={`text-xs font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
                            Rp {saldo.toLocaleString("id-ID")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function OverviewChart({ chartData }: { chartData: any[] }) {
    const [filter, setFilter] = React.useState<CashFlowFilter>("1_month");
    const [data, setData] = React.useState(chartData);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (filter === "1_month" && data === chartData) return;

        let isMounted = true;

        async function fetchData() {
            setIsLoading(true);
            try {
                const newData = await getSalesChartData(filter);
                if (isMounted) setData(newData);
            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchData();
        return () => { isMounted = false; };
    }, [filter, chartData]);

    // Calculate totals
    const totalPemasukan = data.reduce((s, d) => s + d.pemasukan, 0);
    const totalPengeluaran = data.reduce((s, d) => s + d.pengeluaran, 0);
    const totalSaldo = totalPemasukan - totalPengeluaran;
    const isPositive = totalSaldo >= 0;

    // Dynamic chart color
    const lineColor = isPositive ? "#10b981" : "#ef4444";
    const fillColor = isPositive ? "#10b981" : "#ef4444";

    // Filter label
    const currentFilterLabel = FILTERS.find(f => f.key === filter)?.label || "";

    return (
        <div className="flex flex-col w-full h-full">
            {/* Header - Stock-like metric */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-1">
                <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${isPositive ? "text-zinc-900 dark:text-zinc-100" : "text-red-600 dark:text-red-400"}`}>
                            Rp {totalSaldo.toLocaleString("id-ID")}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ${isPositive ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}>
                            {isPositive ? "↑" : "↓"}{" "}
                            {totalPengeluaran > 0 ? Math.abs(((totalPemasukan - totalPengeluaran) / totalPengeluaran) * 100).toFixed(1) : "0"}%
                        </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Net Cash Flow · {currentFilterLabel}
                    </p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-0.5 mb-3 overflow-x-auto pb-1">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${filter === f.key
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Chart */}
            {(!data || data.length === 0) ? (
                <div className="flex min-h-[250px] w-full items-center justify-center text-sm text-zinc-500">
                    Belum ada data transaksi
                </div>
            ) : (
                <ChartContainer config={chartConfig} className={`min-h-[250px] w-full transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={fillColor} stopOpacity={0.25} />
                                <stop offset="100%" stopColor={fillColor} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="#e4e4e7"
                            strokeOpacity={0.5}
                        />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 11, fill: "#a1a1aa" }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={4}
                            tick={{ fontSize: 11, fill: "#a1a1aa" }}
                            tickFormatter={(value) => formatRupiahShort(value)}
                            width={55}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{
                                stroke: "#d4d4d8",
                                strokeWidth: 1,
                                strokeDasharray: "4 4",
                            }}
                        />
                        <Area
                            dataKey="saldo"
                            type="monotone"
                            fill="url(#saldoGradient)"
                            stroke={lineColor}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{
                                r: 4,
                                fill: lineColor,
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ChartContainer>
            )}
        </div>
    );
}
