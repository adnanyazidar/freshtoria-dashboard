"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportButtonProps {
    onExport: () => Promise<any[]>;
    filename: string;
    columns: { header: string; dataKey: string }[];
}

export function ExportButton({ onExport, filename, columns }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            toast.loading("Menyiapkan data Excel...", { id: "export" });
            const data = await onExport();

            if (data.length === 0) {
                toast.error("Tidak ada data untuk diexport", { id: "export" });
                return;
            }

            // Format data for Excel
            const excelData = data.map(item => {
                const row: any = {};
                columns.forEach(col => {
                    row[col.header] = item[col.dataKey];
                });
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

            XLSX.writeFile(workbook, `${filename}.xlsx`);
            toast.success("Berhasil mengunduh Excel!", { id: "export" });
        } catch (error) {
            console.error("Export Excel error", error);
            toast.error("Gagal mengunduh Excel", { id: "export" });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            setIsExporting(true);
            toast.loading("Menyiapkan data PDF...", { id: "export" });
            const data = await onExport();

            if (data.length === 0) {
                toast.error("Tidak ada data untuk diexport", { id: "export" });
                return;
            }

            const doc = new jsPDF();

            doc.setFontSize(14);
            doc.text(`Laporan ${filename}`, 14, 15);
            doc.setFontSize(10);
            doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);

            const tableColumn = columns.map(col => col.header);
            const tableRows = data.map(item => columns.map(col => item[col.dataKey]));

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 30,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] }
            });

            doc.save(`${filename}.pdf`);
            toast.success("Berhasil mengunduh PDF!", { id: "export" });
        } catch (error) {
            console.error("Export PDF error", error);
            toast.error("Gagal mengunduh PDF", { id: "export" });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={isExporting}>
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                    Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                    Export as Excel
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
