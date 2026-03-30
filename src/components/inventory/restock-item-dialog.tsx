"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { processRestock } from "@/actions/inventory";

interface RestockItemDialogProps {
    skuId: string;
    itemName: string;
}

export function RestockItemDialog({ skuId, itemName }: RestockItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [form, setForm] = useState({
        jumlahBeli: "",
        hargaTotal: "",
        supplier: "",
        keterangan: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await processRestock(
                skuId,
                Number(form.jumlahBeli),
                Number(form.hargaTotal),
                form.supplier,
                form.keterangan
            );

            if (result.success) {
                toast.success(`Berhasil memproses restock ${itemName}`);
                startTransition(() => {
                    setOpen(false);
                    setForm({
                        jumlahBeli: "",
                        hargaTotal: "",
                        supplier: "",
                        keterangan: "",
                    });
                });
            } else {
                toast.error("Gagal memproses restock.");
            }
        } catch (error: any) {
            toast.error(error.message || "Gagal memproses restock");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Restock Barang</DialogTitle>
                        <DialogDescription>
                            Beli stok tambahan untuk <strong>{itemName}</strong>. Transaksi ini akan tercatat otomatis pada <strong>Buku Kas Pengeluaran</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="jumlahBeli">Jumlah (Unit/Kg)</Label>
                            <Input
                                id="jumlahBeli"
                                type="number"
                                min="1"
                                required
                                value={form.jumlahBeli}
                                onChange={handleChange}
                                placeholder="Contoh: 10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="hargaTotal">Harga Total Pembelian (Rp)</Label>
                            <Input
                                id="hargaTotal"
                                type="number"
                                min="0"
                                required
                                value={form.hargaTotal}
                                onChange={handleChange}
                                placeholder="Total uang yang dikeluarkan"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="supplier">Supplier / Toko (Opsional)</Label>
                            <Input
                                id="supplier"
                                value={form.supplier}
                                onChange={handleChange}
                                placeholder="Nama pemasok"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                            <Input
                                id="keterangan"
                                value={form.keterangan}
                                onChange={handleChange}
                                placeholder="Catatan pembelian"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting || isPending}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isPending}>
                            {isSubmitting || isPending ? "Menyimpan..." : "Konfirmasi Pembelian"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
