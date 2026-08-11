import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const texts = JSON.parse(await readFile(path.join(root, 'content/i18n/sw-TZ/texts.json'), 'utf8'));
const audios = JSON.parse(await readFile(path.join(root, 'content/i18n/sw-TZ/audios.json'), 'utf8'));
const files = (await readdir(root)).filter((name) => /^pg\d+_sec\d+\.html$/.test(name)).sort();
const problems = [];
let steppers = 0;
let steps = 0;
let ids = 0;

function visit(value, file, trail = 'activity') {
  if (!value || typeof value !== 'object') return;
  if (typeof value.text === 'string' && /(?:prompt|title|option|label)/i.test(trail)) {
    ids += 1;
    if (!value.dataId) {
      problems.push(`${file}: ${trail} has text but no dataId: ${value.text.slice(0, 80)}`);
    } else if (!(value.dataId in texts)) {
      problems.push(`${file}: ${trail} ${value.dataId} missing from texts.json`);
    } else if (!audios[value.dataId]) {
      problems.push(`${file}: ${trail} ${value.dataId} missing from audios.json`);
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'text' || key === 'dataId') continue;
    if (Array.isArray(child)) child.forEach((item, index) => visit(item, file, `${trail}.${key}[${index}]`));
    else visit(child, file, `${trail}.${key}`);
  }
}

for (const file of files) {
  const html = await readFile(path.join(root, file), 'utf8');
  if (!html.includes('data-activity-variant="stepper"')) continue;
  steppers += 1;
  const match = html.match(/<script type="application\/json" data-editable-activity>([\s\S]*?)<\/script>/);
  if (!match) {
    problems.push(`${file}: missing editable activity JSON`);
    continue;
  }
  const data = JSON.parse(match[1]);
  steps += data.activity?.steps?.length ?? 0;
  visit(data.activity, file);
}

for (const [id, filename] of Object.entries(audios)) {
  if (!filename || !id.startsWith('pg')) continue;
  try {
    await access(path.join(root, 'content/i18n/sw-TZ/audio', filename));
  } catch {
    problems.push(`audio file missing: ${id} -> ${filename}`);
  }
}

console.log(`Audited ${steppers} steppers, ${steps} steps, and ${ids} spoken activity items.`);
if (problems.length) {
  console.log(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log('No missing stepper text IDs, audio mappings, or mapped page-audio files.');
}
