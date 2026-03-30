"use client";

import { useState, useTransition } from "react";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateInventoryItemData } from "@/actions/inventory";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditItemDialogProps {
    item: {
        skuId: string;
        batchId: string;
        name: string;
        satuan: string;
        entryDate: string;
        stockIn: number;
        stockOut: number;
        stockFinal: number;
        unitPrice: number;
        expiredDate: string;
        status: string;
        note: string;
    };
}

export function EditItemDialog({ item }: EditItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Parse DD/MM/YYYY to YYYY-MM-DD for date inputs
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return "";
        const parts = dateString.split("/");
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateString;
    };

    const [namaBarang, setNamaBarang] = useState(item.name);
    const [satuan, setSatuan] = useState(item.satuan || "Pcs");
    const [hargaSatuan, setHargaSatuan] = useState(item.unitPrice.toString());
    const stokMasuk = item.stockIn; // Stok Masuk tidak bisa diedit, selalu tetap
    const [stokKeluar, setStokKeluar] = useState(item.stockOut.toString());
    const stokAkhir = stokMasuk - Number(stokKeluar); // Stok Akhir otomatis terhitung
    const [expiredDate, setExpiredDate] = useState(formatDateForInput(item.expiredDate));
    const [catatan, setCatatan] = useState(item.note);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!namaBarang || !hargaSatuan || !stokAkhir) {
            toast.error("Mohon isi field yang wajib (Nama, Harga, Stok Akhir)");
            return;
        }

        setLoading(true);

        try {
            await updateInventoryItemData(
                item.skuId, // using original ID to locate
                {
                    namaBarang,
                    satuan,
                    hargaSatuan: Number(hargaSatuan),
                    stokMasuk: stokMasuk, // Tetap sama dengan awal masuk
                    stokKeluar: Number(stokKeluar), 
                    expiredDate: expiredDate ? new Date(expiredDate) : undefined,
                    catatan
                }
            );

            toast.success("Barang berhasil diperbarui!");
            startTransition(() => {
                setOpen(false);
            });
        } catch (error: any) {
            toast.error(error.message || "Gagal memperbarui barang");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4 text-zinc-500" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Barang</DialogTitle>
                        <DialogDescription>
                            Ubah detail barang di inventaris.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sku">SKU ID</Label>
                            <Input id="sku" defaultValue={item.skuId} disabled />
                        </div>
                        {/* <div className="grid gap-2">
                            <Label htmlFor="batch">Batch ID</Label>
                            <Input id="batch" defaultValue={item.batchId} disabled />
                        </div> */}
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="name">Nama Barang</Label>
                            <Input id="name" value={namaBarang} onChange={e => setNamaBarang(e.target.value)} required />
                        </div>
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                            <Label>Satuan</Label>
                            <Select value={satuan} onValueChange={setSatuan}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Satuan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Gram">Gram</SelectItem>
                                    <SelectItem value="Kg">Kilogram (Kg)</SelectItem>
                                    <SelectItem value="Ml">Mililiter (Ml)</SelectItem>
                                    <SelectItem value="Liter">Liter (L)</SelectItem>
                                    <SelectItem value="Pcs">Pcs / Buah</SelectItem>
                                    <SelectItem value="Pack">Pack</SelectItem>
                                    <SelectItem value="Dus">Dus</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="entryDate">Tanggal Masuk</Label>
                            <Input id="entryDate" type="date" defaultValue={formatDateForInput(item.entryDate)} disabled title="Tanggal masuk awal tidak dapat diubah dari menu edit" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="stockOut">Stok Keluar</Label>
                            <Input id="stockOut" type="number" value={stokKeluar} onChange={e => setStokKeluar(e.target.value)} min="0" max={stokMasuk} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="stockFinal">Stok Akhir (Terhitung Otomatis)</Label>
                            <Input id="stockFinal" type="number" value={stokAkhir} disabled title="Stok akhir dihitung otomatis dari Stok Masuk dikurangi Stok Keluar" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="price">Harga Satuan (Rp)</Label>
                            <Input id="price" type="number" value={hargaSatuan} onChange={e => setHargaSatuan(e.target.value)} min="0" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="expiredDate">Expired Date</Label>
                            <Input id="expiredDate" type="date" value={expiredDate} onChange={e => setExpiredDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="note">Catatan</Label>
                            <Input id="note" value={catatan} onChange={e => setCatatan(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={loading || isPending} className="bg-green-600 hover:bg-green-700 text-white">
                            {loading || isPending ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
