"use server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { auth } from "@/lib/auth"; // Accessing server Better-auth API

export async function createDefaultAdmin() {
    try {
        const dummyEmail = process.env.ADMIN_EMAIL || "admin@juicesync.local";
        // In production, fallback to a secure random password if not provided
        const fallbackPassword = process.env.NODE_ENV === "production" 
            ? Math.random().toString(36).slice(-12) // Just as a secure fallback
            : "admin123";
        const dummyPassword = process.env.ADMIN_PASSWORD || fallbackPassword;

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
