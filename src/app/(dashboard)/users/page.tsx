import { UsersTable } from "@/components/users/users-table";
import { AddUserDialog } from "@/components/users/add-user-dialog";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { format } from "date-fns";
import { sql, like, eq, and, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function UsersPage(props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session?.user?.role !== "Admin") {
        redirect("/");
    }

    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const q = searchParams?.q as string || "";
    const role = searchParams?.role as string || "Semua";
    const itemsPerPage = 5;

    const conditions = [];
    if (q) {
        conditions.push(
            or(
                like(usersTable.name, `%${q}%`),
                like(usersTable.id, `%${q}%`) // search by username logic relies on db schema mapping
            )
        );
    }
    if (role !== "Semua") {
        conditions.push(eq(usersTable.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(usersTable)
        .where(whereClause);
    const totalCount = totalCountResult[0].count;

    const defaultData = await db
        .select()
        .from(usersTable)
        .where(whereClause)
        .limit(itemsPerPage)
        .offset((page - 1) * itemsPerPage);

    const mappedUsers = defaultData.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.name,
        role: u.role,
        status: u.status ? "Aktif" : "Non-Aktif",
        lastLogin: u.lastLogin ? format(u.lastLogin, "dd/MM/yyyy HH:mm") : "-",
    }));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Kelola akses, role, dan keamanan akun staff Freshtoria.
                    </p>
                </div>
                <div>
                    <AddUserDialog />
                </div>
            </div>
            <div>
                <UsersTable
                    initialUsers={mappedUsers}
                    totalCount={totalCount}
                    currentPage={page}
                    itemsPerPage={itemsPerPage}
                    currentQ={q}
                    currentRole={role}
                />
            </div>
        </div>
    );
}
