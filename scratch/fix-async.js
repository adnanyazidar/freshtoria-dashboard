import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/Adnan Yazid Ar/Music/frestoria/src/actions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // db.transaction((tx) => { => db.transaction(async (tx) => {
  content = content.replace(/db\.transaction\(\(tx\) => \{/g, 'db.transaction(async (tx) => {');
  
  // tx.insert => await tx.insert
  content = content.replace(/(?<!await\s)tx\.insert/g, 'await tx.insert');
  // tx.update => await tx.update
  content = content.replace(/(?<!await\s)tx\.update/g, 'await tx.update');
  // tx.delete => await tx.delete
  content = content.replace(/(?<!await\s)tx\.delete/g, 'await tx.delete');
  // tx.select => await tx.select
  content = content.replace(/(?<!await\s)tx\.select/g, 'await tx.select');
  
  // .run() => remove
  content = content.replace(/\.run\(\)/g, '');
  // .all() => remove
  content = content.replace(/\.all\(\)/g, '');
  
  // Ensure db.transaction is awaited
  content = content.replace(/(?<!await\s)db\.transaction/g, 'await db.transaction');
  
  // Fix db.select().from(table).where(eq(...)).all() to await db.select()
  // Ensure db.select() without await is padded.
  content = content.replace(/=\s+(db\.select\(\))/g, '= await $1');
  // Specifically: const recordResult = db.select().from(...)
  content = content.replace(/=\s*db\.select\(\)/g, '= await db.select()');

  fs.writeFileSync(filePath, content);
}
console.log('Fixed async issues in actions!');
