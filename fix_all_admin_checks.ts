import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'server', 'routes.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace all instances of role !== 'admin' with role check for both admin and super_admin
const oldPattern = /if \(user\?\.role !== 'admin'\) \{/g;
const newPattern = "if (user?.role !== 'admin' && user?.role !== 'super_admin') {";

const matches = content.match(oldPattern);
console.log(`Found ${matches?.length || 0} instances to replace`);

content = content.replace(oldPattern, newPattern);

fs.writeFileSync(filePath, content, 'utf-8');

console.log('✓ All role checks updated to support super_admin!');
