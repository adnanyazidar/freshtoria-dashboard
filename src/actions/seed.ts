"use server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { auth } from "@/lib/auth"; // Accessing server Better-auth API

export async function createDefaultAdmin() {
    try {
        const dummyEmail = "admin@juicesync.local";
        const dummyPassword = "admin123";

        // Use better-auth natively so that the password is automatically standard hashed
        const user = await auth.api.signUpEmail({
            body: {
                email: dummyEmail,
                password: dummyPassword,
                name: "Administrator",
                role: "Admin",    // Insert additional mapping fields
                status: true,
                lastLogin: new Date()
            }
        });

        return { success: true, message: "Berhasil membuat akun admin. Silakan login menggunakan username: admin dan password: admin123" };
    } catch (e: any) {
        if (e.message && e.message.includes("User already exists")) {
            return { success: true, message: "Akun admin sudah terdaftar. Silakan lanjut login." };
        }
        return { success: false, message: e.message || "Gagal membuat akun" };
    }
}
