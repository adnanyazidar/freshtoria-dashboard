"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getAuditLogExportData } from "@/actions/export";
import { ExportButton } from "@/components/export-button";

export type AuditLogItem = {
    id: string;
    time: string;
    user: string;
    action: string;
    module: string;
    details: string;
    ip: string;
}

export function AuditTable({
    logs,
    totalCount,
    currentPage,
    itemsPerPage,
    currentQ,
    currentModule
}: {
    logs: AuditLogItem[],
    totalCount: number,
    currentPage: number,
    itemsPerPage: number,
    currentQ: string,
    currentModule: string
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

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

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const handleExport = async () => {
        return await getAuditLogExportData({ q: currentQ, module: currentModule });
    };

    const exportColumns = [
        { header: "Waktu", dataKey: "time" },
        { header: "User", dataKey: "user" },
        { header: "Modul", dataKey: "module" },
        { header: "Aksi", dataKey: "action" },
        { header: "Detail", dataKey: "details" },
        { header: "IP", dataKey: "ip" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-zinc-950 p-4 rounded-md border shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Cari user atau action..."
                        className="pl-8"
                        value={currentQ}
                        onChange={(e) => {
                            handleUrlUpdate('q', e.target.value);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500 whitespace-nowrap hidden sm:inline-block">Filter Modul:</span>
                    <Select value={currentModule} onValueChange={(v) => handleUrlUpdate('module', v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Semua Modul" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Semua">Semua Modul</SelectItem>
                            <SelectItem value="User Management">User Management</SelectItem>
                            <SelectItem value="Inventory">Inventory</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Auth">Auth</SelectItem>
                        </SelectContent>
                    </Select>

                    <ExportButton
                        onExport={handleExport}
                        filename="Audit_Log"
                        columns={exportColumns}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow>
                            <TableHead className="font-semibold">Waktu</TableHead>
                            <TableHead className="font-semibold">User</TableHead>
                            <TableHead className="font-semibold">Modul</TableHead>
                            <TableHead className="font-semibold">Aksi</TableHead>
                            <TableHead className="font-semibold hidden md:table-cell">Detail</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap text-sm text-zinc-500">{log.time}</TableCell>
                                <TableCell className="font-medium">{log.user}</TableCell>
                                <TableCell>{log.module}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="font-mono text-[10px] tracking-wider">
                                        {log.action}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-zinc-600 dark:text-zinc-400">
                                    {log.details}
                                    <div className="text-[10px] text-zinc-400 mt-0.5">IP: {log.ip}</div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                                    Tidak ada riwayat untuk kriteria yang dipilih.
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
