// copy-static.js
import { copyFileSync, existsSync } from 'fs';

const from = './static.json';
const to = './dist/static.json';

if (!existsSync(from)) {
  console.error('❌ static.json not found.');
  process.exit(1);
}

try {
  copyFileSync(from, to);
  console.log('✅ static.json copied to dist/');
} catch (err) {
  console.error('❌ Copy failed:', err.message);
}
