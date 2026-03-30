import { AddItemDialog } from "@/components/inventory/add-item-dialog";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { db } from "@/db";
import { inventoryTable } from "@/db/schema";
import { format } from "date-fns";
import { sql, like, eq, and, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function InventoryPage(props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const userRole = session?.user?.role || "Staff";

    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const q = searchParams?.q as string || "";
    const status = searchParams?.status as string || "Semua";
    const itemsPerPage = 5;

    const conditions = [];
    if (q) {
        conditions.push(
            or(
                like(inventoryTable.namaBarang, `%${q}%`),
                like(inventoryTable.skuId, `%${q}%`)
            )
        );
    }
    if (status !== "Semua") {
        conditions.push(eq(inventoryTable.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryTable)
        .where(whereClause);
    const totalCount = totalCountResult[0].count;

    const defaultData = await db
        .select()
        .from(inventoryTable)
        .where(whereClause)
        .limit(itemsPerPage)
        .offset((page - 1) * itemsPerPage);

    const mappedInventory = defaultData.map((item) => ({
        skuId: item.skuId,
        batchId: item.batchId || "",
        name: item.namaBarang,
        satuan: item.satuan,
        entryDate: format(item.tanggalMasuk, "dd/MM/yyyy"),
        stockIn: item.stokMasuk,
        stockOut: item.stokKeluar,
        stockFinal: item.stokAkhir,
        totalNilai: item.totalNilai,
        unitPrice: item.hargaSatuan,
        expiredDate: item.expiredDate ? format(item.expiredDate, "dd/MM/yyyy") : "-",
        status: item.status,
        note: item.catatan || ""
    }));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Manajemen stok bahan baku dan perhitungan nilai inventaris berjalan.
                    </p>
                </div>
                <div>
                    <AddItemDialog />
                </div>
            </div>
            <div>
                <InventoryTable
                    inventory={mappedInventory}
                    totalCount={totalCount}
                    currentPage={page}
                    itemsPerPage={itemsPerPage}
                    currentQ={q}
                    currentStatus={status}
                    userRole={userRole}
                />
            </div>
        </div>
    );
}
