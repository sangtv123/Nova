import { signal, computed } from '@nova/signals';
import { registerIsland } from '@nova/islands';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function TodoIsland() {
  const todos = signal<Todo[]>([]);
  const inputValue = signal('');
  
  // Derived state: counts
  const totalCount = computed(() => todos.value.length);
  const completedCount = computed(() => todos.value.filter(t => t.completed).length);
  
  const addTodo = () => {
    if (!inputValue.value.trim()) return;
    
    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue.value,
      completed: false
    };
    
    todos.value = [...todos.value, newTodo];
    inputValue.value = '';
  };

  const toggleTodo = (id: number) => {
    todos.value = todos.value.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  };

  const removeTodo = (id: number) => {
    console.log('Removing todo:', id);
    todos.value = todos.value.filter(todo => todo.id !== id);
    console.log('New todos count:', todos.value.length);
  };

  const clearCompleted = () => {
    todos.value = todos.value.filter(t => !t.completed);
  };

  return (
    <div class="interactive-island todo-island" data-island="todo">
      <h3>Quest Log (Todo List)</h3>
      <p class="island-desc">Manage your tasks with fine-grained signal updates.</p>

      <div class="todo-input-group">
        <input 
          type="text" 
          placeholder="Add a new quest..." 
          value={() => inputValue.value}
          onInput={(e: any) => inputValue.value = e.target.value}
          onKeyDown={(e: any) => e.key === 'Enter' && addTodo()}
        />
        <button class="btn primary" onClick={addTodo}>Add</button>
      </div>

      <div class="todo-stats">
        {() => (
          <span>
            {completedCount.value} / {totalCount.value} completed
          </span>
        )}
        <button class="btn-link" onClick={clearCompleted}>Clear Completed</button>
      </div>

      <ul class="todo-list">
        {() => todos.value.length === 0 ? (
          <li class="empty-state">No quests found. Start by adding one!</li>
        ) : todos.value.map(todo => (
          <li class={todo.completed ? 'completed' : ''} key={todo.id}>
            <div class="todo-item">
              <input 
                type="checkbox" 
                checked={todo.completed} 
                onChange={() => toggleTodo(todo.id)} 
              />
              <span class="todo-text">{todo.text}</span>
              <button class="btn-delete" onClick={() => removeTodo(todo.id)}>×</button>
            </div>
          </li>
        ))}
      </ul>

      <style>{`
        .todo-island {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
        }
        .todo-input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .todo-input-group input {
          flex: 1;
          padding: 0.8rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          outline: none;
        }
        .todo-input-group input:focus {
          border-color: var(--primary);
        }
        .todo-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1rem;
        }
        .btn-link {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0;
        }
        .btn-link:hover {
          text-decoration: underline;
        }
        .todo-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .todo-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          margin-bottom: 0.5rem;
          transition: transform 0.2s;
        }
        .todo-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .todo-text {
          flex: 1;
        }
        li.completed .todo-text {
          text-decoration: line-through;
          opacity: 0.5;
        }
        .btn-delete {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.3);
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
          padding: 0 0.5rem;
        }
        .btn-delete:hover {
          color: #ff4d4d;
        }
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.3);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

// Register for client-side hydration
registerIsland('todo', () => Promise.resolve({ default: TodoIsland }));
