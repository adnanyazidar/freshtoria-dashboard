"use client";

import { useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { addCashFlowRecord } from "@/actions/finance";
import { toast } from "sonner";

export function AddTransactionDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [tipeMutasi, setTipeMutasi] = useState<"PEMASUKAN" | "PENGELUARAN">("PEMASUKAN");
    const [kategori, setKategori] = useState("PENJUALAN");
    const [nominal, setNominal] = useState("");
    const [keterangan, setKeterangan] = useState("");
    const [tanggal, setTanggal] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!kategori || !nominal || !tanggal || !keterangan) {
            toast.error("Mohon isi semua form!");
            return;
        }

        setLoading(true);

        try {
            await addCashFlowRecord({
                tipeMutasi,
                kategori,
                nominal: Number(nominal),
                keterangan,
                tanggal: new Date(tanggal),
            });

            toast.success("Mutasi kas berhasil dicatat!");
            setOpen(false);

            // Reset
            setKategori("PENJUALAN");
            setNominal("");
            setKeterangan("");
            setTanggal("");
            setTipeMutasi("PEMASUKAN");
        } catch (error) {
            toast.error("Gagal mencatat mutasi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Catat Mutasi Kas
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Catat Mutasi Kas</DialogTitle>
                        <DialogDescription>
                            Masukkan detail penerimaan atau pengeluaran kas manual di luar sistem Restock bahan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Tipe Mutasi *</Label>
                            <Select value={tipeMutasi} onValueChange={(v: "PEMASUKAN" | "PENGELUARAN") => setTipeMutasi(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tipe mutasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PEMASUKAN">Pemasukan Kas</SelectItem>
                                    <SelectItem value="PENGELUARAN">Pengeluaran Kas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="kategori">Kategori Mutasi *</Label>
                            <Input id="kategori" value={kategori} onChange={e => setKategori(e.target.value)} placeholder="Contoh: PENJUALAN OFFLINE" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nominal">Nominal / Jumlah (Rp) *</Label>
                            <Input id="nominal" value={nominal} onChange={e => setNominal(e.target.value)} type="number" placeholder="Contoh: 150000" min="0" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tanggal">Tanggal Mutasi *</Label>
                            <Input id="tanggal" type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="keterangan">Keterangan / Rincian *</Label>
                            <Input id="keterangan" value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Misal: Laba bersih harian" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan Mutasi"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
