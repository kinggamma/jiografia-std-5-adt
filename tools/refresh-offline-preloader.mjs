import { readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const output = path.join(root, 'assets', 'offline-preloader.js');
const source = await readFile(output, 'utf8');
const marker = '  var INLINE = ';
const start = source.indexOf(marker) + marker.length;
const end = source.indexOf(';\n  var BASE_DIR', start);

if (start === marker.length - 1 || end === -1) {
  throw new Error('Could not locate INLINE data in offline-preloader.js');
}

const inline = JSON.parse(source.slice(start, end));
let refreshed = 0;

for (const key of Object.keys(inline)) {
  if (!key.endsWith('.json')) continue;
  const file = path.join(root, key.replace(/^\.\//, ''));
  try {
    await access(file, constants.R_OK);
  } catch {
    continue;
  }
  inline[key] = JSON.parse(await readFile(file, 'utf8'));
  refreshed += 1;
}

await writeFile(output, `${source.slice(0, start)}${JSON.stringify(inline)}${source.slice(end)}`);
console.log(`Refreshed ${refreshed} offline JSON resources.`);
