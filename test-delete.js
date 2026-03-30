const { db } = require('./src/db/index.ts');
const { cashFlowTable } = require('./src/db/schema.ts');

async function testDelete() {
    const result = await db.delete(cashFlowTable).all();
    console.log('Result:', result);
}
testDelete().catch(console.error);
