import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { load as loadStore, save as saveStore, dataPath } from './store.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Load persisted todos (file-based) and track next id
let nextId = 1;
const todos = [];

async function initStore() {
  const loaded = await loadStore();
  if (Array.isArray(loaded) && loaded.length) {
    todos.splice(0, todos.length, ...loaded);
    nextId = Math.max(...todos.map(t => t.id), 0) + 1;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// List todos with optional filters: ?q=keyword&filter=all|active|completed
app.get('/api/todos', (req, res) => {
  const { q = '', filter = 'all' } = req.query;
  let items = todos.slice();
  if (q) {
    const needle = String(q).toLowerCase();
    items = items.filter(t => t.text.toLowerCase().includes(needle));
  }
  if (filter === 'active') items = items.filter(t => !t.done);
  if (filter === 'completed') items = items.filter(t => t.done);
  res.json(items);
});

// Create todo
app.post('/api/todos', async (req, res) => {
  const { text, dueAt } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Invalid "text"' });
  }
  const todo = { id: nextId++, text: text.trim(), done: false, createdAt: Date.now() };
  if (dueAt !== undefined) {
    const ts = typeof dueAt === 'string' ? Date.parse(dueAt) : Number(dueAt);
    if (!Number.isNaN(ts)) todo.dueAt = ts;
  }
  todos.push(todo);
  await saveStore(todos);
  res.status(201).json(todo);
});

// Update todo
app.put('/api/todos/:id', async (req, res) => {
  const id = Number(req.params.id);
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const { text, done, dueAt } = req.body || {};
  if (text !== undefined) {
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Invalid "text"' });
    }
    todos[idx].text = text.trim();
  }
  if (done !== undefined) {
    if (typeof done !== 'boolean') return res.status(400).json({ error: 'Invalid "done"' });
    todos[idx].done = done;
  }
  if (dueAt !== undefined) {
    if (dueAt === null || dueAt === '') {
      delete todos[idx].dueAt;
    } else {
      const ts = typeof dueAt === 'string' ? Date.parse(dueAt) : Number(dueAt);
      if (Number.isNaN(ts)) return res.status(400).json({ error: 'Invalid "dueAt"' });
      todos[idx].dueAt = ts;
    }
  }
  await saveStore(todos);
  res.json(todos[idx]);
});

// Delete todo
app.delete('/api/todos/:id', async (req, res) => {
  const id = Number(req.params.id);
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = todos.splice(idx, 1);
  await saveStore(todos);
  res.json(removed);
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  res.json({ total, done, pending: total - done });
});

// Bulk: clear completed
app.post('/api/todos/clear-completed', async (req, res) => {
  const before = todos.length;
  for (let i = todos.length - 1; i >= 0; i--) {
    if (todos[i].done) todos.splice(i, 1);
  }
  await saveStore(todos);
  res.json({ removed: before - todos.length });
});

// Bulk: toggle all
app.post('/api/todos/toggle-all', async (req, res) => {
  const { done } = req.body || {};
  if (typeof done !== 'boolean') return res.status(400).json({ error: 'Invalid "done"' });
  for (const t of todos) t.done = done;
  await saveStore(todos);
  res.json({ total: todos.length, done });
});

// SPA fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

initStore().then(() => {
  app.listen(PORT, () => {
    console.log(`myapp2 running on http://localhost:${PORT}`);
    console.log(`Data file: ${dataPath()}`);
  });
});
