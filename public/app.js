const listEl = document.getElementById('todo-list');
const formEl = document.getElementById('todo-form');
const inputEl = document.getElementById('todo-input');
const statsEl = document.getElementById('stats');
const searchEl = document.getElementById('search-input');
const filtersEl = document.getElementById('filters');
const toggleAllBtn = document.getElementById('toggle-all');
const clearCompletedBtn = document.getElementById('clear-completed');
const dueEl = document.getElementById('due-input');
const voiceBtn = document.getElementById('voice-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const notifyBtn = document.getElementById('notify-btn');
const offlineBanner = document.getElementById('offline-banner');
const quoteEl = document.getElementById('quote');

let state = {
  filter: localStorage.getItem('filter') || 'all',
  q: ''
};

// PWA: register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Quotes of the day
const quotes = [
  'Yêu là cùng nhau viết nên những điều nhỏ bé.',
  'Mỗi việc làm hôm nay là hạt giống của ngày mai.',
  'Tình yêu là hành động, không chỉ là lời nói.',
  'Cùng nhau, mọi thứ đều trở nên đẹp hơn.',
];
if (quoteEl) {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  quoteEl.textContent = q;
}

// Offline-aware API with queue for writes
const QUEUE_KEY = 'offline_queue_v1';
const CACHE_KEY = 'todos_cache_v1';

function showOfflineBanner(show) {
  if (!offlineBanner) return;
  offlineBanner.style.display = show ? '' : 'none';
}

function enqueue(op) {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  q.push({ ...op, time: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  showOfflineBanner(true);
}

async function flushQueue() {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (!q.length) return;
  for (const op of q) {
    try {
      await fetch(op.path, {
        headers: { 'Content-Type': 'application/json' },
        method: op.method,
        body: op.body,
      });
    } catch (_) {
      return; // still offline
    }
  }
  localStorage.setItem(QUEUE_KEY, '[]');
  showOfflineBanner(false);
}

window.addEventListener('online', flushQueue);

async function api(path, options = {}) {
  const isWrite = options.method && options.method !== 'GET';
  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!isWrite && String(path).startsWith('/api/todos')) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }
    return data;
  } catch (err) {
    if (isWrite) {
      enqueue({ path, method: options.method || 'POST', body: options.body || null });
      return {}; // optimistic
    }
    if (String(path).startsWith('/api/todos')) {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      return cached;
    }
    throw err;
  }
}

async function loadTodos() {
  const url = new URL('/api/todos', window.location.origin);
  if (state.q) url.searchParams.set('q', state.q);
  if (state.filter && state.filter !== 'all') url.searchParams.set('filter', state.filter);
  const todos = await api(url.toString());
  render(todos);
  updateStats();
}

async function updateStats() {
  try {
    const s = await api('/api/stats');
    statsEl.textContent = `Tổng: ${s.total} • Đã xong: ${s.done} • Còn lại: ${s.pending}`;
    toggleAllBtn.textContent = s.pending === 0 && s.total > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả';
  } catch (_) {
    // ignore
  }
}

function render(todos) {
  listEl.innerHTML = '';
  if (!todos.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Chưa có việc nào. Hãy thêm!';
    listEl.appendChild(li);
    return;
  }
  for (const t of todos) {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.className = t.done ? 'done' : '';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = t.done;
    checkbox.addEventListener('change', async () => {
      await api(`/api/todos/${t.id}`, {
        method: 'PUT',
        body: JSON.stringify({ done: checkbox.checked }),
      });
      if (checkbox.checked) celebrate();
      loadTodos();
    });

    const span = document.createElement('span');
    span.textContent = t.text;
    span.title = 'Nhấp đúp để sửa';
    span.addEventListener('dblclick', () => startEdit(li, t));

    const meta = document.createElement('small');
    meta.style.color = 'var(--muted)';
    if (t.dueAt) {
      const d = new Date(t.dueAt);
      const overdue = Date.now() > t.dueAt && !t.done;
      meta.textContent = `• hạn: ${d.toLocaleString()}` + (overdue ? ' (trễ)' : '');
    }

    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = 'Xóa';
    del.addEventListener('click', async () => {
      await api(`/api/todos/${t.id}`, { method: 'DELETE' });
      loadTodos();
    });

    li.append(checkbox, span, meta, del);
    listEl.appendChild(li);
  }
}

