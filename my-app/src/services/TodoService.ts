import { signal, computed } from '@nova/signals';

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

/**
 * TodoService - Managed via Nova DI
 */
export class TodoService {
  private nextId = Date.now();
  todos = signal<Todo[]>([]);
  
  totalCount = computed(() => this.todos.value.length);
  completedCount = computed(() => this.todos.value.filter(t => t.completed).length);
  isEmpty = computed(() => this.todos.value.length === 0);

  addTodo(text: string) {
    if (!text.trim()) return;
    this.todos.value = [
      ...this.todos.value,
      { id: this.nextId++, text, completed: false }
    ];
  }

  toggleTodo(id: number) {
    this.todos.value = this.todos.value.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
  }

  removeTodo(id: number) {
    this.todos.value = this.todos.value.filter(t => t.id !== id);
  }

  clearCompleted() {
    this.todos.value = this.todos.value.filter(t => !t.completed);
  }
}
