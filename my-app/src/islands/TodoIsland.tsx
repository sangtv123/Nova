import { signal } from '@nova/signals';
import { inject, onMount } from '@nova/runtime';
import { registerIsland } from '@nova/islands';
import { TodoService } from '../services/TodoService';

export function TodoIsland() {
  const service = inject(TodoService);
  const inputValue = signal('');

  onMount(() => {
    console.log('⚔️ TodoIsland ready for quests!');
  });

  const handleAdd = () => {
    service.addTodo(inputValue.value);
    inputValue.value = '';
  };

  return (
    <div class="interactive-island todo-island" data-island="todo">
      <h3>Quest Log (Todo List)</h3>
      <p class="island-desc">Manage your tasks with Angular-inspired DI & Directives.</p>

      <div class="todo-input-group">
        <input 
          type="text" 
          placeholder="Add a new quest..." 
          value={() => inputValue.value}
          onInput={(e: InputEvent) => inputValue.value = (e.target as HTMLInputElement).value}
          onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && handleAdd()}
        />
        <button class="btn primary" onClick={handleAdd}>Add</button>
      </div>

      <div class="todo-stats">
        {() => (
          <span>
            {service.completedCount.value} / {service.totalCount.value} completed
          </span>
        )}
        <button class="btn-link" onClick={() => service.clearCompleted()}>Clear Completed</button>
      </div>

      <ul class="todo-list">
        <li n-if={service.isEmpty} class="empty-state">
          No quests found. Start by adding one!
        </li>
        
        <li n-for="todo in service.todos" class={() => todo.completed ? 'completed' : ''} key={() => todo.id}>
          <div class="todo-item">
            <input 
              type="checkbox" 
              checked={() => todo.completed} 
              onChange={() => service.toggleTodo(todo.id)} 
            />
            <span class="todo-text">{todo.text}</span>
            <button class="btn-delete" aria-label="Delete quest" onClick={() => service.removeTodo(todo.id)}>×</button>
          </div>
        </li>
      </ul>
    </div>
  );
}

// Register for client-side hydration
registerIsland('todo', TodoIsland);
