"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getTopProductsChartData } from "@/actions/dashboard";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const chartConfig = {
    sales: {
        label: "Terjual",
        color: "#3b82f6", // Blue 500
    },
} satisfies ChartConfig;

type FilterType = "7_days" | "this_month" | "this_year";

export function TopProductsChart({ chartData }: { chartData: any[] }) {
    const [filter, setFilter] = React.useState<FilterType>("this_month");
    const [data, setData] = React.useState(chartData);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (filter === "this_month" && data === chartData) return;

        let isMounted = true;

        async function fetchData() {
            setIsLoading(true);
            try {
                const newData = await getTopProductsChartData(filter);
                if (isMounted) setData(newData);
            } catch (error) {
                console.error("Failed to fetch top products chart data:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchData();
        return () => { isMounted = false; };
    }, [filter, chartData]);

    const getFilterSubtitle = (f: FilterType) => {
        if (f === "7_days") return "Berdasarkan penjualan 7 hari terakhir";
        if (f === "this_month") return "Berdasarkan penjualan bulan ini";
        if (f === "this_year") return "Berdasarkan penjualan tahun ini";
        return "";
    };

    return (
        <>
            <CardHeader className="relative flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-base font-medium text-zinc-800 dark:text-zinc-200">Produk Terlaris</CardTitle>
                    <CardDescription>{getFilterSubtitle(filter)}</CardDescription>
                </div>
                <Select value={filter} onValueChange={(val: FilterType) => setFilter(val)}>
                    <SelectTrigger className="mt-0 h-8 w-[130px] text-xs">
                        <SelectValue placeholder="Pilih Waktu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7_days">7 Hari Terakhir</SelectItem>
                        <SelectItem value="this_month">Bulan Ini</SelectItem>
                        <SelectItem value="this_year">Tahun Ini</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex-1 text-zinc-500 pt-0 relative min-h-[250px] flex flex-col justify-center">
                {(!data || data.length === 0) ? (
                    <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 min-h-[250px] mt-4">Belum ada data penjualan pada rentang waktu ini</div>
                ) : (
                    <ChartContainer config={chartConfig} className={`min-h-[250px] w-full mt-4 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        <BarChart accessibilityLayer data={data}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="product"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => {
                                    // Shorten name if needed, here just return first word
                                    return value.split(' ')[0]
                                }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </>
    );
}
