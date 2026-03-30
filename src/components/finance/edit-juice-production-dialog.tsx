"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateJuiceProduction } from "@/actions/juice-production";
import { Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export function EditJuiceProductionDialog({ item }: { item: any }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Parse the date back to suitable format for input default
    const extractDate = (dateStr: string) => {
        if (!dateStr || dateStr === "-") return "";
        // dateStr assuming format like "dd/MM/yyyy"
        const parts = dateStr.split("/");
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        // fallback
        return new Date().toISOString().split('T')[0];
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            await updateJuiceProduction(item.id, {
                menuSmoothies: formData.get("menuSmoothies") as string,
                produksiBotol: Number(formData.get("produksiBotol")),
                hargaProduk: Number(formData.get("hargaProduk")),
                tanggalMasuk: new Date(formData.get("tanggalMasuk") as string),
                expiredDate: new Date(formData.get("expiredDate") as string),
                mitra: formData.get("mitra") as string,
                pengeluaran: Number(formData.get("pengeluaran")),
                status: formData.get("status") as string
            });

            toast.success("Data produksi berhasil diupdate!");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Gagal mengupdate produksi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Produksi & Penjualan Jus</DialogTitle>
                    <DialogDescription>
                        Ubah data produksi jus dan otomatis sesuaikan alur kas.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor={`menuSmoothies-${item.id}`}>Menu / Varian Jus *</Label>
                        <Input id={`menuSmoothies-${item.id}`} name="menuSmoothies" required defaultValue={item.menuSmoothies} />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor={`mitra-${item.id}`}>Mitra / Penyalur (Opsional)</Label>
                        <Input id={`mitra-${item.id}`} name="mitra" defaultValue={item.mitra} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`produksiBotol-${item.id}`}>Jumlah Produksi (Botol) *</Label>
                        <Input id={`produksiBotol-${item.id}`} name="produksiBotol" type="number" required min="0" defaultValue={item.produksiBotol} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`hargaProduk-${item.id}`}>Harga Per Botol (Rp) *</Label>
                        <Input id={`hargaProduk-${item.id}`} name="hargaProduk" type="number" required min="0" defaultValue={item.hargaProduk} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`terjual-${item.id}`}>Total Terjual (Botol)</Label>
                        <Input id={`terjual-${item.id}`} name="terjual" type="number" min="0" defaultValue={item.terjual} readOnly className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500" title="Gunakan tombol Jual untuk menambah penjualan" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`pengeluaran-${item.id}`}>Biaya Produksi / Restock (Rp)</Label>
                        <Input id={`pengeluaran-${item.id}`} name="pengeluaran" type="number" min="0" defaultValue={item.pengeluaran} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`status-${item.id}`}>Status Pembayaran</Label>
                        <Select name="status" defaultValue={item.status || "Not Payment"}>
                            <SelectTrigger id={`status-${item.id}`}>
                                <SelectValue placeholder="Pilih status pembayaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Not Payment">Not Payment</SelectItem>
                                <SelectItem value="Success Payment">Success Payment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`tanggalMasuk-${item.id}`}>Tanggal Produksi *</Label>
                        <Input id={`tanggalMasuk-${item.id}`} name="tanggalMasuk" type="date" required
                            defaultValue={extractDate(item.tanggalMasuk)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`expiredDate-${item.id}`}>Tanggal Expired *</Label>
                        <Input id={`expiredDate-${item.id}`} name="expiredDate" type="date" required
                            defaultValue={extractDate(item.expiredDate)} />
                    </div>

                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
