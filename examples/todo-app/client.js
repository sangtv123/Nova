import { signal, computed, effect } from '@nova/signals';

// 1. State
const todos = signal([
  { id: 1, text: 'Learn Nova Signals', completed: true },
  { id: 2, text: 'Build a Todo App', completed: false }
]);
const input = signal('');
const filter = signal('all');
let nextId = 3;

// 2. Derived State (Computed)
const filteredTodos = computed(() => {
  const all = todos.value;
  switch (filter.value) {
    case 'active': return all.filter(t => !t.completed);
    case 'completed': return all.filter(t => t.completed);
    default: return all;
  }
});

const stats = computed(() => ({
  total: todos.value.length,
  completed: todos.value.filter(t => t.completed).length,
  active: todos.value.filter(t => !t.completed).length,
}));

// 3. Actions
const addTodo = () => {
  if (input.value.trim()) {
    todos.value = [...todos.value, { id: nextId++, text: input.value, completed: false }];
    input.value = '';
    document.getElementById('new-todo').value = '';
  }
};

const toggleTodo = (id) => {
  todos.value = todos.value.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
};

const deleteTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id);
};

const clearCompleted = () => {
  todos.value = todos.value.filter(t => !t.completed);
};

// 4. Bind to DOM
const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statCompleted = document.getElementById('stat-completed');
const todoListContainer = document.getElementById('todo-list-container');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// Effect: Update Stats
effect(() => {
  statTotal.textContent = stats.value.total;
  statActive.textContent = stats.value.active;
  statCompleted.textContent = stats.value.completed;
  
  clearCompletedBtn.style.display = stats.value.completed > 0 ? 'block' : 'none';
});

// Effect: Update Filter Buttons
effect(() => {
  filterBtns.forEach(btn => {
    if (btn.dataset.filter === filter.value) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
});

// Effect: Render Todo List
effect(() => {
  const list = filteredTodos.value;
  
  if (list.length === 0) {
    todoListContainer.innerHTML = '<div class="empty">No todos to show</div>';
    return;
  }

  const ul = document.createElement('ul');
  list.forEach(todo => {
    const li = document.createElement('li');
    if (todo.completed) li.classList.add('completed');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    
    const span = document.createElement('span');
    span.textContent = todo.text;
    
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteTodo(todo.id));
    
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    ul.appendChild(li);
  });
  
  todoListContainer.innerHTML = '';
  todoListContainer.appendChild(ul);
});

// 5. Event Listeners
document.getElementById('new-todo').addEventListener('input', (e) => {
  input.value = e.target.value;
});

document.getElementById('new-todo').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo();
});

document.getElementById('add-todo').addEventListener('click', addTodo);

document.getElementById('clear-completed').addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    filter.value = e.target.dataset.filter;
  });
});

console.log('✅ Nova Todo App initialized!');
