"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditItemDialog } from "./edit-item-dialog";
import { RestockItemDialog } from "./restock-item-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { deleteInventoryItem } from "@/actions/inventory";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInventoryExportData } from "@/actions/export";
import { ExportButton } from "@/components/export-button";

type InventoryItem = {
    skuId: string;
    batchId: string;
    name: string;
    satuan: string;
    entryDate: string;
    stockIn: number;
    stockOut: number;
    stockFinal: number;
    totalNilai: number;
    unitPrice: number;
    expiredDate: string;
    status: string;
    note: string;
}

export function InventoryTable({
    inventory,
    totalCount,
    currentPage,
    itemsPerPage,
    currentQ,
    currentStatus,
    userRole
}: {
    inventory: InventoryItem[],
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
        if (name !== 'page') {
            params.set('page', '1');
        }
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleDelete = async (skuId: string) => {
        if (!confirm("Yakin ingin menghapus barang ini? Data yang dihapus tidak dapat dikembalikan.")) return;
        setDeletingId(skuId);
        try {
            await deleteInventoryItem(skuId);
            toast.success("Barang berhasil dihapus!");
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus barang.");
        } finally {
            setDeletingId(null);
        }
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const handleExport = async () => {
        return await getInventoryExportData({ q: currentQ, status: currentStatus });
    };

    const exportColumns = [
        { header: "SKU ID", dataKey: "skuId" },
        { header: "Nama Barang", dataKey: "name" },
        { header: "Tanggal Masuk", dataKey: "entryDate" },
        { header: "Stok Akhir", dataKey: "stockFinal" },
        { header: "Harga Satuan", dataKey: "unitPrice" },
        { header: "Total Nilai", dataKey: "totalValue" },
        { header: "Expired Date", dataKey: "expiredDate" },
        { header: "Status", dataKey: "status" },
        { header: "Catatan", dataKey: "note" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-zinc-950 p-4 rounded-md border shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Cari nama barang atau SKU..."
                        className="pl-8"
                        value={currentQ}
                        onChange={(e) => {
                            handleUrlUpdate('q', e.target.value);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500 whitespace-nowrap hidden sm:inline-block">Filter Status:</span>
                    <Select value={currentStatus} onValueChange={(v) => handleUrlUpdate('status', v)}>
                        <SelectTrigger className="w-[140px] sm:w-[180px]">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Semua">Semua Status</SelectItem>
                            <SelectItem value="Tersedia">Tersedia</SelectItem>
                            <SelectItem value="Hampir Habis">Hampir Habis</SelectItem>
                            <SelectItem value="Habis">Habis</SelectItem>
                        </SelectContent>
                    </Select>

                    <ExportButton
                        onExport={handleExport}
                        filename="Inventory"
                        columns={exportColumns}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-zinc-950 overflow-x-auto shadow-sm">
                <Table className="whitespace-nowrap">
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU ID</TableHead>
                            {/* <TableHead>Batch ID</TableHead> */}
                            <TableHead>Nama Barang</TableHead>
                            <TableHead>Tanggal Masuk</TableHead>
                            <TableHead>Stok Masuk</TableHead>
                            <TableHead>Stok Keluar</TableHead>
                            <TableHead>Stok Akhir</TableHead>
                            <TableHead>Harga Satuan</TableHead>
                            <TableHead>Total Nilai</TableHead>
                            <TableHead>Expired Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Catatan</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.map((item) => (
                            <TableRow key={`${item.skuId}-${item.batchId}`}>
                                <TableCell className="font-medium">{item.skuId}</TableCell>
                                {/* <TableCell>{item.batchId}</TableCell> */}
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.entryDate}</TableCell>
                                <TableCell>{item.stockIn} {item.satuan}</TableCell>
                                <TableCell>{item.stockOut} {item.satuan}</TableCell>
                                <TableCell className="font-semibold">{item.stockFinal} {item.satuan}</TableCell>
                                <TableCell>Rp {item.unitPrice.toLocaleString('id-ID')} / {item.satuan}</TableCell>
                                <TableCell>Rp {item.totalNilai.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{item.expiredDate}</TableCell>
                                <TableCell>
                                    {item.status === "Tersedia" && <Badge className="bg-green-500 hover:bg-green-600 text-white">Tersedia</Badge>}
                                    {item.status === "Hampir Habis" && <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Hampir Habis</Badge>}
                                    {!["Tersedia", "Hampir Habis"].includes(item.status) && <Badge variant="outline">{item.status}</Badge>}
                                </TableCell>
                                <TableCell className="truncate max-w-[150px]">{item.note}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <RestockItemDialog skuId={item.skuId} itemName={item.name} />
                                        <EditItemDialog item={item} />
                                        {userRole === "Admin" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                onClick={() => handleDelete(item.skuId)}
                                                disabled={deletingId === item.skuId}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {inventory.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={13} className="h-32 text-center text-zinc-500">
                                    Tidak ada data yang ditemukan.
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
                                onClick={() => handleUrlUpdate('page', String(Math.max(1, currentPage - 1)))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">Halaman {currentPage} dari {totalPages}</div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUrlUpdate('page', String(Math.min(totalPages, currentPage + 1)))}
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
