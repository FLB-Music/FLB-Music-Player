import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(root, 'src');
const output = path.join(root, 'www');

await mkdir(output, { recursive: true });
for (const file of ['index.html', 'app.css', 'app.js']) {
  await copyFile(path.join(source, file), path.join(output, file));
}
console.log(`Mobile party client copied to ${output}`);
