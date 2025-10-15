import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// In-memory store for demo
let nextId = 1;
const todos = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// List todos
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// Create todo
app.post('/api/todos', (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Invalid "text"' });
  }
  const todo = { id: nextId++, text: text.trim(), done: false, createdAt: Date.now() };
  todos.push(todo);
  res.status(201).json(todo);
});

// Update todo
app.put('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const { text, done } = req.body || {};
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
  res.json(todos[idx]);
});

// Delete todo
app.delete('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = todos.splice(idx, 1);
  res.json(removed);
});

// SPA fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`myapp2 running on http://localhost:${PORT}`);
});

