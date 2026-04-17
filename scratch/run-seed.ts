import 'dotenv/config';
import { createDefaultAdmin } from '../src/actions/seed';

async function main() {
    console.log("Menghubungkan ke Turso DB...");
    const result = await createDefaultAdmin();
    console.log("Response:", result);
}

main().catch(console.error);
