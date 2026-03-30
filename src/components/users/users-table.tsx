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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Edit2, Search, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { EditUserDialog } from "./edit-user-dialog";
import { deleteUser } from "@/actions/users";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type UserData = {
    id: string;
    name: string;
    username: string;
    role: string;
    status: string;
    lastLogin: string;
};

export function UsersTable({
    initialUsers,
    totalCount,
    currentPage,
    itemsPerPage,
    currentQ,
    currentRole
}: {
    initialUsers: UserData[],
    totalCount: number,
    currentPage: number,
    itemsPerPage: number,
    currentQ: string,
    currentRole: string
}) {
    const [users, setUsers] = useState<UserData[]>(initialUsers);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

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
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus user ini secara permanen?")) return;
        setDeletingId(id);
        try {
            await deleteUser(id);
            toast.success("Akun berhasil dihapus!");
            setUsers(users.filter(user => user.id !== id));
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus user.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (updatedUser: UserData) => {
        setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-zinc-950 p-4 rounded-md border shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Cari nama atau username..."
                        className="pl-8"
                        value={currentQ}
                        onChange={(e) => {
                            handleUrlUpdate('q', e.target.value);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500 whitespace-nowrap">Filter Role:</span>
                    <Select value={currentRole} onValueChange={(v) => handleUrlUpdate('role', v)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Semua Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Semua">Semua Role</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Staff">Staff</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow>
                            <TableHead className="font-semibold">Nama</TableHead>
                            <TableHead className="font-semibold">Username</TableHead>
                            <TableHead className="font-semibold">Role</TableHead>
                            <TableHead className="font-semibold hidden sm:table-cell">Last Login</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell className="text-zinc-500">{user.username}</TableCell>
                                <TableCell>
                                    {user.role === "admin" || user.role === "Admin" ? (
                                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:border-green-900 dark:text-green-400 dark:bg-green-900/20">
                                            <ShieldCheck className="mr-1 h-3 w-3" /> Admin
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:bg-blue-900/20">
                                            <ShieldAlert className="mr-1 h-3 w-3" /> Staff
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-zinc-500 text-sm">{user.lastLogin}</TableCell>
                                <TableCell>
                                    {user.status === "Aktif" ? (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Aktif</Badge>
                                    ) : (
                                        <Badge className="bg-zinc-100 text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400">Non-Aktif</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <EditUserDialog user={user} onEdit={handleEdit} />
                                        {user.status === "Aktif" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(user.id)}
                                                disabled={deletingId === user.id}
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
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
