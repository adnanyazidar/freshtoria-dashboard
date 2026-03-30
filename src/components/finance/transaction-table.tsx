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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { deleteCashFlowRecord } from "@/actions/finance";
import { revertRestockTransaction } from "@/actions/inventory";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getCashFlowExportData } from "@/actions/export";
import { ExportButton } from "@/components/export-button";

// We receive mappedTransactions from page.tsx to maintain backward-compatible table shape while migrating names
type TransactionItem = {
    id: string;
    menu: string; // Kategori
    produksi: number; // Ignored
    terjual: number; // Ignored
    hargaProduk: number; // Nominal
    tanggalMasuk: string; // Tanggal
    expiredDate: string; // Ignored
    mitra: string; // TipeMutasi
    paymentStatus: string; // "Sistem" | "Manual"
    catatan: string; // Keterangan
}

export function TransactionTable({
    transactions,
    totalCount,
    currentPage,
    itemsPerPage,
    currentQ,
    currentStatus,
    userRole
}: {
    transactions: TransactionItem[],
    totalCount: number,
    currentPage: number,
    itemsPerPage: number,
    currentQ: string,
    currentStatus: string,
    userRole: string
}) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleUrlUpdate = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'Semua') {
            params.set(name, value);
        } else {
            params.delete(name);
        }
        if (name !== 'page_cf') {
            params.set('page_cf', '1');
        }
        // Pastikan kita tetapkan tab-nya biar tidak geser tab.
        params.set('tab', 'cash-flow');
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleDelete = async (id: string, isSystem: boolean) => {
        if (isSystem) {
            if (!confirm("Ini adalah Mutasi Sistem (Restock). Menghapus mutasi ini akan MENGURANGI KEMBALI stok masuk barang terkait di gudang. Jika stok sudah masuk minus, proses akan ditolak. Lanjutkan pembatalan restock?")) return;
            setDeletingId(id);
            try {
                await revertRestockTransaction(id);
                toast.success("Restock berhasil dibatalkan dan stok dikembalikan!");
            } catch (error: any) {
                toast.error(error.message || "Gagal membatalkan restock.");
            } finally {
                setDeletingId(null);
            }
            return;
        }
        if (!confirm("Yakin ingin menghapus mutasi ini? Data yang terhapus tidak dapat dikembalikan.")) return;
        setDeletingId(id);
        try {
            await deleteCashFlowRecord(id);
            toast.success("Mutasi berhasil dihapus!");
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus mutasi.");
        } finally {
            setDeletingId(null);
        }
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const handleExport = async () => {
        return await getCashFlowExportData({ q: currentQ, status: currentStatus });
    };

    const exportColumns = [
        { header: "ID Mutasi", dataKey: "id" },
        { header: "Tanggal", dataKey: "tanggalMasuk" },
        { header: "Tipe", dataKey: "mitra" },
        { header: "Kategori", dataKey: "menu" },
        { header: "Nominal", dataKey: "hargaProduk" },
        { header: "Asal Entri", dataKey: "paymentStatus" },
        { header: "Keterangan Tambahan", dataKey: "catatan" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-zinc-950 p-4 rounded-md border shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Cari kategori atau keterangan..."
                        className="pl-8"
                        value={currentQ}
                        onChange={(e) => {
                            handleUrlUpdate('q_cf', e.target.value);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500 whitespace-nowrap">Filter Tipe:</span>
                    <Select value={currentStatus} onValueChange={(v) => handleUrlUpdate('tipe_cf', v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Semua Mutasi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Semua">Semua Mutasi</SelectItem>
                            <SelectItem value="PEMASUKAN">Pemasukan (Omset Bersih)</SelectItem>
                            <SelectItem value="PENGELUARAN">Pengeluaran (Inventory)</SelectItem>
                        </SelectContent>
                    </Select>

                    <ExportButton
                        onExport={handleExport}
                        filename="Buku_Kas_Keuangan"
                        columns={exportColumns}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-zinc-950 overflow-x-auto shadow-sm">
                <Table className="whitespace-nowrap">
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow>
                            <TableHead className="font-semibold">ID Mutasi</TableHead>
                            <TableHead className="font-semibold">Tanggal</TableHead>
                            <TableHead className="font-semibold">Tipe</TableHead>
                            <TableHead className="font-semibold">Kategori</TableHead>
                            <TableHead className="font-semibold text-right">Nominal Kas (Rp)</TableHead>
                            <TableHead className="font-semibold text-center">Asal Entri</TableHead>
                            <TableHead className="font-semibold">Keterangan Tambahan</TableHead>
                            <TableHead className="font-semibold text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((trx) => (
                            <TableRow key={trx.id}>
                                <TableCell className="font-medium text-zinc-500">{trx.id}</TableCell>
                                <TableCell>{trx.tanggalMasuk}</TableCell>
                                <TableCell>
                                    {trx.mitra === "PEMASUKAN" ? (
                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">In</Badge>
                                    ) : (
                                        <Badge className="bg-rose-500 hover:bg-rose-600 text-white">Out</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{trx.menu}</TableCell>
                                <TableCell className={`text-right font-medium ${trx.mitra === "PEMASUKAN" ? "text-emerald-600" : "text-rose-600"}`}>
                                    {trx.mitra === "PENGELUARAN" ? "-" : "+"} {trx.hargaProduk.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${trx.paymentStatus === "Sistem" ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {trx.paymentStatus}
                                    </span>
                                </TableCell>
                                <TableCell className="text-zinc-500 max-w-[200px] truncate" title={trx.catatan}>{trx.catatan}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-1">
                                        <EditTransactionDialog trx={trx} />
                                        {userRole === "Admin" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                onClick={() => handleDelete(trx.id, trx.paymentStatus === "Sistem")}
                                                disabled={deletingId === trx.id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {transactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-zinc-500">
                                    Tidak ada data mutasi kas yang ditemukan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 border-t">
                        <div className="text-sm text-zinc-500">
                            Menampilkan <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> dari <span className="font-medium">{totalCount}</span> data
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUrlUpdate('page_cf', String(Math.max(1, currentPage - 1)))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">Halaman {currentPage} dari {totalPages}</div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUrlUpdate('page_cf', String(Math.min(totalPages, currentPage + 1)))}
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
