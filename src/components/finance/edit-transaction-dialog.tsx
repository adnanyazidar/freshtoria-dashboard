"use client";

import { useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateCashFlowRecord } from "@/actions/finance";
import { toast } from "sonner";

interface EditTransactionDialogProps {
    trx: {
        id: string;
        menu: string; // Used as kategori in Cash Flow
        hargaProduk: number; // nominal
        tanggalMasuk: string; // tanggal
        mitra: string; // tipeMutasi
        paymentStatus: string; // Origin reference flag
        catatan: string; // Keterangan
    };
}

export function EditTransactionDialog({ trx }: EditTransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Parse DD/MM/YYYY to YYYY-MM-DD for date inputs
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return "";
        const parts = dateString.split("/");
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateString;
    };

    const isSystemGenerated = trx.paymentStatus === "Sistem";

    const [kategori, setKategori] = useState(trx.menu);
    const [nominal, setNominal] = useState(trx.hargaProduk.toString());
    const [tanggal, setTanggal] = useState(formatDateForInput(trx.tanggalMasuk));
    const [tipeMutasi, setTipeMutasi] = useState<"PEMASUKAN" | "PENGELUARAN">(trx.mitra as any || "PEMASUKAN");
    const [keterangan, setKeterangan] = useState(trx.catatan || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSystemGenerated) {
            toast.error("Mutasi ini dibuat oleh Sistem (Restock) dan tidak dapat dioverride secara manual.");
            return;
        }

        if (!kategori || !nominal || !tanggal) {
            toast.error("Mohon isi form kategori, nominal, dan tanggal");
            return;
        }

        setLoading(true);

        try {
            await updateCashFlowRecord(
                trx.id,
                {
                    tipeMutasi,
                    kategori,
                    nominal: Number(nominal),
                    tanggal: new Date(tanggal),
                    keterangan,
                }
            );

            toast.success("Mutasi berhasil diperbarui!");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Gagal memperbarui mutasi");
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
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Mutasi Kas</DialogTitle>
                        <DialogDescription>
                            {isSystemGenerated
                                ? "Mutasi ini dikelola sistem (Otomatis dari halaman Restock/Inventory). Data tidak dapat dubah disini."
                                : "Ubah catatan saldo keluar masuk keuangan ini."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 opacity-100">
                        <div className="grid gap-2">
                            <Label>Tipe Mutasi</Label>
                            <Select value={tipeMutasi} onValueChange={(v: "PEMASUKAN" | "PENGELUARAN") => setTipeMutasi(v)} disabled={isSystemGenerated}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PEMASUKAN">Pemasukan</SelectItem>
                                    <SelectItem value="PENGELUARAN">Pengeluaran</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="kategori">Kategori Mutasi</Label>
                            <Input id="kategori" value={kategori} onChange={e => setKategori(e.target.value)} disabled={isSystemGenerated} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nominal">Nominal / Jumlah Kas (Rp)</Label>
                            <Input id="nominal" type="number" value={nominal} onChange={e => setNominal(e.target.value)} min="0" disabled={isSystemGenerated} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tanggal">Tanggal Mutasi</Label>
                            <Input id="tanggal" type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} disabled={isSystemGenerated} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="keterangan">Keterangan Tambahan</Label>
                            <Input id="keterangan" value={keterangan} onChange={e => setKeterangan(e.target.value)} disabled={isSystemGenerated} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={loading || isSystemGenerated} className="bg-green-600 hover:bg-green-700 text-white">
                            {loading ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
