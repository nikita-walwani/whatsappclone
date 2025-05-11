import { copyFile } from 'fs/promises';
import { existsSync } from 'fs';

const from = './static.json';
const to = './dist/static.json';

if (!existsSync(from)) {
  console.error('❌ static.json not found in root directory.');
  process.exit(1);
}

try {
  await copyFile(from, to);
  console.log('✅ static.json copied to dist/');
} catch (err) {
  console.error('❌ Copy failed:', err.message);
}
