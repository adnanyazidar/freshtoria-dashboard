"use client";

import { useState, useTransition } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Search, ChevronLeft, ChevronRight, Plus, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { deleteJuiceProduction } from "@/actions/juice-production";
import { SellJuiceDialog } from "./sell-juice-dialog";
import { EditJuiceProductionDialog } from "./edit-juice-production-dialog";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getJuiceProductionExportData } from "@/actions/export";
import { ExportButton } from "@/components/export-button";
import { printThermalReceipt } from "@/lib/print-receipt";

type ProductionItem = {
    id: string;
    menuSmoothies: string;
    produksiBotol: number;
    terjual: number;
    produkSisa: number;
    hargaProduk: number;
    tanggalMasuk: string;
    expiredDate: string;
    mitra: string | null;
    status: string;
    totalPayment: number;
    minus: number;
    pengeluaran: number;
}

export function JuiceProductionTable({
    data,
    totalCount,
    currentPage,
    itemsPerPage,
    currentQ
}: {
    data: ProductionItem[],
    totalCount: number,
    currentPage: number,
    itemsPerPage: number,
    currentQ: string
}) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleUrlUpdate = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(name, value);
        } else {
            params.delete(name);
        }
        if (name !== 'page_jp') {
            params.set('page_jp', '1');
        }
        params.set('tab', 'juice-production');
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus data produksi ini? Mutasi kas yang terhubung juga akan dihapus.")) return;
        setDeletingId(id);
        try {
            await deleteJuiceProduction(id);
            toast.success("Data berhasil dihapus!");
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus data.");
        } finally {
            setDeletingId(null);
        }
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const handleExport = async () => {
        return await getJuiceProductionExportData({ q: currentQ });
    };

    const exportColumns = [
        { header: "Tanggal", dataKey: "tanggalMasuk" },
        { header: "Menu Smoothies", dataKey: "menuSmoothies" },
        { header: "Produksi", dataKey: "produksiBotol" },
        { header: "Terjual", dataKey: "terjual" },
        { header: "Sisa", dataKey: "produkSisa" },
        { header: "Mitra", dataKey: "mitra" },
        { header: "Payment", dataKey: "totalPayment" },
        { header: "Minus", dataKey: "minus" },
        { header: "Biaya (Out)", dataKey: "pengeluaran" },
        { header: "Status", dataKey: "status" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-zinc-950 p-4 rounded-md border shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Cari Menu atau Mitra..."
                        className="pl-8"
                        value={currentQ}
                        onChange={(e) => {
                            handleUrlUpdate('q_jp', e.target.value);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton
                        onExport={handleExport}
                        filename="Produksi_Jus"
                        columns={exportColumns}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-zinc-950 overflow-x-auto shadow-sm">
                <Table className="whitespace-nowrap">
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow>
                            <TableHead className="font-semibold">Tanggal</TableHead>
                            <TableHead className="font-semibold">Menu Smoothies</TableHead>
                            <TableHead className="font-semibold text-center">Produksi</TableHead>
                            <TableHead className="font-semibold text-center">Terjual</TableHead>
                            <TableHead className="font-semibold text-center">Sisa</TableHead>
                            <TableHead className="font-semibold">Mitra</TableHead>
                            <TableHead className="font-semibold text-right">Payment</TableHead>
                            <TableHead className="font-semibold text-right">Minus</TableHead>
                            <TableHead className="font-semibold text-right">Biaya (Out)</TableHead>
                            <TableHead className="font-semibold text-center">Status</TableHead>
                            <TableHead className="font-semibold text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.tanggalMasuk}</TableCell>
                                <TableCell className="font-medium text-blue-600 dark:text-blue-400">{item.menuSmoothies}</TableCell>
                                <TableCell className="text-center">{item.produksiBotol} botol</TableCell>
                                <TableCell className="text-center text-green-600 font-medium">{item.terjual} botol</TableCell>
                                <TableCell className="text-center text-red-500">{item.produkSisa} botol</TableCell>
                                <TableCell>{item.mitra || "-"}</TableCell>
                                <TableCell className="text-right text-emerald-600 font-medium">
                                    Rp {item.totalPayment.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-right text-rose-500">
                                    Rp {item.minus.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-right text-zinc-500">
                                    Rp {item.pengeluaran.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={item.status === "Success Payment" ? "default" : "destructive"}
                                        className={item.status === "Success Payment" ? "bg-emerald-500 hover:bg-emerald-600" :
                                            item.status === "Not Payment" ? "bg-rose-500 hover:bg-rose-600" : ""}>
                                        {item.status || "Not Payment"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-1">
                                        <SellJuiceDialog item={item} />
                                        <EditJuiceProductionDialog item={item} />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => printThermalReceipt(item)}
                                            title="Print Struk / Invoice"
                                            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                        >
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deletingId === item.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={11} className="h-32 text-center text-zinc-500">
                                    Tidak ada data produksi jus.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 border-t">
                        <div className="text-sm text-zinc-500">
                            Halaman {currentPage} dari {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUrlUpdate('page_jp', String(Math.max(1, currentPage - 1)))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUrlUpdate('page_jp', String(Math.min(totalPages, currentPage + 1)))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
