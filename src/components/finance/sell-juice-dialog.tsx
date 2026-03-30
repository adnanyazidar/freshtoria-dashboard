"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sellJuiceProduction } from "@/actions/juice-production";
import { ShoppingCart } from "lucide-react";

export function SellJuiceDialog({ item }: { item: any }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [qty, setQty] = useState(1);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        if (qty > item.produkSisa) {
            toast.error(`Maksimal penjualan adalah ${item.produkSisa} botol.`);
            setIsLoading(false);
            return;
        }

        try {
            await sellJuiceProduction(item.id, qty);
            toast.success(`Berhasil mencatat penjualan ${qty} botol!`);
            setOpen(false);
            setQty(1);
        } catch (error: any) {
            toast.error(error.message || "Gagal mencatat penjualan.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/50"
                    disabled={Number(item.produkSisa) <= 0}
                    title={Number(item.produkSisa) <= 0 ? "Stok Habis" : "Catat Penjualan"}
                >
                    <ShoppingCart className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Catat Penjualan</DialogTitle>
                    <DialogDescription>
                        Jual <b>{item.menuSmoothies}</b> dari batch produksi tanggal {item.tanggalMasuk}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="qty" className="text-right">
                            Jumlah (Botol)
                        </Label>
                        <Input
                            id="qty"
                            type="number"
                            className="col-span-3"
                            value={qty}
                            onChange={(e) => {
                                let val = Number(e.target.value);
                                if (val > item.produkSisa) {
                                    val = item.produkSisa;
                                    toast.warning(`Maksimal hanya ${item.produkSisa} botol`);
                                }
                                setQty(val);
                            }}
                            min={1}
                            max={item.produkSisa}
                            required
                        />
                    </div>
                    <div className="text-sm text-zinc-500 float-right text-right">
                        Stok Tersedia: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.produkSisa} botol</span>
                        <br />
                        Harga/botol: Rp {item.hargaProduk.toLocaleString('id-ID')}
                        <br />
                        <b>Estimasi Pemasukan: Rp {(qty * item.hargaProduk).toLocaleString('id-ID')}</b>
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isLoading || qty > item.produkSisa || qty <= 0}>
                            {isLoading ? "Menyimpan..." : "Konfirmasi Jual"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
