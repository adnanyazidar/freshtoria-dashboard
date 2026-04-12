// Script pembuatan admin
async function main() {
    console.log("Mencoba mendaftarkan admin...");
    try {
        const d = new Date().toISOString();
        const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Origin": process.env.BETTER_AUTH_URL || "http://localhost:3000"
            },
            body: JSON.stringify({
                name: "Admin",
                email: "admin@email.com",
                password: "password123",
                role: "Admin",
                status: true,
                lastLogin: d
            })
        });

        const data = await res.json();
        if (!res.ok) {
            console.error("Gagal! Response:", res.status, data);
            return;
        }

        console.log("Akun berhasil dibuat secara valid!");
        console.log("Credentials:", data.user);
    } catch (err) {
        console.error("Fetch request error:", err);
    }
}

main();
