import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'todos.json');

async function ensureDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (_) {
    // ignore
  }
}

export async function load() {
  await ensureDir();
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (err) {
    return [];
  }
}

let pending = null;
export async function save(todos) {
  await ensureDir();
  const data = JSON.stringify(todos, null, 2);
  // simple debounce to coalesce rapid writes
  if (pending) clearTimeout(pending);
  await new Promise((resolve) => {
    pending = setTimeout(async () => {
      try {
        await fs.writeFile(dataFile, data, 'utf8');
      } finally {
        pending = null;
        resolve();
      }
    }, 50);
  });
}

export function dataPath() {
  return dataFile;
}

