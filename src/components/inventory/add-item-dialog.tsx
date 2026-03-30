"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { addInventoryItem } from "@/actions/inventory";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddItemDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Form State
    const [namaBarang, setNamaBarang] = useState("");
    const [satuan, setSatuan] = useState("Pcs");
    const [hargaSatuan, setHargaSatuan] = useState("");
    const [stokMasuk, setStokMasuk] = useState("");
    const [expiredDate, setExpiredDate] = useState("");
    const [catatan, setCatatan] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!namaBarang || !hargaSatuan || !stokMasuk) {
            toast.error("Mohon isi field yang wajib (Nama, Harga, Stok)");
            return;
        }

        setLoading(true);
        try {
            await addInventoryItem({
                namaBarang,
                satuan,
                hargaSatuan: Number(hargaSatuan),
                stokMasuk: Number(stokMasuk),
                expiredDate: expiredDate ? new Date(expiredDate) : undefined,
                catatan: catatan || undefined
            });

            toast.success("Barang berhasil ditambahkan");

            startTransition(() => {
                setOpen(false);
                // Reset form
                setNamaBarang("");
                setSatuan("Pcs");
                setHargaSatuan("");
                setStokMasuk("");
                setExpiredDate("");
                setCatatan("");
            });
        } catch (error) {
            toast.error("Gagal menambahkan barang");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Barang
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Input Barang Baru</DialogTitle>
                        <DialogDescription>
                            Masukkan detail bahan baku baru ke dalam sistem inventaris.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {/* SKU and Batch omitted for Create MVP logic where SKU is auto-generated */}
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="name">Nama Barang *</Label>
                            <Input id="name" value={namaBarang} onChange={e => setNamaBarang(e.target.value)} placeholder="Misal: Mangga Harum Manis" required />
                        </div>
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                            <Label>Satuan *</Label>
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
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="stockIn">Stok Masuk *</Label>
                            <Input id="stockIn" type="number" value={stokMasuk} onChange={e => setStokMasuk(e.target.value)} placeholder="0" min="0" required />
                        </div>
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="price">Harga Satuan (Rp) *</Label>
                            <Input id="price" type="number" value={hargaSatuan} onChange={e => setHargaSatuan(e.target.value)} placeholder="0" min="0" required />
                        </div>
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="expiredDate">Expired Date</Label>
                            <Input id="expiredDate" type="date" value={expiredDate} onChange={e => setExpiredDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="note">Catatan</Label>
                            <Input id="note" value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Tambahan catatan (opsional)" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={loading || isPending} className="bg-green-600 hover:bg-green-700 text-white">
                            {loading || isPending ? "Menyimpan..." : "Simpan Data"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
