const listEl = document.getElementById('todo-list');
const formEl = document.getElementById('todo-form');
const inputEl = document.getElementById('todo-input');

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadTodos() {
  const todos = await api('/api/todos');
  render(todos);
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
      loadTodos();
    });

    const span = document.createElement('span');
    span.textContent = t.text;

    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = 'Xóa';
    del.addEventListener('click', async () => {
      await api(`/api/todos/${t.id}`, { method: 'DELETE' });
      loadTodos();
    });

    li.append(checkbox, span, del);
    listEl.appendChild(li);
  }
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;
  await api('/api/todos', { method: 'POST', body: JSON.stringify({ text }) });
  inputEl.value = '';
  loadTodos();
});

loadTodos();

