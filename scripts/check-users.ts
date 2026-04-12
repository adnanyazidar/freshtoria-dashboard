import { db } from '../src/db';
import { usersTable } from '../src/db/schema';

async function main() {
    const users = await db.select().from(usersTable);
    console.log("Users in database:", users);
    process.exit(0);
}
main();
