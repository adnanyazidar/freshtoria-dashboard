"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export function PeriodFilter({ initialPeriod }: { initialPeriod: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handlePeriodChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('period', value);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-1.5 text-sm">
            <span className="text-zinc-500 whitespace-nowrap"><Calendar className="h-4 w-4 inline-block -mt-1 mr-1.5" />Periode:</span>
            <Select value={initialPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="this-month">Bulan Ini</SelectItem>
                    <SelectItem value="last-month">Bulan Lalu</SelectItem>
                    <SelectItem value="all-time">Semua Waktu</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
