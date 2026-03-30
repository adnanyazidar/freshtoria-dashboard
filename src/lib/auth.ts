import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
            user: schema.usersTable,
            session: schema.sessionTable,
            account: schema.accountTable,
            verification: schema.verificationTable,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: { type: "string", required: true, defaultValue: "Staff" },
            status: { type: "boolean", required: true, defaultValue: true },
            lastLogin: { type: "date" },
        },
    },
    trustedOrigins: [
        "http://localhost:3000",
        "https://increasingly-formation-realtors-licenses.trycloudflare.com"
    ],
});
