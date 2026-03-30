import { AuditTable } from "@/components/audit/audit-table";

import { db } from "@/db";
import { auditTrailTable, usersTable } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuditPage(props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const q = searchParams?.q as string || "";
    const module = searchParams?.module as string || "Semua";
    const itemsPerPage = 10;

    const conditions = [];
    if (module !== "Semua") {
        conditions.push(eq(auditTrailTable.entityType, module));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // To properly count and paginate with name search, it's easier to fetch everything or do a joined count. 
    // Since we join `usersTable` and search by `userName` or `action`, doing full server-side search is best with a join.
    const query = db
        .select({
            id: auditTrailTable.id,
            action: auditTrailTable.action,
            module: auditTrailTable.entityType,
            timestamp: auditTrailTable.timestamp,
            userId: auditTrailTable.userId,
            oldData: auditTrailTable.oldData,
            newData: auditTrailTable.newData,
            ip: auditTrailTable.ipAddress,
            userName: usersTable.name
        })
        .from(auditTrailTable)
        .leftJoin(usersTable, eq(auditTrailTable.userId, usersTable.id))
        .where(whereClause)
        .orderBy(desc(auditTrailTable.timestamp));

    let allLogs = await query;

    // Client-like search on the server for simplicity since `action` and `userName` are what we search
    if (q) {
        const lowerQ = q.toLowerCase();
        allLogs = allLogs.filter(log =>
            (log.userName && log.userName.toLowerCase().includes(lowerQ)) ||
            log.action.toLowerCase().includes(lowerQ)
        );
    }

    const totalCount = allLogs.length;
    const paginatedLogs = allLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const auditLogs = paginatedLogs.map(log => {
        let details = "-";
        if (log.action === "Create" || log.action === "Delete") {
            details = log.action === "Create" ? `Menambahkan data baru` : `Menghapus data`;
        } else if (log.action.includes("Update")) {
            details = `Memperbarui data`;
        }

        return {
            id: log.id,
            time: format(log.timestamp, "dd/MM/yyyy HH:mm:ss"),
            user: log.userName || log.userId,
            action: log.action,
            module: log.module,
            details: details,
            ip: log.ip || "Unknown"
        };
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Sistem pencatatan aktivitas pengguna dan perubahan data.
                    </p>
                </div>
            </div>
            <AuditTable
                logs={auditLogs}
                totalCount={totalCount}
                currentPage={page}
                itemsPerPage={itemsPerPage}
                currentQ={q}
                currentModule={module}
            />
        </div>
    );
}
