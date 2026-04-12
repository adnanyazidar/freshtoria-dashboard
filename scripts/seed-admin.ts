import { auth } from "../src/lib/auth";

async function main() {
    console.log("Creating new admin account for Freshtoria...");

    try {
        const user = await auth.api.signUpEmail({
            body: {
                email: "admin@freshtoria.com",
                password: "password123",
                name: "Administrator",
                role: "Admin",
                status: true,
                lastLogin: new Date(),
            }
        });

        console.log("Success! Administrator created.");
        console.log(user);
    } catch (e) {
        console.error("Failed to create admin:");
        console.error(e);
    }
}

main();