function startEdit(li, todo) {
  const span = li.querySelector('span');
  const input = document.createElement('input');
  input.value = todo.text;
  input.style.minWidth = '120px';
  li.replaceChild(input, span);
  input.focus();

  const finish = async (commit) => {
    if (commit) {
      const text = input.value.trim();
      if (text && text !== todo.text) {
        await api(`/api/todos/${todo.id}`, { method: 'PUT', body: JSON.stringify({ text }) });
      }
    }
    loadTodos();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;
  const body = { text };
  if (dueEl && dueEl.value) body.dueAt = new Date(dueEl.value).toISOString();
  await api('/api/todos', { method: 'POST', body: JSON.stringify(body) });
  inputEl.value = '';
  if (dueEl) dueEl.value = '';
  loadTodos();
});

// Search debounce
let searchTimer;
searchEl?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  state.q = searchEl.value.trim();
  searchTimer = setTimeout(() => loadTodos(), 200);
});

// Filters
filtersEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  state.filter = btn.dataset.filter;
  localStorage.setItem('filter', state.filter);
  // visually mark active filter
  [...filtersEl.querySelectorAll('button')].forEach(b => b.disabled = b.dataset.filter === state.filter);
  loadTodos();
});

// Bulk actions
toggleAllBtn?.addEventListener('click', async () => {
  // decide target state based on button label from stats
  const s = await api('/api/stats');
  const done = !(s.pending === 0 && s.total > 0);
  await api('/api/todos/toggle-all', { method: 'POST', body: JSON.stringify({ done }) });
  loadTodos();
});

clearCompletedBtn?.addEventListener('click', async () => {
  await api('/api/todos/clear-completed', { method: 'POST' });
  loadTodos();
});

// init UI state
if (filtersEl) {
  [...filtersEl.querySelectorAll('button')].forEach(b => b.disabled = b.dataset.filter === state.filter);
}

loadTodos();

// Voice input
voiceBtn?.addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return alert('Trình duyệt chưa hỗ trợ Voice');
  const rec = new SR();
  rec.lang = 'vi-VN';
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    inputEl.value = text;
  };
  rec.start();
});

// Export / Import
exportBtn?.addEventListener('click', async () => {
  const data = await api('/api/todos');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `love-list-${Date.now()}.json`;
  a.click();
});

importBtn?.addEventListener('click', () => importFile?.click());
importFile?.addEventListener('change', async () => {
  const file = importFile.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) throw new Error('invalid');
    for (const it of arr) {
      if (typeof it.text === 'string') {
        await api('/api/todos', { method: 'POST', body: JSON.stringify({ text: it.text }) });
      }
    }
    loadTodos();
  } catch {
    alert('File không hợp lệ');
  } finally {
    importFile.value = '';
  }
});

// Notifications
notifyBtn?.addEventListener('click', async () => {
  if (!('Notification' in window)) return alert('Trình duyệt không hỗ trợ thông báo');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return;
  new Notification('Thông báo đã bật 💖', { body: 'Chúng mình sẽ nhắc bạn đúng hẹn!' });
});

function celebrate() {
  const confetti = document.createElement('div');
  confetti.style.position = 'fixed';
  confetti.style.left = '0';
  confetti.style.top = '0';
  confetti.style.width = '100%';
  confetti.style.height = '0';
  confetti.style.pointerEvents = 'none';
  document.body.appendChild(confetti);
  const count = 24;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.textContent = '💗';
    s.style.position = 'fixed';
    s.style.left = Math.random() * 100 + 'vw';
    s.style.top = '-5vh';
    s.style.fontSize = (12 + Math.random() * 20) + 'px';
    s.style.transition = 'transform 1.5s ease, opacity 1.5s ease';
    confetti.appendChild(s);
    requestAnimationFrame(() => {
      s.style.transform = `translateY(${100 + Math.random() * 80}vh) rotate(${(Math.random()*360)|0}deg)`;
      s.style.opacity = '0';
    });
  }
  setTimeout(() => confetti.remove(), 1600);
}

window.addEventListener('offline', () => showOfflineBanner(true));
window.addEventListener('online', () => showOfflineBanner(false));
