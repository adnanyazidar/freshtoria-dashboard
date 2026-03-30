"use server";

import { db } from "@/db";
import { usersTable, auditTrailTable, accountTable, sessionTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

function generateId() {
    return crypto.randomUUID();
}

export async function toggleUserStatus(targetUserId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const adminUserId = session.user.id;

    const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, targetUserId));

    if (!user) throw new Error("User not found");

    const newStatus = !user.status;

    await db
        .update(usersTable)
        .set({ status: newStatus })
        .where(eq(usersTable.id, targetUserId));

    await db.insert(auditTrailTable).values({
        id: generateId(),
        userId: adminUserId,
        action: "Update",
        entityType: "User Management",
        targetUser: targetUserId,
        oldData: JSON.stringify({ status: user.status }),
        newData: JSON.stringify({ status: newStatus }),
        timestamp: new Date(),
    });

    revalidatePath("/users");
    return { success: true, status: newStatus };
}

export async function updateUserData(
    targetUserId: string,
    data: {
        name: string;
        username: string;
        role: string;
        status: boolean;
        password?: string;
    }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const adminUserId = session.user.id;

    const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, targetUserId));

    if (!user) throw new Error("User not found");

    const updatedData = {
        name: data.name,
        email: `${data.username}@freshtoria.com`, // Fixed outdated juicesync.local domain
        role: data.role,
        status: data.status,
    };

    await db
        .update(usersTable)
        .set(updatedData)
        .where(eq(usersTable.id, targetUserId));

    if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await db
            .update(accountTable)
            .set({ password: hashedPassword })
            .where(eq(accountTable.userId, targetUserId));
    }

    await db.insert(auditTrailTable).values({
        id: generateId(),
        userId: adminUserId,
        action: "Update Full",
        entityType: "User Management",
        targetUser: targetUserId,
        oldData: JSON.stringify(user),
        newData: JSON.stringify({ ...user, ...updatedData }),
        timestamp: new Date(),
    });

    revalidatePath("/users");
    return { success: true };
}

export async function deleteUser(targetUserId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");
    const adminUserId = session.user.id;

    const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, targetUserId));

    if (!user) throw new Error("User not found");

    await db.transaction(async (tx) => {
        await tx.delete(sessionTable).where(eq(sessionTable.userId, targetUserId));
        await tx.delete(accountTable).where(eq(accountTable.userId, targetUserId));
        await tx.delete(usersTable).where(eq(usersTable.id, targetUserId));

        await tx.insert(auditTrailTable).values({
            id: generateId(),
            userId: adminUserId,
            action: "Delete",
            entityType: "User Management",
            targetUser: targetUserId,
            oldData: JSON.stringify(user),
            timestamp: new Date(),
        });
    });

    revalidatePath("/users");
    return { success: true };
}
