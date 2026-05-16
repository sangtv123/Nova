import { signal, computed } from '@nova/signals';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

/**
 * TodoApp - full example with signals and computed values
 */
export default function TodoApp() {
  const todos = signal<Todo[]>([]);
  const input = signal('');
  const filter = signal<'all' | 'active' | 'completed'>('all');
  let nextId = 1;

  // Computed values
  const filteredTodos = computed(() => {
    const all = todos.value;
    switch (filter.value) {
      case 'active':
        return all.filter(t => !t.completed);
      case 'completed':
        return all.filter(t => t.completed);
      default:
        return all;
    }
  });

  const stats = computed(() => ({
    total: todos.value.length,
    completed: todos.value.filter(t => t.completed).length,
    active: todos.value.filter(t => !t.completed).length,
  }));

  const addTodo = () => {
    if (input.value.trim()) {
      todos.value = [
        ...todos.value,
        {
          id: nextId++,
          text: input.value,
          completed: false,
        },
      ];
      input.value = '';
    }
  };

  const toggleTodo = (id: number) => {
    todos.value = todos.value.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
  };

  const deleteTodo = (id: number) => {
    todos.value = todos.value.filter(t => t.id !== id);
  };

  const clearCompleted = () => {
    todos.value = todos.value.filter(t => !t.completed);
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1>📝 Todo App</h1>

      {/* Input Section */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
      }}>
        <input
          type="text"
          placeholder="Add a new todo..."
          value={input.value}
          onChange={(e) => input.value = e.target.value}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
        <button
          onClick={addTodo}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Add
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
      }}>
        <div>
          <strong>Total:</strong> {stats.value.total}
        </div>
        <div>
          <strong>Active:</strong> {stats.value.active}
        </div>
        <div>
          <strong>Completed:</strong> {stats.value.completed}
        </div>
      </div>

      {/* Filter */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
      }}>
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => filter.value = f}
            style={{
              padding: '8px 12px',
              backgroundColor: filter.value === f ? '#0066cc' : '#e9ecef',
              color: filter.value === f ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div>
        {filteredTodos.value.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>
            No todos to show
          </p>
        ) : (
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}>
            {filteredTodos.value.map(todo => (
              <li
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderBottom: '1px solid #eee',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  opacity: todo.completed ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ flex: 1 }}>{todo.text}</span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Clear Completed */}
      {stats.value.completed > 0 && (
        <button
          onClick={clearCompleted}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear Completed
        </button>
      )}

      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666',
      }}>
        <p>
          This example demonstrates:
        </p>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Signals for state management</li>
          <li>Computed values for derived state</li>
          <li>Efficient re-renders (only updated items change)</li>
          <li>Event handling</li>
          <li>Conditional rendering</li>
          <li>List rendering with keys</li>
        </ul>
      </div>
    </div>
  );
}
