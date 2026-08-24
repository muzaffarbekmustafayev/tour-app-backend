import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importDataContent = fs.readFileSync(path.join(__dirname, 'importData.js'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'seed.js'), importDataContent, 'utf8');
console.log('✅ seed.js va importData.js sinxronlashtirildi.');
