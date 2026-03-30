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
import { updateUserData } from "@/actions/users";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditUserDialogProps {
    user: {
        id: string;
        name: string;
        username: string;
        role: string;
        status: string;
        lastLogin: string;
    };
    onEdit: (updatedUser: {
        id: string;
        name: string;
        username: string;
        role: string;
        status: string;
        lastLogin: string;
    }) => void;
}

export function EditUserDialog({ user, onEdit }: EditUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [name, setName] = useState(user.name);
    const [username, setUsername] = useState(user.username);
    const [role, setRole] = useState(user.role);
    const [status, setStatus] = useState(user.status);
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !username) {
            toast.error("Mohon isi Nama dan Username");
            return;
        }

        setLoading(true);

        try {
            await updateUserData(
                user.id,
                {
                    name,
                    username,
                    role,
                    status: status === "Aktif",
                    password: password || undefined,
                }
            );

            // Using simulated prop callback just to instantly reflect on table without relying solely on next/cache if router is slow locally.
            // Ensure status strings map back to the table expectation.
            onEdit({
                ...user,
                name,
                username,
                role,
                status: status === "Aktif" || (status as unknown as boolean) === true ? "Aktif" : "Non-Aktif"
            });

            toast.success("Akun berhasil diperbarui!");
            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Gagal memperbarui akun");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="h-4 w-4 text-zinc-500" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Akun Pengguna</DialogTitle>
                        <DialogDescription>
                            Ubah detail akun staff atau admin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullname">Nama Lengkap</Label>
                            <Input id="fullname" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password Baru (Opsional)</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Kosongkan jika tidak ingin mengubah password"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Peran (Role)</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={status === "Aktif" || (status as unknown as boolean) === true ? "Aktif" : "Non-Aktif"} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Aktif">Aktif</SelectItem>
                                    <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
