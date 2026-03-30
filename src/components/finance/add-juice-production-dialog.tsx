"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addJuiceProduction } from "@/actions/juice-production";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddJuiceProductionDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            await addJuiceProduction({
                menuSmoothies: formData.get("menuSmoothies") as string,
                produksiBotol: Number(formData.get("produksiBotol")),
                hargaProduk: Number(formData.get("hargaProduk")),
                tanggalMasuk: new Date(formData.get("tanggalMasuk") as string),
                expiredDate: new Date(formData.get("expiredDate") as string),
                mitra: formData.get("mitra") as string,
                pengeluaran: Number(formData.get("pengeluaran"))
            });

            toast.success("Data produksi berhasil ditambahkan!");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Gagal menambahkan produksi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shrink-0 bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Catat Produksi Jus
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Catat Produksi & Penjualan Jus</DialogTitle>
                    <DialogDescription>
                        Masukkan detail batch produksi jus baru, alokasi mitra, serta data pembayaran cash flow-nya.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="menuSmoothies">Menu / Varian Jus *</Label>
                        <Input id="menuSmoothies" name="menuSmoothies" required placeholder="Mangga, Strawberry, dll" />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="mitra">Mitra / Penyalur (Opsional)</Label>
                        <Input id="mitra" name="mitra" placeholder="Nama warung / gofood" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="produksiBotol">Jumlah Produksi (Botol) *</Label>
                        <Input id="produksiBotol" name="produksiBotol" type="number" required min="0" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hargaProduk">Harga Per Botol (Rp) *</Label>
                        <Input id="hargaProduk" name="hargaProduk" type="number" required min="0" placeholder="0" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pengeluaran">Biaya Produksi / Restock (Rp)</Label>
                        <Input id="pengeluaran" name="pengeluaran" type="number" min="0" placeholder="0" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tanggalMasuk">Tanggal Produksi *</Label>
                        <Input id="tanggalMasuk" name="tanggalMasuk" type="date" required
                            defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expiredDate">Tanggal Expired *</Label>
                        <Input id="expiredDate" name="expiredDate" type="date" required />
                    </div>

                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Menyimpan..." : "Simpan Data Produksi"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
